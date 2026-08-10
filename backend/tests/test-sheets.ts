import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { CreateSpreadsheet, FindSpreadsheet, WriteSpreadsheet, ReadSpreadsheet } from '../src/skills/GoogleSheets';

async function runTest() {
    console.log('--- Testing Google Sheets Skills Integration ---');
    console.log('Checking environment variables...');
    console.log('GMAIL_CLIENT_ID:', process.env.GMAIL_CLIENT_ID ? 'Configured' : 'Missing');
    console.log('GMAIL_CLIENT_SECRET:', process.env.GMAIL_CLIENT_SECRET ? 'Configured' : 'Missing');
    console.log('GMAIL_REFRESH_TOKEN:', process.env.GMAIL_REFRESH_TOKEN ? 'Configured' : 'Missing');

    if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REFRESH_TOKEN) {
        console.error('ERROR: Google OAuth credentials are not fully configured in your .env file.');
        return;
    }

    try {
        // 1. Create Spreadsheet
        console.log('\n1. Creating spreadsheet...');
        const createSkill = new CreateSpreadsheet();
        const createRes = await createSkill.execute({ title: `Brahma Test Sheet - ${new Date().toLocaleDateString()}` });
        console.log('Result:\n', createRes);

        if (createRes.startsWith('Failed')) {
            console.warn('\nNote: If the failure is due to "Insufficient Permission" or "403", you need to update the Google OAuth scope to include Sheets/Drive.');
            return;
        }

        // Extract spreadsheet ID
        const idMatch = createRes.match(/ID:\s*([a-zA-Z0-9-_]+)/);
        if (!idMatch) {
            console.error('Failed to extract Spreadsheet ID from creation response.');
            return;
        }
        const spreadsheetId = idMatch[1];
        console.log(`Extracted Spreadsheet ID: ${spreadsheetId}`);

        // 2. Find Spreadsheet
        console.log('\n2. Finding spreadsheet...');
        try {
            const findSkill = new FindSpreadsheet();
            const findRes = await findSkill.execute({ query: 'Brahma Test Sheet' });
            console.log('Result:\n', findRes);
        } catch (findErr: any) {
            console.warn('\n[Warning] Finding spreadsheet failed. This is expected if Google Drive API is not enabled in Cloud Console. Details:', findErr.message);
            console.log('Continuing to test direct Sheets API read/write operations...');
        }

        // 3. Write Data
        console.log('\n3. Writing data...');
        const writeSkill = new WriteSpreadsheet();
        const writeRes = await writeSkill.execute({
            spreadsheetId,
            range: 'Sheet1!A1:C2',
            values: [
                ['Key', 'Feature', 'Status'],
                ['1', 'Google Sheets Support', 'Success']
            ]
        });
        console.log('Result:\n', writeRes);

        // 4. Read Data
        console.log('\n4. Reading data...');
        const readSkill = new ReadSpreadsheet();
        const readRes = await readSkill.execute({
            spreadsheetId,
            range: 'Sheet1!A1:C2'
        });
        console.log('Result:\n', readRes);

    } catch (err: any) {
        console.error('Test execution failed:', err);
    }
}

runTest();
