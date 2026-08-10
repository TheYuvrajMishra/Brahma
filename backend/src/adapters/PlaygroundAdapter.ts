import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { Adapter } from './Adapter';
import { NormalizedMessage, PipelineResponse } from '../types/Message';
import { ChatSession } from '../models/ChatSession';
import { SessionContext } from '../models/SessionContext';
import { User } from '../models/User';
import { config } from '../config';
import { EventBus, SystemEvents } from '../core/EventBus';
import { CryptoUtils } from '../core/CryptoUtils';
import { SessionUtils } from '../core/SessionUtils';
import { MemoryManager } from '../core/MemoryManager';
import { ContextStoreManager } from '../core/ContextStoreManager';
import { Logger } from '../core/Logger';

function parseCookies(header?: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    if (!header) return cookies;
    const parts = header.split(';');
    for (const part of parts) {
        const [name, ...val] = part.trim().split('=');
        if (name && val.length > 0) {
            cookies[name] = decodeURIComponent(val.join('='));
        }
    }
    return cookies;
}

function getUserIdFromReq(req: express.Request): string | null {
    const cookies = parseCookies(req.headers.cookie);
    if (cookies.brahma_session) {
        const userId = SessionUtils.verify(cookies.brahma_session);
        if (userId) return userId;
    }
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const userId = SessionUtils.verify(token);
        if (userId) return userId;
    }
    return null;
}

function getUserIdFromSocket(socket: Socket): string | null {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    if (cookies.brahma_session) {
        const userId = SessionUtils.verify(cookies.brahma_session);
        if (userId) return userId;
    }
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (typeof token === 'string') {
        const userId = SessionUtils.verify(token);
        if (userId) return userId;
    }
    return null;
}

export class PlaygroundAdapter implements Adapter {
    private io: Server;
    private onMessageCallback: ((msg: NormalizedMessage) => void) | null = null;
    private socketMap: Map<string, Socket> = new Map(); // message_id -> Socket
    private sessionMap: Map<string, string> = new Map(); // message_id -> sessionId
    private telemetryMap: Map<string, any[]> = new Map(); // message_id -> TelemetryStep[]
    private regenerationMap: Map<string, { sessionId: string; assistantMessageId: string }> = new Map();

