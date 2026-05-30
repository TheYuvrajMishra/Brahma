import mongoose, { Schema, Document } from 'mongoose';

export interface ILiveAction {
  stepId: string;
  taskRef: string;
  toolExecuted: string;
  intendedPurpose: string;
  resultSummary: string;
  outcome: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export interface IWorkspaceState {
  checkTarget: string;
  verificationMetric: string;
  currentStatus: string;
  observationNotes: string;
}

export interface IKarma extends Document {
  version: string;
  lastSync: Date;
  executionStatus: string;
  executedActionsCount: number;
  liveActions: ILiveAction[];
  workspaceState: IWorkspaceState[];
}

const LiveActionSchema: Schema = new Schema({
  stepId: { type: String, required: true, unique: true },
  taskRef: { type: String, required: true },
  toolExecuted: { type: String, required: true },
  intendedPurpose: { type: String, required: true },
  resultSummary: { type: String, required: true },
  outcome: { type: String, enum: ['SUCCESS', 'WARNING', 'FAILED'], required: true }
});

const WorkspaceStateSchema: Schema = new Schema({
  checkTarget: { type: String, required: true },
  verificationMetric: { type: String, required: true },
  currentStatus: { type: String, required: true },
  observationNotes: { type: String, required: true }
});

const KarmaSchema: Schema = new Schema({
  version: { type: String, required: true, default: '1.0.0' },
  lastSync: { type: Date, default: Date.now },
  executionStatus: { type: String, required: true, default: 'IDLE' },
  executedActionsCount: { type: Number, required: true, default: 0 },
  liveActions: [LiveActionSchema],
  workspaceState: [WorkspaceStateSchema]
});

export default mongoose.models.Karma || mongoose.model<IKarma>('Karma', KarmaSchema);
