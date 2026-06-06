import mongoose, { Schema, Document } from 'mongoose';

export interface ISessionContext extends Document {
    channelId: string;
    momentMarkdown: string;
    customPersona: string;
    createdAt: Date;
    updatedAt: Date;
}

const SessionContextSchema = new Schema<ISessionContext>({
    channelId: { type: String, required: true, unique: true, index: true },
    momentMarkdown: { type: String, default: '' },
    customPersona: { type: String, default: '' },
}, {
    timestamps: true,
});

export const SessionContext = mongoose.model<ISessionContext>('SessionContext', SessionContextSchema);
