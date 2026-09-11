import mongoose, { Schema, Document, Types } from 'mongoose';

export type ContractorStatus = 'ACTIVE' | 'INACTIVE';
export type ContractorComplianceStatus = 'COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NON_COMPLIANT';

export interface IContractor extends Document {
  mineId: Types.ObjectId;
  name: string;
  company: string;
  category: string;
  workforceCount: number;
  status: ContractorStatus;
  complianceStatus: ContractorComplianceStatus;
  createdAt: Date;
}

const ContractorSchema = new Schema<IContractor>(
  {
    mineId: {
      type: Schema.Types.ObjectId,
      ref: 'Mine',
      required: [true, 'Mine reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Contractor name is required'],
      trim: true,
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    category: {
      type: String,
      default: 'General Works',
    },
    workforceCount: {
      type: Number,
      default: 0,
      min: [0, 'Workforce count cannot be negative'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
    complianceStatus: {
      type: String,
      enum: ['COMPLIANT', 'PARTIALLY_COMPLIANT', 'NON_COMPLIANT'],
      default: 'COMPLIANT',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

ContractorSchema.index({ mineId: 1 });

export const Contractor: mongoose.Model<IContractor> =
  (mongoose.models.Contractor as mongoose.Model<IContractor>) ||
  mongoose.model<IContractor>('Contractor', ContractorSchema, 'contractors');
