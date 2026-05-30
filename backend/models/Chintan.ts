import mongoose, { Schema, Document } from 'mongoose';

export interface ILearning {
  learningId: string;
  sourceEngine: string;
  observation: string;
  extractedPrinciple: string;
  targetFileImpact: string;
}

export interface IOptimizationTicket {
  ticketId: string;
  targetFile: string;
  coreRefinementRequired: string;
  verificationSuccessCriteria: string;
  status: 'PENDING' | 'RESOLVED';
}

export interface IRetrospective {
  reviewDate: Date;
  targetMission: string;
  auditedErrors: string;
  structuralOptimizationMade: string;
}

export interface IChintan extends Document {
  version: string;
  lastSync: Date;
  reflectionsCompleted: number;
  learningsCaptured: number;
  activeTicketsCount: number;
  learnings: ILearning[];
  tickets: IOptimizationTicket[];
  retrospectives: IRetrospective[];
}

const LearningSchema: Schema = new Schema({
  learningId: { type: String, required: true, unique: true },
  sourceEngine: { type: String, required: true },
  observation: { type: String, required: true },
  extractedPrinciple: { type: String, required: true },
  targetFileImpact: { type: String, required: true }
});

const OptimizationTicketSchema: Schema = new Schema({
  ticketId: { type: String, required: true, unique: true },
  targetFile: { type: String, required: true },
  coreRefinementRequired: { type: String, required: true },
  verificationSuccessCriteria: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'RESOLVED'], default: 'PENDING' }
});

const RetrospectiveSchema: Schema = new Schema({
  reviewDate: { type: Date, required: true },
  targetMission: { type: String, required: true },
  auditedErrors: { type: String, required: true },
  structuralOptimizationMade: { type: String, required: true }
});

const ChintanSchema: Schema = new Schema({
  version: { type: String, required: true, default: '1.0.0' },
  lastSync: { type: Date, default: Date.now },
  reflectionsCompleted: { type: Number, required: true, default: 0 },
  learningsCaptured: { type: Number, required: true, default: 0 },
  activeTicketsCount: { type: Number, required: true, default: 0 },
  learnings: [LearningSchema],
  tickets: [OptimizationTicketSchema],
  retrospectives: [RetrospectiveSchema]
});

export default mongoose.models.Chintan || mongoose.model<IChintan>('Chintan', ChintanSchema);
