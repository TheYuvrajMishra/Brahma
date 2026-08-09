import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// 32-byte encryption key
const SECRET_KEY = process.env.TOKEN_ENCRYPTION_KEY || 'brahma-secret-key-32-chars-long!!';

export interface EncryptedData {
    encrypted: string;
    iv: string;
    authTag: string;
}

export class CryptoUtils {
    private static getKey(): Buffer {
        return crypto.createHash('sha256').update(SECRET_KEY).digest();
    }

    static encrypt(text: string): EncryptedData {
        if (!text) return { encrypted: '', iv: '', authTag: '' };
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(ALGORITHM, this.getKey(), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag
        };
    }

    static decrypt(data: EncryptedData): string {
        if (!data || !data.encrypted || !data.iv || !data.authTag) return '';
        try {
            const decipher = crypto.createDecipheriv(
                ALGORITHM,
                this.getKey(),
                Buffer.from(data.iv, 'hex')
            );
            decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
            let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (err) {
            console.error('[CryptoUtils] Decryption failed:', err);
            return '';
        }
    }
}
