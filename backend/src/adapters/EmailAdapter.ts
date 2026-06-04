import { google, gmail_v1 } from 'googleapis';
import { Adapter } from './Adapter';
import { NormalizedMessage, PipelineResponse } from '../types/Message';
import { config } from '../config';

export class EmailAdapter implements Adapter {
    private onMessageCallback: ((msg: NormalizedMessage) => void) | null = null;
    private gmail: gmail_v1.Gmail | null = null;
    private checkIntervalMs = 30000; // Check every 30 seconds

    constructor() {
        if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REFRESH_TOKEN) {
            console.warn('[EmailAdapter] Gmail credentials not fully configured in .env. Email Adapter will NOT start.');
            return;
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET,
            process.env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
        );

        oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

        this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    }

    async init(onMessage: (msg: NormalizedMessage) => void): Promise<void> {
        this.onMessageCallback = onMessage;
        
        if (this.gmail) {
            console.log('[EmailAdapter] Initialized. Starting email polling...');
            this.startPolling();
        }
    }

    private async startPolling() {
        setInterval(async () => {
            if (!this.gmail) return;

            try {
                // Fetch unread emails in Inbox
                const res = await this.gmail.users.messages.list({
                    userId: 'me',
                    q: 'is:unread in:inbox'
                });

                const messages = res.data.messages;
                if (!messages || messages.length === 0) return;

                for (const msg of messages) {
                    await this.processMessage(msg.id!);
                }

            } catch (err) {
                console.error('[EmailAdapter] Error polling emails:', err);
            }
        }, this.checkIntervalMs);
    }

    private async processMessage(messageId: string) {
        if (!this.gmail) return;

        try {
            const msgData = await this.gmail.users.messages.get({
                userId: 'me',
                id: messageId,
                format: 'full'
            });

            const headers = msgData.data.payload?.headers;
            const subjectHeader = headers?.find(h => h.name === 'Subject');
            const fromHeader = headers?.find(h => h.name === 'From');

            const subject = subjectHeader ? subjectHeader.value : 'No Subject';
            const sender = fromHeader ? fromHeader.value : 'Unknown Sender';

            // Extract body (very naive extraction for MVP)
            let bodyText = '';
            const parts = msgData.data.payload?.parts;
            if (parts && parts.length > 0) {
                const textPart = parts.find(p => p.mimeType === 'text/plain');
                if (textPart && textPart.body?.data) {
                    bodyText = Buffer.from(textPart.body.data, 'base64').toString('utf8');
                }
            } else if (msgData.data.payload?.body?.data) {
                bodyText = Buffer.from(msgData.data.payload.body.data, 'base64').toString('utf8');
            }

            console.log(`[EmailAdapter] Received email from ${sender}: ${subject}`);

            // Mark as read (remove UNREAD label)
            await this.gmail.users.messages.modify({
                userId: 'me',
                id: messageId,
                requestBody: {
                    removeLabelIds: ['UNREAD']
                }
            });

            if (this.onMessageCallback) {
                const combinedContent = `Subject: ${subject}\n\n${bodyText}`;
                const normalizedMsg: NormalizedMessage = {
                    message_id: messageId,
                    platform: 'email',
                    channel_id: sender || 'email',
                    user_id: sender || 'email',
                    content: combinedContent.trim(),
                    timestamp: new Date()
                };
                this.onMessageCallback(normalizedMsg);
            }

        } catch (err) {
            console.error(`[EmailAdapter] Failed to process message ${messageId}:`, err);
        }
    }

    async emit(response: PipelineResponse): Promise<void> {
        if (!this.gmail) return;

        try {
            const recipient = response.originalMessage.user_id; // Extract email address
            
            // Build RFC 2822 email format
            const emailLines = [];
            emailLines.push(`To: ${recipient}`);
            emailLines.push('Content-type: text/plain;charset=utf-8');
            emailLines.push('MIME-Version: 1.0');
            emailLines.push(`Subject: Re: Your request to Brahma`);
            emailLines.push('');
            emailLines.push(response.content);

            const emailRaw = Buffer.from(emailLines.join('\n'))
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            await this.gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: emailRaw
                }
            });

            console.log(`[EmailAdapter] Replied to ${recipient}`);
        } catch (err) {
            console.error('[EmailAdapter] Failed to emit email:', err);
        }
    }
}
