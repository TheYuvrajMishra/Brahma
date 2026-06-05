import { google, gmail_v1 } from 'googleapis';
import { ISkill } from '../types/Skill';

export class SendEmail implements ISkill {
    name = 'send-email';
    description = 'Sends an email to a specified recipient using Gmail.';

    async execute(params: any): Promise<string> {
        const recipient = params.recipient;
        const subject = params.subject || 'No Subject';
        let body = params.body || '';

        if (params._dependency_context) {
            // Include outputs from previous steps so the LLM doesn't just email "{{summary}}"
            body += '\n\n' + params._dependency_context;
        }

        if (!recipient) {
            return 'Failed to send email: No recipient provided.';
        }

        if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REFRESH_TOKEN) {
            return 'Failed to send email: Gmail credentials not configured in .env.';
        }

        try {
            const oauth2Client = new google.auth.OAuth2(
                process.env.GMAIL_CLIENT_ID,
                process.env.GMAIL_CLIENT_SECRET,
                process.env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
            );

            oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

            const emailLines = [];
            emailLines.push(`To: ${recipient}`);
            emailLines.push('Content-type: text/plain;charset=utf-8');
            emailLines.push('MIME-Version: 1.0');
            emailLines.push(`Subject: ${subject}`);
            emailLines.push('');
            emailLines.push(body);

            const emailRaw = Buffer.from(emailLines.join('\r\n'))
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: emailRaw
                }
            });

            return `Successfully sent email to ${recipient} with subject "${subject}".`;
        } catch (err: any) {
            console.error('[SendEmail] Error sending email:', err);
            return `Failed to send email: ${err.message}`;
        }
    }
}
