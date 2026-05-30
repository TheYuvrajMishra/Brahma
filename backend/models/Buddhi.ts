import mongoose, { Schema, Document } from 'mongoose';

export interface IRiskAssessment {
  targetSubTaskId: string;
  strategyRoute: string;
  associatedRisks: string;
  mitigationPolicy: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface IOrchestrationRoute {
  subTaskId: string;
  primaryExecutor: string;
  requiredSkillSet: string;
  operationalConstraints: string;
  targetOutputs: string;
}

export interface ICognitiveDecision {
  decisionId: string;
  context: string;
  evaluatedAlternatives: string;
  selectedPathAndRationale: string;
}

export interface IBuddhi extends Document {
  version: string;
  lastSync: Date;
  strategyMode: string;
  orchestrationCycle: string;
  risks: IRiskAssessment[];
  orchestration: IOrchestrationRoute[];
  cognitiveDecisions: ICognitiveDecision[];
}

const RiskAssessmentSchema: Schema = new Schema({
  targetSubTaskId: { type: String, required: true },
  strategyRoute: { type: String, required: true },
  associatedRisks: { type: String, required: true },
  mitigationPolicy: { type: String, required: true },
  priority: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], required: true }
});

const OrchestrationRouteSchema: Schema = new Schema({
  subTaskId: { type: String, required: true },
  primaryExecutor: { type: String, required: true },
  requiredSkillSet: { type: String, required: true },
  operationalConstraints: { type: String, required: true },
  targetOutputs: { type: String, required: true }
});

const CognitiveDecisionSchema: Schema = new Schema({
  decisionId: { type: String, required: true, unique: true },
  context: { type: String, required: true },
  evaluatedAlternatives: { type: String, required: true },
  selectedPathAndRationale: { type: String, required: true }
});

const BuddhiSchema: Schema = new Schema({
  version: { type: String, required: true, default: '1.0.0' },
  lastSync: { type: Date, default: Date.now },
  strategyMode: { type: String, required: true, default: 'HIGH_EFFICIENCY' },
  orchestrationCycle: { type: String, required: true, default: 'ACTIVE' },
  risks: [RiskAssessmentSchema],
  orchestration: [OrchestrationRouteSchema],
  cognitiveDecisions: [CognitiveDecisionSchema]
});

export default mongoose.models.Buddhi || mongoose.model<IBuddhi>('Buddhi', BuddhiSchema);
