import mongoose, { Schema, Document, Types } from 'mongoose';

export type ComplianceCategory = 'SAFETY' | 'ENVIRONMENT' | 'LABOUR' | 'PRODUCTION' | 'EQUIPMENT' | 'OTHER';
export type ComplianceStatus = 'COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NON_COMPLIANT' | 'OVERDUE';

export interface ICompliance extends Document {
  mineId: Types.ObjectId;
  category: ComplianceCategory;
  requirement: string;
  status: ComplianceStatus;
  dueDate: Date;
  lastUpdated: Date;
  notes: string;
  createdAt: Date;
}

const ComplianceSchema = new Schema<ICompliance>(
  {
    mineId: {
      type: Schema.Types.ObjectId,
      ref: 'Mine',
      required: [true, 'Mine reference is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['SAFETY', 'ENVIRONMENT', 'LABOUR', 'PRODUCTION', 'EQUIPMENT', 'OTHER'],
    },
    requirement: {
      type: String,
      required: [true, 'Compliance requirement is required'],
      trim: true,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['COMPLIANT', 'PARTIALLY_COMPLIANT', 'NON_COMPLIANT', 'OVERDUE'],
      default: 'COMPLIANT',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
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

ComplianceSchema.index({ mineId: 1 });
ComplianceSchema.index({ status: 1 });
ComplianceSchema.index({ dueDate: 1 });

export const Compliance: mongoose.Model<ICompliance> =
  (mongoose.models.Compliance as mongoose.Model<ICompliance>) ||
  mongoose.model<ICompliance>('Compliance', ComplianceSchema, 'compliances');
