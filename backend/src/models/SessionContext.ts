import mongoose, { Schema, Document } from 'mongoose';

export interface ISessionContext extends Document {
    userId: mongoose.Types.ObjectId | string;
    channelId: string;
    momentMarkdown: string;
    customPersona: string;
    createdAt: Date;
    updatedAt: Date;
}

const SessionContextSchema = new Schema<ISessionContext>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    channelId: { type: String, required: true, index: true },
    momentMarkdown: { type: String, default: '' },
    customPersona: { type: String, default: '' },
}, {
    timestamps: true,
});

SessionContextSchema.index({ userId: 1, channelId: 1 }, { unique: true });

export const SessionContext = mongoose.model<ISessionContext>('SessionContext', SessionContextSchema);
