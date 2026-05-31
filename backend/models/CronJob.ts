import mongoose, { Schema, Document } from 'mongoose';

export interface ICronJob extends Document {
  jobId: string;
  name: string;
  cronExpression: string;
  prompt: string;
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED';
  createdOn: Date;
  lastRun?: Date;
  durationSec?: number;
  expiresAt?: Date;
  executionsCount: number;
}

const CronJobSchema: Schema = new Schema({
  jobId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  cronExpression: { type: String, required: true },
  prompt: { type: String, required: true },
  status: { type: String, enum: ['ACTIVE', 'PAUSED', 'EXPIRED'], default: 'ACTIVE' },
  createdOn: { type: Date, default: Date.now },
  lastRun: { type: Date },
  durationSec: { type: Number },
  expiresAt: { type: Date },
  executionsCount: { type: Number, default: 0 }
});

export default mongoose.models.CronJob || mongoose.model<ICronJob>('CronJob', CronJobSchema);
