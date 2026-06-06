import { google } from 'googleapis';
import { ISkill } from '../types/Skill';

export class GetEmails implements ISkill {
    name = 'get-emails';
    description = 'Retrieves a list of recent emails from the inbox with their details.';

    async execute(params: any): Promise<string> {
        const maxResults = params.max_results || 5;
        const query = params.query || '';

        if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REFRESH_TOKEN) {
            return 'Failed to retrieve emails: Gmail credentials not configured in .env.';
        }

        try {
            const oauth2Client = new google.auth.OAuth2(
                process.env.GMAIL_CLIENT_ID,
                process.env.GMAIL_CLIENT_SECRET,
                process.env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
            );

            oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

            const listResponse = await gmail.users.messages.list({
                userId: 'me',
                maxResults: maxResults,
                q: query
            });

            const messages = listResponse.data.messages || [];
            if (messages.length === 0) {
                return 'No messages found in your inbox.';
            }

            const emailSummaries: string[] = [];

            for (const msg of messages) {
                if (!msg.id) continue;
                const msgDetails = await gmail.users.messages.get({
                    userId: 'me',
                    id: msg.id,
                    format: 'full'
                });

                const headers = msgDetails.data.payload?.headers || [];
                const subject = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || 'No Subject';
                const from = headers.find(h => h.name?.toLowerCase() === 'from')?.value || 'Unknown Sender';
                const date = headers.find(h => h.name?.toLowerCase() === 'date')?.value || 'Unknown Date';
                const snippet = msgDetails.data.snippet || '';

                const body = this.extractBodyText(msgDetails.data.payload);
                const bodyText = body.trim() || snippet;
                const truncatedBody = bodyText.length > 500 ? bodyText.substring(0, 500) + '...' : bodyText;

                emailSummaries.push(
                    `Email ID: ${msg.id}\nFrom: ${from}\nDate: ${date}\nSubject: ${subject}\nSnippet: ${snippet}\nBody:\n${truncatedBody}`
                );
            }

            return emailSummaries.join('\n\n=================================\n\n');
        } catch (err: any) {
            console.error('[GetEmails] Error fetching emails:', err);
            return `Failed to retrieve emails: ${err.message}`;
        }
    }

    private extractBodyText(payload: any): string {
        if (!payload) return '';

        // Case 1: Direct body data
        if (payload.body?.data) {
            return Buffer.from(payload.body.data, 'base64').toString('utf-8');
        }

        // Case 2: Multipart body
        if (payload.parts) {
            for (const part of payload.parts) {
                // If it is text/plain, return its body
                if (part.mimeType === 'text/plain' && part.body?.data) {
                    return Buffer.from(part.body.data, 'base64').toString('utf-8');
                }
                
                // If it is a nested multipart, recurse
                if (part.parts) {
                    const nested = this.extractBodyText(part);
                    if (nested) return nested;
                }
            }
            
            // Fallback to text/html if text/plain was not found
            for (const part of payload.parts) {
                if (part.mimeType === 'text/html' && part.body?.data) {
                    return Buffer.from(part.body.data, 'base64').toString('utf-8');
                }
            }
        }

        return '';
    }
}
