import { google, gmail_v1 } from 'googleapis';
import { ISkill } from '../types/Skill';
import { GoogleAuthUtils } from '../core/GoogleAuthUtils';
import { sanitizeEmailText } from './Writers';

function textToHtmlEmail(textBody: string): string {
    const paragraphs = textBody.split(/\n\s*\n/);
    const htmlBlocks = paragraphs.map(p => {
        const trimmed = p.trim();
        if (!trimmed) return '';
        
        const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);

        // Handle list items
        const isList = lines.every(l => /^\s*([-*•]|\d+\.)\s+/.test(l));
        if (isList) {
            const listItems = lines.map(l => `<li>${l.replace(/^\s*([-*•]|\d+\.)\s+/, '')}</li>`).join('');
            return `<ul style="margin: 12px 0; padding-left: 24px; color: #222222; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6;">${listItems}</ul>`;
        }

        // Handle sign-off block (e.g. "Best,\nYuvraj")
        const isSignoff = /^(best regards|kind regards|regards|sincerely|thanks|thank you|warmly|yours truly|cheers|best|with love),?/i.test(lines[0]);
        if (isSignoff) {
            const formattedLines = lines.join('<br>');
            return `<p style="margin: 16px 0 0 0; color: #222222; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6;">${formattedLines}</p>`;
        }

        // Regular paragraph
        const htmlText = lines.join(' ');
        return `<p style="margin: 0 0 16px 0; color: #222222; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6;">${htmlText}</p>`;
    });

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #222222; margin: 0; padding: 0;">
${htmlBlocks.filter(Boolean).join('\n')}
</body>
</html>`;
}

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
            const htmlBody = textToHtmlEmail(body);

            const emailLines = [];
            emailLines.push(`To: ${recipient}`);
            emailLines.push('Content-Type: text/html; charset=utf-8');
            emailLines.push('MIME-Version: 1.0');
            emailLines.push(`Subject: ${subject}`);
            emailLines.push('');
            emailLines.push(htmlBody);

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