    constructor(private port: number = 5000) {
        const app = express();
        const httpServer = createServer(app);
        this.io = new Server(httpServer, {
            cors: { origin: '*', credentials: true }
        });

        this.setupTelemetryBus();

        // CORS and JSON Middleware
        app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
            res.header('Access-Control-Allow-Credentials', 'true');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-file-name');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            if (req.method === 'OPTIONS') {
                return res.sendStatus(200);
            }
            next();
        });
        app.use(express.json());
        app.use(express.static(path.join(__dirname, '../../public')));

        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // File upload endpoint for converting document to markdown
        app.post('/api/upload', (req, res) => {
            let fileData: Buffer[] = [];
            let fileName = req.headers['x-file-name'] ? String(req.headers['x-file-name']) : `upload_${Date.now()}`;
            
            req.on('data', chunk => fileData.push(chunk));
            req.on('end', async () => {
                try {
                    const buffer = Buffer.concat(fileData);
                    const safePath = path.join(uploadDir, `${Date.now()}_${fileName}`);
                    fs.writeFileSync(safePath, buffer);

                    const converter = new (require('../skills/ConvertDocument').ConvertDocumentToMarkdown)();
                    const markdown = await converter.execute({ filePath: safePath });

                    res.json({ success: true, fileName, filePath: safePath, markdown });
                } catch (err: any) {
                    console.error('[Upload] Failed to process document:', err);
                    res.status(500).json({ success: false, error: err.message });
                }
            });
        });

        // ── Auth Endpoints ──────────────────────────────────────────

        app.get('/api/auth/me', async (req, res) => {
            const userId = getUserIdFromReq(req);
            if (!userId) {
                return res.json({ authenticated: false });
            }
            try {
                const user = await User.findById(userId);
                if (!user) {
                    return res.json({ authenticated: false });
                }
                return res.json({
                    authenticated: true,
                    user: {
                        id: user._id,
                        googleId: user.googleId,
                        email: user.email,
                        name: user.name,
                        picture: user.picture,
                        onboardingCompleted: user.onboardingCompleted,
                        profileDetails: user.profileDetails,
                        preferences: user.preferences,
                        dislikes: user.dislikes,
                        interactionStyle: user.interactionStyle
                    }
                });
            } catch (err) {
                return res.json({ authenticated: false });
            }
        });

        app.get('/api/auth/google/url', (req, res) => {
            const clientId = process.env.GMAIL_CLIENT_ID;
            if (!clientId) {
                return res.status(500).json({ error: 'GMAIL_CLIENT_ID is not configured in backend environment.' });
            }
            const redirectUri = process.env.GMAIL_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';
            const scopes = [
                'https://mail.google.com/',
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/calendar.events',
                'https://www.googleapis.com/auth/drive',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile'
            ];
            const scopeStr = encodeURIComponent(scopes.join(' '));
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopeStr}&access_type=offline&prompt=consent`;

            res.json({ url: authUrl });
        });

        app.get('/api/auth/google/callback', async (req, res) => {
            const code = req.query.code as string;
            if (!code) {
                return res.status(400).send('<script>window.opener?.postMessage({type:"GOOGLE_AUTH_SUCCESS", success:false, error:"No code provided"}, "*"); window.close();</script>');
            }

            try {
                const clientId = process.env.GMAIL_CLIENT_ID;
                const clientSecret = process.env.GMAIL_CLIENT_SECRET;
                const redirectUri = process.env.GMAIL_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';

                const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        code,
                        client_id: clientId || '',
                        client_secret: clientSecret || '',
                        redirect_uri: redirectUri,
                        grant_type: 'authorization_code'
                    })
                });

                const tokens: any = await tokenRes.json();

                if (!tokenRes.ok || (!tokens.access_token && !tokens.refresh_token)) {
                    const errDetail = tokens.error_description || tokens.error || 'Failed to obtain Google tokens';
                    return res.send(`<script>window.opener?.postMessage({type:"GOOGLE_AUTH_SUCCESS", success:false, error:"${errDetail}"}, "*"); window.close();</script>`);
                }

                // Fetch Google User Profile
                let email = '';
                let picture = '';
                let name = '';
                let googleId = '';

                if (tokens.access_token) {
                    try {
                        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                            headers: { Authorization: `Bearer ${tokens.access_token}` }
                        });
                        const userData: any = await userRes.json();
                        email = userData.email || '';
                        picture = userData.picture || '';
                        name = userData.name || '';
                        googleId = userData.id || '';
                    } catch (e) {
                        console.warn('[Playground] Could not fetch Google user profile:', e);
                    }
                }

                if (!googleId && !email) {
                    return res.send(`<script>window.opener?.postMessage({type:"GOOGLE_AUTH_SUCCESS", success:false, error:"Could not fetch user profile from Google"}, "*"); window.close();</script>`);
                }

                // Encrypt tokens at rest
                const encAccess = tokens.access_token ? CryptoUtils.encrypt(tokens.access_token) : { encrypted: '', iv: '', authTag: '' };
                const encRefresh = tokens.refresh_token ? CryptoUtils.encrypt(tokens.refresh_token) : { encrypted: '', iv: '', authTag: '' };

                let user = await User.findOne({ $or: [{ googleId }, { email }] });
                if (!user) {
                    user = new User({
                        googleId: googleId || email,
                        email,
                        name,
                        picture,
                        encryptedAccessToken: encAccess.encrypted,
                        accessTokenIv: encAccess.iv,
                        accessTokenTag: encAccess.authTag,
                        encryptedRefreshToken: encRefresh.encrypted,
                        refreshTokenIv: encRefresh.iv,
                        refreshTokenTag: encRefresh.authTag,
                        onboardingCompleted: false
                    });
                } else {
                    user.name = name || user.name;
                    user.picture = picture || user.picture;
                    if (tokens.access_token) {
                        user.encryptedAccessToken = encAccess.encrypted;
                        user.accessTokenIv = encAccess.iv;
                        user.accessTokenTag = encAccess.authTag;
                    }
                    if (tokens.refresh_token) {
                        user.encryptedRefreshToken = encRefresh.encrypted;
                        user.refreshTokenIv = encRefresh.iv;
                        user.refreshTokenTag = encRefresh.authTag;
                    }
                }
                await user.save();

                // Ensure per-user brain instance directory exists
                MemoryManager.ensureUserBrain(user._id.toString());

                // Set signed session cookie
                const sessionToken = SessionUtils.sign(user._id.toString());
                res.cookie('brahma_session', sessionToken, {
                    httpOnly: true,
                    sameSite: 'lax',
                    path: '/',
                    maxAge: 30 * 24 * 60 * 60 * 1000
                });

                this.io.emit('google:connected', { connected: true, email, picture, userId: user._id.toString() });

                res.send(`
                    <html>
                        <body style="background:#09090b;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
                            <div style="text-align:center;background:#18181b;padding:30px;border-radius:16px;border:1px solid #27272a;">
                                <h2 style="color:#34d399;margin-top:0;">Google Account Connected!</h2>
                                <p style="color:#a1a1aa;">Closing window and returning to Brahma...</p>
                            </div>
                            <script>
                                if (window.opener) {
                                    window.opener.postMessage({
                                        type: "GOOGLE_AUTH_SUCCESS",
                                        success: true,
                                        email: "${email}",
                                        userId: "${user._id.toString()}",
                                        onboardingCompleted: ${user.onboardingCompleted}
                                    }, "*");
                                }
                                setTimeout(() => window.close(), 1000);
                            </script>
                        </body>
                    </html>
                `);
            } catch (err: any) {
                console.error('[Playground] OAuth callback failed:', err);
                res.send(`<script>window.opener?.postMessage({type:"GOOGLE_AUTH_SUCCESS", success:false, error:"${err.message}"}, "*"); window.close();</script>`);
            }
        });

        app.post('/api/auth/onboard', async (req, res) => {
            const userId = getUserIdFromReq(req);
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            try {
                const user = await User.findById(userId);
                if (!user) {
                    return res.status(404).json({ success: false, error: 'User not found' });
                }

                const { displayName, role, location, preferredHandle, preferences, dislikes, interactionStyle } = req.body;

                user.profileDetails = {
                    displayName: displayName || user.name,
                    role: role || '',
                    location: location || '',
                    preferredHandle: preferredHandle || user.email
                };
                user.preferences = preferences || '';
                user.dislikes = dislikes || '';
                user.interactionStyle = interactionStyle || 'conversational';
                user.onboardingCompleted = true;

                await user.save();

                // Seed dedicated brain core/* files with user profile & preferences
                await MemoryManager.seedUserBrain(userId, {
                    displayName: user.profileDetails.displayName,
                    role: user.profileDetails.role,
                    location: user.profileDetails.location,
                    preferredHandle: user.profileDetails.preferredHandle,
                    preferences: user.preferences,
                    dislikes: user.dislikes,
                    interactionStyle: user.interactionStyle
                });

                return res.json({ success: true, user });
            } catch (err: any) {
                console.error('[Playground] Onboarding error:', err);
                return res.status(500).json({ success: false, error: err.message });
            }
        });

        app.post('/api/auth/logout', (req, res) => {
            res.clearCookie('brahma_session', { path: '/' });
            res.json({ success: true });
        });

        app.post('/api/auth/reset-account', async (req, res) => {
            const userId = getUserIdFromReq(req);
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            try {
                // 1. Delete all user chat sessions from MongoDB
                await ChatSession.deleteMany({ userId });

                // 2. Delete all user session contexts from MongoDB
                await SessionContext.deleteMany({ userId });

                // 3. Clear entity search cache for user
                ContextStoreManager.clear(userId);

                // 4. Delete user dedicated brain files on disk
                await MemoryManager.deleteUserBrain(userId);

                // 5. Reset user onboarding flags and profile details in MongoDB
                const user = await User.findById(userId);
                if (user) {
                    user.onboardingCompleted = false;
                    user.profileDetails = undefined;
                    user.preferences = undefined;
                    user.dislikes = undefined;
                    user.interactionStyle = undefined;
                    await user.save();
                }

                Logger.audit('ACCOUNT_RESET', { userId });
                return res.json({ success: true, message: 'Account and brain context reset successfully.', user });
            } catch (err: any) {
                console.error('[Playground] Account reset error:', err);
                return res.status(500).json({ success: false, error: err.message });
            }
        });

        // ── Per-User Context File Endpoints ─────────────────────────

        app.get('/api/context/:file', async (req, res) => {
            const userId = getUserIdFromReq(req);
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized context access' });
            }
            const fileName = req.params.file;
            const allowed = ['atman.md', 'zehn.md', 'moment.md', 'hunar.md', 'planner.md', 'executor.md', 'researcher.md'];
            if (!allowed.includes(fileName)) {
                return res.status(400).json({ success: false, error: 'Invalid context file' });
            }

            try {
                const userBrainPath = MemoryManager.getUserBrainPath(userId);
                const filePath = path.join(userBrainPath, fileName);
                if (!fs.existsSync(filePath)) {
                    return res.status(404).json({ success: false, error: 'File not found' });
                }
                const content = await fs.promises.readFile(filePath, 'utf-8');
                res.json({ success: true, fileName, content });
            } catch (err: any) {
                res.status(500).json({ success: false, error: err.message });
            }
        });

        app.post('/api/context/:file', async (req, res) => {
            const userId = getUserIdFromReq(req);
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized context write' });
            }
            const fileName = req.params.file;
            const allowed = ['atman.md', 'zehn.md', 'moment.md', 'hunar.md', 'planner.md', 'executor.md', 'researcher.md'];
            if (!allowed.includes(fileName)) {
                return res.status(400).json({ success: false, error: 'Invalid context file' });
            }
            const { content } = req.body;
            if (typeof content !== 'string') {
                return res.status(400).json({ success: false, error: 'Content must be string' });
            }

            try {
                const userBrainPath = MemoryManager.getUserBrainPath(userId);
                const filePath = path.join(userBrainPath, fileName);
                await fs.promises.writeFile(filePath, content, 'utf-8');
                res.json({ success: true, fileName });
            } catch (err: any) {
                res.status(500).json({ success: false, error: err.message });
            }
        });

        // ── WebSocket Communication ──────────────────────────────────

        this.io.on('connection', (socket: Socket) => {
            const userId = getUserIdFromSocket(socket);
            if (userId) {
                socket.data.userId = userId;
            }

            socket.on('google:status', async (callback?: (data: any) => void) => {
                const activeUserId = socket.data.userId || getUserIdFromSocket(socket);
                if (activeUserId) {
                    try {
                        const user = await User.findById(activeUserId);
                        if (user) {
                            if (callback) callback({ connected: !!user.encryptedRefreshToken, email: user.email, picture: user.picture });
                            return;
                        }
                    } catch {}
                }
                if (callback) callback({ connected: false });
            });

            // ── Brain Context Files (Strictly Scoped Per-User) ──────────────────────────

            socket.on('brain:list', async (callback?: (data: any) => void) => {
                const activeUserId = socket.data.userId || getUserIdFromSocket(socket);
                if (!activeUserId) {
                    if (callback) callback({ success: false, error: 'Unauthenticated' });
                    return;
                }
                try {
                    const userBrainPath = MemoryManager.getUserBrainPath(activeUserId);
                    const files = fs.readdirSync(userBrainPath).filter(f => f.endsWith('.md'));
                    if (callback) callback({ success: true, files });
                } catch (err: any) {
                    if (callback) callback({ success: false, error: err.message });
                }
            });

            socket.on('brain:read', async (filename: string, callback?: (data: any) => void) => {
                const activeUserId = socket.data.userId || getUserIdFromSocket(socket);
                if (!activeUserId) {
                    if (callback) callback({ success: false, error: 'Unauthenticated' });
                    return;
                }
                const allowed = ['atman.md', 'zehn.md', 'moment.md', 'hunar.md', 'planner.md', 'executor.md', 'researcher.md'];
                if (!allowed.includes(filename)) {
                    if (callback) callback({ success: false, error: 'Invalid filename' });
                    return;
                }
                try {
                    const userBrainPath = MemoryManager.getUserBrainPath(activeUserId);
                    const filePath = path.join(userBrainPath, filename);
                    const content = await fs.promises.readFile(filePath, 'utf-8');
                    if (callback) callback({ success: true, filename, content });
                } catch (err: any) {
                    if (callback) callback({ success: false, error: err.message });
                }
            });

            socket.on('brain:write', async (payload: { filename: string; content: string }, callback?: (data: any) => void) => {
                const activeUserId = socket.data.userId || getUserIdFromSocket(socket);
                if (!activeUserId) {
                    if (callback) callback({ success: false, error: 'Unauthenticated' });
                    return;
                }
                const allowed = ['atman.md', 'zehn.md', 'moment.md', 'hunar.md', 'planner.md', 'executor.md', 'researcher.md'];
                if (!allowed.includes(payload.filename)) {
                    if (callback) callback({ success: false, error: 'Invalid filename' });
                    return;
                }
                try {
                    const userBrainPath = MemoryManager.getUserBrainPath(activeUserId);
                    const filePath = path.join(userBrainPath, payload.filename);
                    await fs.promises.writeFile(filePath, payload.content, 'utf-8');
                    if (callback) callback({ success: true, filename: payload.filename });
                } catch (err: any) {
                    if (callback) callback({ success: false, error: err.message });
                }
            });

            // ── Sessions Management (Strictly Scoped Per-User) ──────────────────────────

            socket.on('session:list', async (callback?: (data: any) => void) => {
                const activeUserId = socket.data.userId || getUserIdFromSocket(socket);
                if (!activeUserId) {
                    if (callback) callback({ success: false, sessions: [], error: 'Unauthenticated' });
                    return;
                }
                try {
                    const sessions = await ChatSession.find({ userId: activeUserId }).sort({ updatedAt: -1 }).lean();
                    const list = sessions.map(s => ({
                        sessionId: s.sessionId,
                        title: s.title,
                        updatedAt: s.updatedAt,
                        messageCount: s.messages?.length || 0
                    }));
                    if (callback) callback({ success: true, sessions: list });
                } catch (err) {
                    console.error('[Playground] session:list failed:', err);
                    if (callback) callback({ success: false, error: String(err) });
                }
            });

            socket.on('session:create', async (callback?: (data: any) => void) => {
                const activeUserId = socket.data.userId || getUserIdFromSocket(socket);
                if (!activeUserId) {
                    if (callback) callback({ success: false, error: 'Unauthenticated' });
                    return;
                }
                try {
                    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                    const newSession = new ChatSession({
                        userId: activeUserId,
                        sessionId: newSessionId,
                        title: 'New Chat',
                        messages: []
                    });
                    await newSession.save();
                    console.log(`[Playground] Created session: ${newSessionId} for user ${activeUserId}`);
                    if (callback) callback({ success: true, sessionId: newSessionId, title: 'New Chat' });
                } catch (err) {
                    console.error('[Playground] session:create failed:', err);
                    if (callback) callback({ success: false, error: String(err) });
                }
            });

            socket.on('session:load', async (sessionId: string, callback?: (data: any) => void) => {
                const activeUserId = socket.data.userId || getUserIdFromSocket(socket);
                if (!activeUserId) {
                    if (callback) callback({ success: false, error: 'Unauthenticated' });
                    return;
                }
                try {
                    const session = await ChatSession.findOne({ userId: activeUserId, sessionId });
                    if (!session) {
                        if (callback) callback({ success: false, error: 'Session not found' });
                        return;
                    }

                    // Backfill stable ID and variant structure for legacy messages
                    let needsSave = false;
                    session.messages.forEach((m, idx) => {
                        if (!m.id) {
                            m.id = `msg_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 5)}`;
                            needsSave = true;
                        }
                        if (m.role === 'assistant' && (!m.variants || m.variants.length === 0)) {
                            m.variants = [{
                                content: m.content,
                                telemetry: m.telemetry,
                                timestamp: m.timestamp || new Date()
                            }];
                            m.activeVariantIndex = 0;
                            needsSave = true;
                        }
                    });

                    if (needsSave) {
                        await session.save();
                    }

                    if (callback) callback({
                        success: true,
                        sessionId: session.sessionId,
                        title: session.title,
                        messages: session.messages
                    });
                } catch (err) {
                    console.error('[Playground] session:load failed:', err);
                    if (callback) callback({ success: false, error: String(err) });
                }
            });

            socket.on('session:delete', async (sessionId: string, callback?: (data: any) => void) => {
                const activeUserId = socket.data.userId || getUserIdFromSocket(socket);
                if (!activeUserId) {
                    if (callback) callback({ success: false, error: 'Unauthenticated' });
                    return;
                }
                try {
                    await ChatSession.deleteOne({ userId: activeUserId, sessionId });
                    console.log(`[Playground] Deleted session: ${sessionId} for user ${activeUserId}`);
                    if (callback) callback({ success: true });
                } catch (err) {
                    console.error('[Playground] session:delete failed:', err);
                    if (callback) callback({ success: false, error: String(err) });
                }
            });

            // ── Chat Message ─────────────────

            socket.on('chat message', async (payload: string | { text: string; sessionId: string }) => {
                if (!this.onMessageCallback) return;

                const activeUserId = socket.data.userId || getUserIdFromSocket(socket);
                if (!activeUserId) {
                    socket.emit('chat response', 'Please connect with Google to start chatting with Brahma.');
                    return;
                }

                let msgText: string;
                let sessionId: string | undefined;

                if (typeof payload === 'string') {
                    msgText = payload;
                } else {
                    msgText = payload.text;
                    sessionId = payload.sessionId;
                }

                const messageId = `msg_user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                this.socketMap.set(messageId, socket);
                this.telemetryMap.set(messageId, []);
                if (sessionId) this.sessionMap.set(messageId, sessionId);

                // Save user message to user's chat session
                if (sessionId) {
                    try {
                        const session = await ChatSession.findOne({ userId: activeUserId, sessionId });
                        if (session) {
                            session.messages.push({
                                id: messageId,
                                role: 'user',
                                content: msgText,
                                timestamp: new Date()
                            });
                            
                            if (session.messages.filter(m => m.role === 'user').length === 1 && session.title === 'New Chat') {
                                const cleanTitle = msgText.trim().substring(0, 30);
                                session.title = cleanTitle.length > 0 ? cleanTitle : 'New Chat';
                            }
                            await session.save();
                        }
                    } catch (err) {
                        console.error('[Playground] Failed to save user message:', err);
                    }
                }

                socket.emit('typing', true);

                const normalizedMsg: NormalizedMessage = {
                    user_id: activeUserId,
                    platform: 'web',
                    channel_id: sessionId || 'default',
                    content: msgText,
                    timestamp: new Date(),
                    message_id: messageId
                };

                this.onMessageCallback(normalizedMsg);
            });

            // ── Chat Edit Message (In-Place Overwrite & Truncation per Option A) ───

            socket.on('chat edit', async (payload: { messageId: string; newText: string; sessionId: string }) => {
                if (!this.onMessageCallback) return;

                const activeUserId = socket.data.userId || getUserIdFromSocket(socket);
                if (!activeUserId || !payload.sessionId || !payload.messageId || !payload.newText?.trim()) return;

                try {
                    const session = await ChatSession.findOne({ userId: activeUserId, sessionId: payload.sessionId });
                    if (!session) return;

                    const targetIndex = session.messages.findIndex(m => m.id === payload.messageId);
                    if (targetIndex === -1 || session.messages[targetIndex].role !== 'user') return;

                    // Update target message text
                    session.messages[targetIndex].content = payload.newText.trim();
                    session.messages[targetIndex].timestamp = new Date();

                    // Truncate all subsequent messages (In-Place Overwrite & Truncation)
                    session.messages = session.messages.slice(0, targetIndex + 1);
                    await session.save();

                    // Rewind short-term memory (moment.md)
                    await rewindMoment(activeUserId, payload.sessionId, session.messages);

                    // Sync updated session state to frontend
                    socket.emit('session:loaded', {
                        success: true,
                        sessionId: session.sessionId,
                        title: session.title,
                        messages: session.messages
                    });

                    // Trigger pipeline execution for edited prompt
                    const pipelineMsgId = `msg_edit_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                    this.socketMap.set(pipelineMsgId, socket);
                    this.telemetryMap.set(pipelineMsgId, []);
                    this.sessionMap.set(pipelineMsgId, payload.sessionId);

                    socket.emit('typing', true);

                    const normalizedMsg: NormalizedMessage = {
                        user_id: activeUserId,
                        platform: 'web',
                        channel_id: payload.sessionId,
                        content: payload.newText.trim(),
                        timestamp: new Date(),
                        message_id: pipelineMsgId
                    };

                    this.onMessageCallback(normalizedMsg);
                } catch (err) {
                    console.error('[Playground] chat edit failed:', err);
                }
            });

            // ── Chat Regenerate Response (Response Variants per Option B) ───

            socket.on('chat regenerate', async (payload: { messageId: string; sessionId: string }) => {
                if (!this.onMessageCallback) return;

                const activeUserId = socket.data.userId || getUserIdFromSocket(socket);
                if (!activeUserId || !payload.sessionId || !payload.messageId) return;

                try {
                    const session = await ChatSession.findOne({ userId: activeUserId, sessionId: payload.sessionId });
                    if (!session) return;

                    const targetIndex = session.messages.findIndex(m => m.id === payload.messageId);
                    if (targetIndex === -1) return;

                    let assistantMessage: any;
                    let promptUserMsg: any;
                    let assistantIndex = -1;

                    if (session.messages[targetIndex].role === 'assistant') {
                        assistantMessage = session.messages[targetIndex];
                        assistantIndex = targetIndex;
                        for (let i = targetIndex - 1; i >= 0; i--) {
                            if (session.messages[i].role === 'user') {
                                promptUserMsg = session.messages[i];
                                break;
                            }
                        }
                    } else {
                        promptUserMsg = session.messages[targetIndex];
                        if (targetIndex + 1 < session.messages.length && session.messages[targetIndex + 1].role === 'assistant') {
                            assistantMessage = session.messages[targetIndex + 1];
                            assistantIndex = targetIndex + 1;
                        }
                    }

                    if (!promptUserMsg) return;

                    // If assistant message exists, truncate anything after it
                    if (assistantIndex !== -1) {
                        session.messages = session.messages.slice(0, assistantIndex + 1);
                    } else {
                        session.messages = session.messages.slice(0, targetIndex + 1);
                        const asstId = `msg_asst_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                        session.messages.push({
                            id: asstId,
                            role: 'assistant',
                            content: '',
                            timestamp: new Date(),
                            variants: [],
                            activeVariantIndex: 0
                        });
                        assistantMessage = session.messages[session.messages.length - 1];
                        assistantIndex = session.messages.length - 1;
                    }

                    await session.save();

                    // Rewind moment.md turns up to prompt user message
                    await rewindMoment(activeUserId, payload.sessionId, session.messages.slice(0, assistantIndex));

                    const pipelineMsgId = `msg_regen_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                    this.socketMap.set(pipelineMsgId, socket);
                    this.telemetryMap.set(pipelineMsgId, []);
                    this.sessionMap.set(pipelineMsgId, payload.sessionId);
                    this.regenerationMap.set(pipelineMsgId, {
                        sessionId: payload.sessionId,
                        assistantMessageId: assistantMessage.id
                    });

                    socket.emit('typing', true);

                    const normalizedMsg: NormalizedMessage = {
                        user_id: activeUserId,
                        platform: 'web',
                        channel_id: payload.sessionId,
                        content: promptUserMsg.content,
                        timestamp: new Date(),
                        message_id: pipelineMsgId
                    };

                    this.onMessageCallback(normalizedMsg);
                } catch (err) {
                    console.error('[Playground] chat regenerate failed:', err);
                }
            });

            // ── Chat Select Variant ─────────────────

            socket.on('chat select_variant', async (payload: { messageId: string; variantIndex: number; sessionId: string }) => {
                const activeUserId = socket.data.userId || getUserIdFromSocket(socket);
                if (!activeUserId || !payload.sessionId || !payload.messageId) return;

                try {
                    const session = await ChatSession.findOne({ userId: activeUserId, sessionId: payload.sessionId });
                    if (!session) return;

                    const asstMsg = session.messages.find(m => m.id === payload.messageId);
                    if (asstMsg && asstMsg.variants && payload.variantIndex >= 0 && payload.variantIndex < asstMsg.variants.length) {
                        asstMsg.activeVariantIndex = payload.variantIndex;
                        const targetVariant = asstMsg.variants[payload.variantIndex];
                        asstMsg.content = targetVariant.content;
                        asstMsg.telemetry = targetVariant.telemetry;
                        await session.save();

                        socket.emit('session:loaded', {
                            success: true,
                            sessionId: session.sessionId,
                            title: session.title,
                            messages: session.messages
                        });
                    }
                } catch (err) {
                    console.error('[Playground] chat select_variant failed:', err);
                }
            });
        });

        httpServer.listen(this.port, () => {
            console.log(`[PlaygroundAdapter] Socket.io server running on port ${this.port}`);
        });
    }

    private setupTelemetryBus() {
        const sendTelemetry = (messageId: string, event: string, payload: any) => {
            const socket = this.socketMap.get(messageId);
            const telemetryLogs = this.telemetryMap.get(messageId) || [];
            
            const telemetryStep = {
                event,
                stage: payload.stage,
                label: payload.label,
                timestamp: new Date().toISOString(),
                ...payload
            };

            telemetryLogs.push(telemetryStep);
            this.telemetryMap.set(messageId, telemetryLogs);

            if (socket) {
                socket.emit('telemetry', telemetryStep);
            }
        };

        EventBus.on(SystemEvents.ROUTING_COMPLETE, ({ message, routeResult }) => {
            sendTelemetry(message.message_id, 'ROUTING_COMPLETE', {
                stage: 'Router / Intent Analysis',
                label: `Routed prompt to [${routeResult.bucket}] bucket`,
                details: routeResult
            });
        });

        EventBus.on(SystemEvents.RESEARCH_STARTED, ({ message }) => {
            sendTelemetry(message.message_id, 'RESEARCH_STARTED', {
                stage: 'Context Core / SCRP Research',
                label: 'Evaluating memory & system state...'
            });
        });

        EventBus.on(SystemEvents.RESEARCH_COMPLETE, ({ message, researchResult }) => {
            sendTelemetry(message.message_id, 'RESEARCH_COMPLETE', {
                stage: 'Context Core / SCRP Research',
                label: researchResult.research_required
                    ? `Context gathered: ${researchResult.context_store.entries.length} entities`
                    : 'Research check complete (no deep query required)',
                details: researchResult
            });
        });

        EventBus.on(SystemEvents.PLANNING_STARTED, ({ message }) => {
            sendTelemetry(message.message_id, 'PLANNING_STARTED', {
                stage: 'Zehn / Core Planner',
                label: 'Formulating step execution matrix...'
            });
        });

        EventBus.on(SystemEvents.PLANNING_COMPLETE, ({ message, plan }) => {
            sendTelemetry(message.message_id, 'PLANNING_COMPLETE', {
                stage: 'Zehn / Core Planner',
                label: `Plan constructed with ${plan.length} step(s)`,
                plan
            });
        });

        EventBus.on(SystemEvents.STEP_EXECUTION_START, ({ message, step }) => {
            sendTelemetry(message.message_id, 'STEP_EXECUTION_START', {
                stage: `Executor / Tool: ${step.tool}`,
                label: `Invoking skill [${step.tool}] for action: "${step.action}"`,
                step
            });
        });

        EventBus.on(SystemEvents.STEP_EXECUTION_COMPLETE, ({ message, step, status, outputSummary }) => {
            sendTelemetry(message.message_id, 'STEP_EXECUTION_COMPLETE', {
                stage: `Executor / Tool: ${step.tool}`,
                label: `Skill [${step.tool}] returned status [${status}]`,
                step,
                status,
                outputSummary
            });
        });

        EventBus.on(SystemEvents.COMPOSING_STARTED, ({ message }) => {
            sendTelemetry(message.message_id, 'COMPOSING_STARTED', {
                stage: 'Composer / Synthesis',
                label: 'Synthesizing tool outputs into response...'
            });
        });
    }

    async init(onMessage: (msg: NormalizedMessage) => void): Promise<void> {
        this.onMessageCallback = onMessage;
        console.log('[PlaygroundAdapter] Initialized.');
    }

    async emit(response: PipelineResponse): Promise<void> {
        const socket = this.socketMap.get(response.originalMessage.message_id);
        const telemetryLogs = this.telemetryMap.get(response.originalMessage.message_id) || [];
        const regenInfo = this.regenerationMap.get(response.originalMessage.message_id);

        if (socket) {
            socket.emit('typing', false);
            socket.emit('chat response', response.content);
            this.socketMap.delete(response.originalMessage.message_id);

            const sessionId = this.sessionMap.get(response.originalMessage.message_id);
            if (sessionId) {
                try {
                    const session = await ChatSession.findOne({ userId: response.originalMessage.user_id, sessionId });
                    if (session) {
                        if (regenInfo && regenInfo.assistantMessageId) {
                            const asstMsg = session.messages.find(m => m.id === regenInfo.assistantMessageId);
                            if (asstMsg) {
                                if (!asstMsg.variants || asstMsg.variants.length === 0) {
                                    asstMsg.variants = [{
                                        content: asstMsg.content,
                                        telemetry: asstMsg.telemetry,
                                        timestamp: asstMsg.timestamp || new Date()
                                    }];
                                }
                                asstMsg.variants.push({
                                    content: response.content,
                                    telemetry: telemetryLogs.length > 0 ? telemetryLogs : undefined,
                                    timestamp: new Date()
                                });
                                asstMsg.activeVariantIndex = asstMsg.variants.length - 1;
                                asstMsg.content = response.content;
                                asstMsg.telemetry = telemetryLogs.length > 0 ? telemetryLogs : undefined;
                                asstMsg.timestamp = new Date();
                            }
                        } else {
                            const asstMsgId = `msg_asst_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                            const newVariant = {
                                content: response.content,
                                telemetry: telemetryLogs.length > 0 ? telemetryLogs : undefined,
                                timestamp: new Date()
                            };
                            session.messages.push({ 
                                id: asstMsgId,
                                role: 'assistant', 
                                content: response.content, 
                                timestamp: new Date(),
                                telemetry: telemetryLogs.length > 0 ? telemetryLogs : undefined,
                                variants: [newVariant],
                                activeVariantIndex: 0
                            });
                        }

                        await session.save();

                        socket.emit('session:loaded', {
                            success: true,
                            sessionId: session.sessionId,
                            title: session.title,
                            messages: session.messages
                        });
                        socket.emit('session:updated', { sessionId, title: session.title });
                    }
                } catch (err) {
                    console.error('[Playground] Failed to save assistant response:', err);
                }
                this.sessionMap.delete(response.originalMessage.message_id);
                if (regenInfo) this.regenerationMap.delete(response.originalMessage.message_id);
            }
        } else {
            console.warn(`[PlaygroundAdapter] Socket not found for message ${response.originalMessage.message_id}`);
        }
        this.telemetryMap.delete(response.originalMessage.message_id);
    }
}

async function rewindMoment(userId: string, channelId: string, remainingMessages: any[]) {
    try {
        const momentContent = await MemoryManager.getMoment(userId, channelId);
        const momentData = MemoryManager.parseMoment(momentContent);
        
        const newTurns: string[] = [];
        for (const msg of remainingMessages) {
            const cleanText = (msg.content || '').replace(/\s+/g, ' ').trim();
            if (!cleanText) continue;
            const truncated = cleanText.length > 1000 ? cleanText.substring(0, 1000) + '...' : cleanText;
            if (msg.role === 'user') {
                newTurns.push(`User: ${truncated}`);
            } else {
                newTurns.push(`Assistant: ${truncated}`);
            }
        }
        
        while (newTurns.length > 20) {
            newTurns.shift();
        }
        
        momentData.turns = newTurns;
        const updatedMoment = MemoryManager.formatMoment(momentData);
        await MemoryManager.updateMoment(updatedMoment, userId, channelId);
    } catch (err) {
        console.error('[Playground] Failed to rewind moment.md:', err);
    }
}
