import { google } from 'googleapis';
import { ISkill } from '../types/Skill';

function getOAuth2Client() {
    if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REFRESH_TOKEN) {
        throw new Error('Google OAuth credentials not configured in .env (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN).');
    }
    const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        process.env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
    return oauth2Client;
}

function normalizeValues(valuesInput: any): any[][] {
    if (Array.isArray(valuesInput)) {
        if (valuesInput.length === 0) return [];
        if (Array.isArray(valuesInput[0])) {
            return valuesInput; // Already 2D array
        }
        return [valuesInput]; // 1D array to 2D single row
    }
    if (typeof valuesInput === 'string') {
        let cleanInput = valuesInput.trim();
        if (cleanInput.startsWith('```')) {
            cleanInput = cleanInput.replace(/^```[a-zA-Z0-9]*\n/, '').replace(/\n```$/, '').trim();
        }
        try {
            const parsed = JSON.parse(cleanInput);
            if (Array.isArray(parsed)) {
                return normalizeValues(parsed);
            }
        } catch {}
        return [[valuesInput]]; // Single cell
    }
    return [[String(valuesInput)]];
}

export class CreateSpreadsheet implements ISkill {
    name = 'create-spreadsheet';
    description = 'Creates a new Google Spreadsheet and returns the title, ID, and URL.';

    async execute(params: any): Promise<string> {
        const title = params.title || 'New Spreadsheet';
        try {
            const auth = getOAuth2Client();
            const sheets = google.sheets({ version: 'v4', auth });
            const response = await sheets.spreadsheets.create({
                requestBody: {
                    properties: {
                        title: title
                    }
                }
            });
            const { spreadsheetId, spreadsheetUrl } = response.data;
            return `Successfully created spreadsheet "${title}".\nID: ${spreadsheetId}\nURL: ${spreadsheetUrl}`;
        } catch (err: any) {
            console.error('[CreateSpreadsheet] Error:', err);
            throw new Error(`Failed to create spreadsheet: ${err.message}`);
        }
    }
}

export class FindSpreadsheet implements ISkill {
    name = 'find-spreadsheet';
    description = 'Searches the user\'s Google Drive for spreadsheets matching a name or query.';

    async execute(params: any): Promise<string> {
        const query = params.query || params.title || '';
        try {
            const auth = getOAuth2Client();
            const drive = google.drive({ version: 'v3', auth });
            
            // Build query
            let q = "mimeType='application/vnd.google-apps.spreadsheet' and trashed = false";
            if (query) {
                // Escape single quotes in user query
                const escapedQuery = query.replace(/'/g, "\\'");
                q += ` and name contains '${escapedQuery}'`;
            }

            const response = await drive.files.list({
                q: q,
                fields: 'files(id, name, webViewLink)',
                pageSize: 10
            });

            const files = response.data.files || [];
            if (files.length === 0) {
                return `No spreadsheets found matching "${query}".`;
            }

            const list = files.map(f => `- **${f.name}**\n  ID: ${f.id}\n  URL: ${f.webViewLink}`).join('\n\n');
            return `Found the following spreadsheet(s):\n\n${list}`;
        } catch (err: any) {
            console.error('[FindSpreadsheet] Error:', err);
            throw new Error(`Failed to find spreadsheet: ${err.message}`);
        }
    }
}

export class ReadSpreadsheet implements ISkill {
    name = 'read-spreadsheet';
    description = 'Reads and returns cell values from a Google Spreadsheet by its ID and a cell range.';

    async execute(params: any): Promise<string> {
        const spreadsheetId = params.spreadsheetId;
        const range = params.range || 'Sheet1!A1:Z100';

        if (!spreadsheetId || spreadsheetId === 'None') {
            throw new Error('Failed to read spreadsheet: No valid spreadsheetId provided.');
        }

        try {
            const auth = getOAuth2Client();
            const sheets = google.sheets({ version: 'v4', auth });
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range,
            });

            const values = response.data.values;
            if (!values || values.length === 0) {
                return `No data found in range "${range}" of spreadsheet ID "${spreadsheetId}".`;
            }

