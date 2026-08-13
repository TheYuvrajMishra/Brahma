import mongoose, { Schema, Document } from 'mongoose';

export interface IArtifact extends Document {
    artifactId: string;
    userId: mongoose.Types.ObjectId | string;
    sessionId: string;
    messageId?: string;
    title: string;
    filename: string;
    fileType: 'json' | 'md' | 'pdf' | 'html' | 'css' | 'js' | 'docx' | 'xlsx' | string;
    content?: string;
    storagePath: string;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ArtifactSchema = new Schema<IArtifact>({
    artifactId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    messageId: { type: String, index: true },
    title: { type: String, required: true },
    filename: { type: String, required: true },
    fileType: { type: String, required: true },
    content: { type: String, default: '' },
    storagePath: { type: String, required: true },
    isArchived: { type: Boolean, default: false, index: true }
}, {
    timestamps: true
});

ArtifactSchema.index({ userId: 1, sessionId: 1, isArchived: 1 });

export const Artifact = mongoose.model<IArtifact>('Artifact', ArtifactSchema);
