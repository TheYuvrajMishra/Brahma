import mongoose, { Schema, Document } from 'mongoose';

export interface IHunar extends Document {
  skillId: string;
  category: string;
  name: string;
  status: 'ACTIVE' | 'DEPRECATED';
  description: string;
  fileLink: string;
  createdOn: Date;
  lastModified: Date;
}

const HunarSchema: Schema = new Schema({
  skillId: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['ACTIVE', 'DEPRECATED'], default: 'ACTIVE' },
  description: { type: String, required: true },
  fileLink: { type: String, required: true },
  createdOn: { type: Date, default: Date.now },
  lastModified: { type: Date, default: Date.now }
});

export default mongoose.models.Hunar || mongoose.model<IHunar>('Hunar', HunarSchema);
