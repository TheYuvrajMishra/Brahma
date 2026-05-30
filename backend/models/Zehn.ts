import mongoose, { Schema, Document } from 'mongoose';

export interface IEntity {
  entityId: string;
  name: string;
  category: string;
  scope: string;
  relationships: string;
}

export interface ISession {
  sessionId: string;
  date: Date;
  focus: string;
  fileLink: string;
  tokenWeight: string;
}

export interface IZehn extends Document {
  version: string;
  lastSync: Date;
  indexedEntitiesCount: number;
  chronologicalSessionsCount: number;
  memoryDecayStatus: string;
  entities: IEntity[];
  sessions: ISession[];
}

const EntitySchema: Schema = new Schema({
  entityId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  scope: { type: String, required: true },
  relationships: { type: String, required: true }
});

const SessionSchema: Schema = new Schema({
  sessionId: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  focus: { type: String, required: true },
  fileLink: { type: String, required: true },
  tokenWeight: { type: String, required: true }
});

const ZehnSchema: Schema = new Schema({
  version: { type: String, required: true, default: '1.0.0' },
  lastSync: { type: Date, default: Date.now },
  indexedEntitiesCount: { type: Number, required: true, default: 0 },
  chronologicalSessionsCount: { type: Number, required: true, default: 0 },
  memoryDecayStatus: { type: String, required: true, default: 'NOMINAL' },
  entities: [EntitySchema],
  sessions: [SessionSchema]
});

export default mongoose.models.Zehn || mongoose.model<IZehn>('Zehn', ZehnSchema);
