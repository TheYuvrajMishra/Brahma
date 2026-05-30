import mongoose, { Schema, Document } from 'mongoose';

export interface ISubTask {
  subTaskId: string;
  title: string;
  description: string;
  dependency: string | null;
  assignedTo: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'BLOCKED';
  progress: number;
}

export interface IDharma extends Document {
  version: string;
  lastSync: Date;
  missionId: string;
  title: string;
  objective: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  overallProgress: number;
  subTasks: ISubTask[];
}

const SubTaskSchema: Schema = new Schema({
  subTaskId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  dependency: { type: String, default: null },
  assignedTo: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'BLOCKED'], default: 'PENDING' },
  progress: { type: Number, required: true, min: 0, max: 100, default: 0 }
});

const DharmaSchema: Schema = new Schema({
  version: { type: String, required: true, default: '1.0.0' },
  lastSync: { type: Date, default: Date.now },
  missionId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  objective: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'], default: 'PENDING' },
  overallProgress: { type: Number, required: true, min: 0, max: 100, default: 0 },
  subTasks: [SubTaskSchema]
});

export default mongoose.models.Dharma || mongoose.model<IDharma>('Dharma', DharmaSchema);
