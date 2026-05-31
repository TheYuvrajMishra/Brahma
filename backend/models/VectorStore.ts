import mongoose, { Schema, Document } from 'mongoose';

export type DocType = 'entity' | 'session' | 'skill' | 'memory' | 'mission' | 'generic';

export interface IVectorChunk extends Document {
  docId: string;
  docType: DocType;
  content: string;
  contentHash: string;
  embedding: number[];
  embeddingDim: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const VectorChunkSchema: Schema = new Schema(
  {
    docId: { type: String, required: true },
    docType: {
      type: String,
      enum: ['entity', 'session', 'skill', 'memory', 'mission', 'generic'],
      required: true,
    },
    content: { type: String, required: true },
    contentHash: { type: String, required: true },
    embedding: { type: [Number], required: true },
    embeddingDim: { type: Number, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    collection: 'vectorstore',
  }
);

// Index for fast docId + docType lookups
VectorChunkSchema.index({ docId: 1, docType: 1 });
// Index for deduplication checks
VectorChunkSchema.index({ contentHash: 1 }, { unique: true });

export default mongoose.models.VectorChunk ||
  mongoose.model<IVectorChunk>('VectorChunk', VectorChunkSchema);
