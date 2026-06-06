import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface IChatSession extends Document {
    sessionId: string;
    title: string;
    messages: IChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

const ChatSessionSchema = new Schema<IChatSession>({
    sessionId: { type: String, required: true, unique: true, index: true },
    title: { type: String, default: 'New Chat' },
    messages: { type: [ChatMessageSchema], default: [] },
}, {
    timestamps: true, // auto createdAt & updatedAt
});

export const ChatSession = mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