            // Convert matrix rows to string representation
            const rows = values.map((row, index) => `Row ${index + 1}: ${row.join(' | ')}`).join('\n');
            return `Successfully read range "${range}" from spreadsheet ID "${spreadsheetId}":\n\n${rows}`;
        } catch (err: any) {
            console.error('[ReadSpreadsheet] Error:', err);
            throw new Error(`Failed to read spreadsheet data: ${err.message}`);
        }
    }
}

export class WriteSpreadsheet implements ISkill {
    name = 'write-spreadsheet';
    description = 'Writes or overwrites cell values in a specified range of a Google Spreadsheet.';

    async execute(params: any): Promise<string> {
        const spreadsheetId = params.spreadsheetId;
        const range = params.range;
        const valuesInput = params.values;

        if (!spreadsheetId || spreadsheetId === 'None') {
            throw new Error('Failed to write spreadsheet: No valid spreadsheetId provided.');
        }
        if (!range) {
            throw new Error('Failed to write spreadsheet: No range provided.');
        }
        if (valuesInput === undefined) {
            throw new Error('Failed to write spreadsheet: No values provided.');
        }

        const values = normalizeValues(valuesInput);

        try {
            const auth = getOAuth2Client();
            const sheets = google.sheets({ version: 'v4', auth });
            const response = await sheets.spreadsheets.values.update({
                spreadsheetId,
                range,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: values
                }
            });

            return `Successfully updated spreadsheet ID "${spreadsheetId}" range "${range}". Updated cells: ${response.data.updatedCells || 0}.`;
        } catch (err: any) {
            console.error('[WriteSpreadsheet] Error:', err);
            throw new Error(`Failed to write spreadsheet data: ${err.message}`);
        }
    }
}

export class AppendSpreadsheet implements ISkill {
    name = 'append-spreadsheet';
    description = 'Appends rows of values to a specified sheet or range in a Google Spreadsheet.';

    async execute(params: any): Promise<string> {
        const spreadsheetId = params.spreadsheetId;
        const range = params.range || 'Sheet1';
        const valuesInput = params.values;

        if (!spreadsheetId || spreadsheetId === 'None') {
            throw new Error('Failed to append spreadsheet: No valid spreadsheetId provided.');
        }
        if (valuesInput === undefined) {
            throw new Error('Failed to append spreadsheet: No values provided.');
        }

        const values = normalizeValues(valuesInput);

        try {
            const auth = getOAuth2Client();
            const sheets = google.sheets({ version: 'v4', auth });
            const response = await sheets.spreadsheets.values.append({
                spreadsheetId,
                range,
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                requestBody: {
                    values: values
                }
            });

            const updatedRange = response.data.updates?.updatedRange || range;
            return `Successfully appended data to spreadsheet ID "${spreadsheetId}" at range "${updatedRange}".`;
        } catch (err: any) {
            console.error('[AppendSpreadsheet] Error:', err);
            throw new Error(`Failed to append spreadsheet data: ${err.message}`);
        }
    }
}

export class BatchUpdateSpreadsheet implements ISkill {
    name = 'batch-update-spreadsheet';
    description = 'Executes a batch of updates (e.g. formatting cells, renaming sheets, adding sheets) on a Google Spreadsheet.';

    async execute(params: any): Promise<string> {
        const spreadsheetId = params.spreadsheetId;
        let requests = params.requests;

        if (!spreadsheetId || spreadsheetId === 'None') {
            throw new Error('Failed to batch update: No valid spreadsheetId provided.');
        }
        if (!requests) {
            throw new Error('Failed to batch update: No requests provided.');
        }

        if (typeof requests === 'string') {
            let cleanRequests = requests.trim();
            if (cleanRequests.startsWith('```')) {
                cleanRequests = cleanRequests.replace(/^```[a-zA-Z0-9]*\n/, '').replace(/\n```$/, '').trim();
            }
            try {
                requests = JSON.parse(cleanRequests);
            } catch {
                throw new Error('Failed to batch update: Invalid JSON string provided for requests parameter.');
            }
        }

        if (!Array.isArray(requests)) {
            throw new Error('Failed to batch update: Requests parameter must be an array.');
        }

        try {
            const auth = getOAuth2Client();
            const sheets = google.sheets({ version: 'v4', auth });
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: requests
                }
            });

            return `Successfully executed ${requests.length} batch updates on spreadsheet ID "${spreadsheetId}".`;
        } catch (err: any) {
            console.error('[BatchUpdateSpreadsheet] Error:', err);
            throw new Error(`Failed to execute batch updates: ${err.message}`);
        }
    }
}

