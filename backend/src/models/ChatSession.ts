import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageVariant {
    content: string;
    telemetry?: any[];
    timestamp: Date;
}

export interface IChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    telemetry?: any[];
    variants?: IMessageVariant[];
    activeVariantIndex?: number;
}

export interface IChatSession extends Document {
    userId: mongoose.Types.ObjectId | string;
    sessionId: string;
    title: string;
    messages: IChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}

const MessageVariantSchema = new Schema<IMessageVariant>({
    content: { type: String, required: true },
    telemetry: { type: Schema.Types.Mixed, default: undefined },
    timestamp: { type: Date, default: Date.now }
}, { _id: false });

const ChatMessageSchema = new Schema<IChatMessage>({
    id: { type: String, required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    telemetry: { type: Schema.Types.Mixed, default: undefined },
    variants: { type: [MessageVariantSchema], default: undefined },
    activeVariantIndex: { type: Number, default: 0 }
}, { _id: false });

const ChatSessionSchema = new Schema<IChatSession>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: String, required: true, unique: true, index: true },
    title: { type: String, default: 'New Chat' },
    messages: { type: [ChatMessageSchema], default: [] },
}, {
    timestamps: true,
});

ChatSessionSchema.index({ userId: 1, sessionId: 1 });

export const ChatSession = mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
