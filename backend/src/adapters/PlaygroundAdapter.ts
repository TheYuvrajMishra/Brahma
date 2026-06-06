import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { Adapter } from './Adapter';
import { NormalizedMessage, PipelineResponse } from '../types/Message';
import { ChatSession } from '../models/ChatSession';
import { config } from '../config';

export class PlaygroundAdapter implements Adapter {
    private io: Server;
    private onMessageCallback: ((msg: NormalizedMessage) => void) | null = null;
    private socketMap: Map<string, Socket> = new Map(); // message_id -> Socket
    private sessionMap: Map<string, string> = new Map(); // message_id -> sessionId

    constructor(private port: number = 3005) {
        const app = express();
        const httpServer = createServer(app);
        this.io = new Server(httpServer, {
            cors: { origin: '*' }
        });

        // Serve static files from the public folder
        app.use(express.static(path.join(__dirname, '../../public')));

        this.io.on('connection', (socket) => {
            console.log(`[Playground] User connected: ${socket.id}`);

            // ── Brain File Management Events ───────────────────────────

            socket.on('brain:list', async (callback?: (data: any) => void) => {
                try {
                    const dirPath = config.brainPath;
                    if (!fs.existsSync(dirPath)) {
                        if (callback) callback({ success: false, error: 'Brain directory does not exist' });
                        return;
                    }
                    const files = fs.readdirSync(dirPath);
                    const markdownFiles = files.filter(f => f.endsWith('.md'));
                    if (callback) callback({ success: true, files: markdownFiles });
                } catch (err) {
                    console.error('[Playground] brain:list failed:', err);
                    if (callback) callback({ success: false, error: String(err) });
                }
            });

            socket.on('brain:read', async (filename: string, callback?: (data: any) => void) => {
                try {
                    const safeName = path.basename(filename);
                    if (!safeName.endsWith('.md')) {
                        if (callback) callback({ success: false, error: 'Only markdown files are allowed' });
                        return;
                    }
                    const filePath = path.join(config.brainPath, safeName);
                    if (!fs.existsSync(filePath)) {
                        if (callback) callback({ success: false, error: 'File not found' });
                        return;
                    }
                    const content = fs.readFileSync(filePath, 'utf-8');
                    if (callback) callback({ success: true, content });
                } catch (err) {
                    console.error('[Playground] brain:read failed:', err);
                    if (callback) callback({ success: false, error: String(err) });
                }
            });

            socket.on('brain:write', async (data: { filename: string; content: string }, callback?: (data: any) => void) => {
                try {
                    const safeName = path.basename(data.filename);
                    if (!safeName.endsWith('.md')) {
                        if (callback) callback({ success: false, error: 'Only markdown files can be updated' });
                        return;
                    }
                    const filePath = path.join(config.brainPath, safeName);
                    fs.writeFileSync(filePath, data.content, 'utf-8');
                    console.log(`[Playground] Updated brain file: ${safeName}`);
                    if (callback) callback({ success: true });
                } catch (err) {
                    console.error('[Playground] brain:write failed:', err);
                    if (callback) callback({ success: false, error: String(err) });
                }
            });

            // ── Telemetry / Audit Logs Events ───────────────────────────

            socket.on('logs:read', async (callback?: (data: any) => void) => {
                try {
                    const logPath = path.join(__dirname, '../../audit.log');
                    if (!fs.existsSync(logPath)) {
                        if (callback) callback({ success: true, logs: [] });
                        return;
                    }
                    const content = fs.readFileSync(logPath, 'utf-8');
                    const lines = content.split('\n').filter(l => l.trim() !== '');
                    const logs = lines.map(line => {
                        try {
                            return JSON.parse(line);
                        } catch {
                            return { timestamp: new Date().toISOString(), level: 'INFO', details: line };
                        }
                    });
                    if (callback) callback({ success: true, logs: logs.reverse().slice(0, 100) });
                } catch (err) {
                    console.error('[Playground] logs:read failed:', err);
                    if (callback) callback({ success: false, error: String(err) });
                }
            });

            // ── Session CRUD Events ─────────────────────────────────────

            socket.on('session:create', async (callback?: (data: any) => void) => {
                try {
                    const sessionId = `session_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
                    const session = new ChatSession({
                        sessionId,
                        title: 'New Chat',
                        messages: [],
                    });
                    await session.save();
                    console.log(`[Playground] Created session: ${sessionId}`);
                    if (callback) callback({ success: true, sessionId, title: session.title, createdAt: session.createdAt });
                } catch (err) {
                    console.error('[Playground] session:create failed:', err);
                    if (callback) callback({ success: false, error: String(err) });
                }
            });

            socket.on('session:list', async (callback?: (data: any) => void) => {
                try {
                    const sessions = await ChatSession.find({}, { sessionId: 1, title: 1, updatedAt: 1, createdAt: 1, _id: 0 })
                        .sort({ updatedAt: -1 })
                        .lean();
                    if (callback) callback({ success: true, sessions });
                } catch (err) {
                    console.error('[Playground] session:list failed:', err);
                    if (callback) callback({ success: false, sessions: [] });
                }
            });

            socket.on('session:load', async (sessionId: string, callback?: (data: any) => void) => {
                try {
                    const session = await ChatSession.findOne({ sessionId }).lean();
                    if (session) {
                        if (callback) callback({ success: true, messages: session.messages, title: session.title });
                    } else {
                        if (callback) callback({ success: false, messages: [], error: 'Session not found' });
                    }
                } catch (err) {
                    console.error('[Playground] session:load failed:', err);
                    if (callback) callback({ success: false, messages: [] });
                }
            });

            socket.on('session:delete', async (sessionId: string, callback?: (data: any) => void) => {
                try {
                    await ChatSession.deleteOne({ sessionId });
                    console.log(`[Playground] Deleted session: ${sessionId}`);
                    if (callback) callback({ success: true });
                } catch (err) {
                    console.error('[Playground] session:delete failed:', err);
                    if (callback) callback({ success: false, error: String(err) });
                }
            });

            // ── Chat Message (with session persistence) ─────────────────

            socket.on('chat message', async (payload: string | { text: string; sessionId: string }) => {
                if (!this.onMessageCallback) return;

                // Support both legacy (string) and new ({text, sessionId}) formats
                let msgText: string;
                let sessionId: string | undefined;

                if (typeof payload === 'string') {
                    msgText = payload;
                } else {
                    msgText = payload.text;
                    sessionId = payload.sessionId;
                }

                const messageId = `playground_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                this.socketMap.set(messageId, socket);
                if (sessionId) this.sessionMap.set(messageId, sessionId);

                // Save user message to session
                if (sessionId) {
                    try {
                        const session = await ChatSession.findOne({ sessionId });
                        if (session) {
                            session.messages.push({ role: 'user', content: msgText, timestamp: new Date() });

                            // Auto-rename on first user message
                            if (session.title === 'New Chat' && msgText.trim().length > 0) {
                                session.title = msgText.trim().substring(0, 40) + (msgText.length > 40 ? '...' : '');
                            }

                            await session.save();
                        }
                    } catch (err) {
                        console.error('[Playground] Failed to save user message:', err);
                    }
                }

                // Show typing indicator on the frontend
                socket.emit('typing', true);

                const normalizedMsg: NormalizedMessage = {
                    message_id: messageId,
                    platform: 'playground',
                    channel_id: socket.id,
                    user_id: socket.id,
                    content: msgText,
                    timestamp: new Date()
                };

                this.onMessageCallback(normalizedMsg);
            });

            socket.on('disconnect', () => {
                console.log(`[Playground] User disconnected: ${socket.id}`);
            });
        });

        httpServer.listen(this.port, () => {
            console.log(`[Playground] Web UI running at http://localhost:${this.port}`);
        });
    }

    async init(onMessage: (msg: NormalizedMessage) => void): Promise<void> {
        this.onMessageCallback = onMessage;
        console.log('[PlaygroundAdapter] Initialized.');
    }

    async emit(response: PipelineResponse): Promise<void> {
        const socket = this.socketMap.get(response.originalMessage.message_id);
        if (socket) {
            socket.emit('typing', false);
            socket.emit('chat response', response.content);
            this.socketMap.delete(response.originalMessage.message_id);

            // Save assistant response to session
            const sessionId = this.sessionMap.get(response.originalMessage.message_id);
            if (sessionId) {
                try {
                    const session = await ChatSession.findOne({ sessionId });
                    if (session) {
                        session.messages.push({ role: 'assistant', content: response.content, timestamp: new Date() });
                        await session.save();

                        // Notify frontend that the session title may have been updated
                        socket.emit('session:updated', { sessionId, title: session.title });
                    }
                } catch (err) {
                    console.error('[Playground] Failed to save assistant response:', err);
                }
                this.sessionMap.delete(response.originalMessage.message_id);
            }
        } else {
            console.warn(`[PlaygroundAdapter] Socket not found for message ${response.originalMessage.message_id}`);
        }
    }
}