export class AddCheckboxes implements ISkill {
    name = 'add-checkboxes';
    description = 'Adds checkboxes (boolean data validation) to a specified range (e.g. Sheet1!C2:C100) in a Google Spreadsheet.';

    async execute(params: any): Promise<string> {
        const spreadsheetId = params.spreadsheetId;
        const range = params.range;

        if (!spreadsheetId || spreadsheetId === 'None') {
            throw new Error('Failed to add checkboxes: No valid spreadsheetId provided.');
        }
        if (!range) {
            throw new Error('Failed to add checkboxes: No range provided.');
        }

        try {
            const auth = getOAuth2Client();
            const sheets = google.sheets({ version: 'v4', auth });
            
            // Fetch sheet metadata to resolve sheetId
            const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
            
            let sheetName = 'Sheet1';
            let a1Range = range;
            if (range.includes('!')) {
                const parts = range.split('!');
                sheetName = parts[0].replace(/'/g, ''); // strip single quotes if any
                a1Range = parts[1];
            }

            const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === sheetName);
            if (!sheet) {
                throw new Error(`Sheet "${sheetName}" not found in spreadsheet.`);
            }
            const sheetId = sheet.properties?.sheetId || 0;

            const colNameToIndex = (name: string): number => {
                let index = 0;
                for (let i = 0; i < name.length; i++) {
                    index = index * 26 + (name.charCodeAt(i) - 64);
                }
                return index - 1;
            };

            let startColumnIndex: number | undefined;
            let endColumnIndex: number | undefined;
            let startRowIndex: number | undefined;
            let endRowIndex: number | undefined;

            const rangeMatch = a1Range.match(/^([A-Z]+)(\d+)(?::([A-Z]+)(\d*))?$/i);
            if (rangeMatch) {
                const startColName = rangeMatch[1].toUpperCase();
                startRowIndex = parseInt(rangeMatch[2], 10) - 1;
                
                if (rangeMatch[3]) {
                    const endColName = rangeMatch[3].toUpperCase();
                    startColumnIndex = colNameToIndex(startColName);
                    endColumnIndex = colNameToIndex(endColName) + 1;
                    
                    if (rangeMatch[4]) {
                        endRowIndex = parseInt(rangeMatch[4], 10);
                    }
                } else {
                    // Single cell e.g. "C2"
                    startColumnIndex = colNameToIndex(startColName);
                    endColumnIndex = startColumnIndex + 1;
                    endRowIndex = startRowIndex + 1;
                }
            } else {
                // Column-only range e.g. "C:C"
                const colRangeMatch = a1Range.match(/^([A-Z]+):([A-Z]+)$/i);
                if (colRangeMatch) {
                    startColumnIndex = colNameToIndex(colRangeMatch[1].toUpperCase());
                    endColumnIndex = colNameToIndex(colRangeMatch[2].toUpperCase()) + 1;
                } else {
                    throw new Error(`Invalid range format "${range}". Expected formats like "Sheet1!C2:C100", "Sheet1!C2:C", or "Sheet1!C:C".`);
                }
            }

            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [
                        {
                            setDataValidation: {
                                range: {
                                    sheetId,
                                    startRowIndex,
                                    endRowIndex,
                                    startColumnIndex,
                                    endColumnIndex
                                },
                                rule: {
                                    condition: {
                                        type: 'BOOLEAN'
                                    },
                                    showCustomUi: true
                                }
                            }
                        }
                    ]
                }
            });

            return `Successfully added checkboxes to spreadsheet ID "${spreadsheetId}" in range "${range}".`;
        } catch (err: any) {
            console.error('[AddCheckboxes] Error:', err);
            throw new Error(`Failed to add checkboxes: ${err.message}`);
        }
    }
}

