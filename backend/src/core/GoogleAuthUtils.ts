import { google } from 'googleapis';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { CryptoUtils } from './CryptoUtils';

export class GoogleAuthUtils {
    static async getOAuth2ClientForUser(userId?: string) {
        const clientId = process.env.GMAIL_CLIENT_ID;
        const clientSecret = process.env.GMAIL_CLIENT_SECRET;
        const redirectUri = process.env.GMAIL_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';

        if (!clientId || !clientSecret) {
            throw new Error('Google OAuth Client ID or Secret not configured in environment.');
        }

        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

        if (userId) {
            let user = null;
            if (mongoose.Types.ObjectId.isValid(userId)) {
                user = await User.findById(userId);
            }
            if (!user) {
                user = await User.findOne({ $or: [{ googleId: userId }, { email: userId }] });
            }

            if (user && user.encryptedRefreshToken && user.refreshTokenIv && user.refreshTokenTag) {
                const refreshToken = CryptoUtils.decrypt({
                    encrypted: user.encryptedRefreshToken,
                    iv: user.refreshTokenIv,
                    authTag: user.refreshTokenTag
                });
                let accessToken = '';
                if (user.encryptedAccessToken && user.accessTokenIv && user.accessTokenTag) {
                    accessToken = CryptoUtils.decrypt({
                        encrypted: user.encryptedAccessToken,
                        iv: user.accessTokenIv,
                        authTag: user.accessTokenTag
                    });
                }
                oauth2Client.setCredentials({
                    refresh_token: refreshToken,
                    access_token: accessToken || undefined
                });
                return oauth2Client;
            }
        }

        if (process.env.GMAIL_REFRESH_TOKEN) {
            oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
            return oauth2Client;
        }

        throw new Error('Google OAuth refresh token not connected for this user.');
    }
}
