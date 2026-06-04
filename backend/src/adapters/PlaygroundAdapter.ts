import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import { Adapter } from './Adapter';
import { NormalizedMessage, PipelineResponse } from '../types/Message';

export class PlaygroundAdapter implements Adapter {
    private io: Server;
    private onMessageCallback: ((msg: NormalizedMessage) => void) | null = null;
    private socketMap: Map<string, Socket> = new Map(); // message_id -> Socket

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

            socket.on('chat message', (msgText: string) => {
                if (!this.onMessageCallback) return;

                const messageId = `playground_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                this.socketMap.set(messageId, socket);

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
        } else {
            console.warn(`[PlaygroundAdapter] Socket not found for message ${response.originalMessage.message_id}`);
        }
    }
}
