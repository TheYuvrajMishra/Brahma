import { google, gmail_v1 } from 'googleapis';
import { ISkill } from '../types/Skill';
import { GoogleAuthUtils } from '../core/GoogleAuthUtils';
import { sanitizeEmailText } from './Writers';

export class SendEmail implements ISkill {
    name = 'send-email';
    description = 'Sends an email to a specified recipient using Gmail.';

    async execute(params: any): Promise<string> {
        const recipient = params.recipient;
        const subject = params.subject || 'No Subject';
        let body = params.body || '';
        const userId = params._user_id || params.user_id || params.userId;
        
        body = sanitizeEmailText(body);

        if (!recipient) {
            return 'Failed to send email: No recipient provided.';
        }

        if (!body) {
            return 'Failed to send email: Email body is empty after sanitization.';
        }

        try {
            const oauth2Client = await GoogleAuthUtils.getOAuth2ClientForUser(userId);
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
