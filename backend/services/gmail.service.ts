import { google } from 'googleapis';
import * as dotenv from 'dotenv';
dotenv.config();

export class GmailService {
  private static oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );

  private static get gmail() {
    this.oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
    return google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  public static async readEmails(maxResults: number = 3, query?: string): Promise<string> {
    const gmail = this.gmail;
    try {
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query
      });

      const messages = response.data.messages || [];
      if (messages.length === 0) return 'No emails found matching the criteria.';

      const parsedEmails = await Promise.all(messages.map(async (msg) => {
        const msgData = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'full'
        });
        
        const payload = msgData.data.payload;
        const headers = payload?.headers || [];
        const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
        const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
        const date = headers.find(h => h.name === 'Date')?.value || 'Unknown Date';
        const snippet = msgData.data.snippet || '';

        return `From: ${from}\nDate: ${date}\nSubject: ${subject}\nSnippet: ${snippet}`;
      }));

      return `**Recent Emails**\n\n` + parsedEmails.join('\n\n---\n\n');
    } catch (err: any) {
      console.error('Error reading emails:', err);
      return `Failed to read emails: ${err.message}`;
    }
  }

  public static async sendEmail(to: string, subject: string, body: string): Promise<string> {
    const gmail = this.gmail;
    try {
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
      const messageParts = [
        `To: ${to}`,
        `Subject: ${utf8Subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=utf-8',
        '',
        body,
      ];
      const message = messageParts.join('\n');
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      return `📧 Email sent successfully to \`${to}\` with subject **"${subject}"**.`;
    } catch (err: any) {
      console.error('Error sending email:', err);
      return `Failed to send email: ${err.message}`;
    }
  }
}
