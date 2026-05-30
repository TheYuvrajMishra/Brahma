import mongoose, { Schema, Document } from 'mongoose';

export interface IUserAlignment {
  preferenceId: string;
  observedPreference: string;
  adaptationRequired: string;
  confidenceScore: number;
}

export interface IAtman extends Document {
  version: string;
  lastSync: Date;
  directness: number;
  philosophicalDepth: number;
  advisoryProactivity: number;
  humanEmpathy: number;
  userAlignments: IUserAlignment[];
}

const UserAlignmentSchema: Schema = new Schema({
  preferenceId: { type: String, required: true, unique: true },
  observedPreference: { type: String, required: true },
  adaptationRequired: { type: String, required: true },
  confidenceScore: { type: Number, required: true, min: 0, max: 100 }
});

const AtmanSchema: Schema = new Schema({
  version: { type: String, required: true, default: '1.0.0' },
  lastSync: { type: Date, default: Date.now },
  directness: { type: Number, required: true, min: 1, max: 5, default: 4 },
  philosophicalDepth: { type: Number, required: true, min: 1, max: 5, default: 3 },
  advisoryProactivity: { type: Number, required: true, min: 1, max: 5, default: 5 },
  humanEmpathy: { type: Number, required: true, min: 1, max: 5, default: 4 },
  userAlignments: [UserAlignmentSchema]
});

export default mongoose.models.Atman || mongoose.model<IAtman>('Atman', AtmanSchema);
