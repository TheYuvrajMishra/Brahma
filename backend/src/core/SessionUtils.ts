import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'brahma-session-secret-key-2026';

export class SessionUtils {
    static sign(userId: string): string {
        const payload = Buffer.from(JSON.stringify({ userId, created: Date.now() })).toString('base64url');
        const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
        return `${payload}.${signature}`;
    }

    static verify(token: string): string | null {
        if (!token || !token.includes('.')) return null;
        const [payload, signature] = token.split('.');
        const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
        if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
            try {
                const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
                return data.userId || null;
            } catch {
                return null;
            }
        }
        return null;
    }
}
