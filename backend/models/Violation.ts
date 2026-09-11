import mongoose, { Schema, Document, Types } from 'mongoose';

export type ViolationCategory = 'SAFETY' | 'ENVIRONMENT' | 'LABOUR' | 'PRODUCTION' | 'EQUIPMENT' | 'OTHER';
export type ViolationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ViolationStatus = 'AI_SUGGESTED' | 'CONFIRMED' | 'REJECTED';

export interface IViolation extends Document {
  mineId: Types.ObjectId;
  inspectionId: Types.ObjectId;
  category: ViolationCategory;
  violationType: string;
  description: string;
  severity: ViolationSeverity;
  confidence: number;
  status: ViolationStatus;
  confirmedBy?: Types.ObjectId | null;
  confirmedAt?: Date | null;
  createdAt: Date;
}

const ViolationSchema = new Schema<IViolation>(
  {
    mineId: {
      type: Schema.Types.ObjectId,
      ref: 'Mine',
      required: [true, 'Mine reference is required'],
    },
    inspectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Inspection',
      required: [true, 'Inspection reference is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['SAFETY', 'ENVIRONMENT', 'LABOUR', 'PRODUCTION', 'EQUIPMENT', 'OTHER'],
    },
    violationType: {
      type: String,
      required: [true, 'Violation type is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    severity: {
      type: String,
      required: [true, 'Severity is required'],
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    confidence: {
      type: Number,
      default: 0.85,
      min: [0, 'Confidence must be between 0 and 1'],
      max: [1, 'Confidence must be between 0 and 1'],
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['AI_SUGGESTED', 'CONFIRMED', 'REJECTED'],
      default: 'AI_SUGGESTED',
    },
    confirmedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    confirmedAt: {
      type: Date,
      default: null,
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

ViolationSchema.index({ mineId: 1 });
ViolationSchema.index({ inspectionId: 1 });
ViolationSchema.index({ category: 1 });
ViolationSchema.index({ violationType: 1 });
ViolationSchema.index({ severity: 1 });
ViolationSchema.index({ createdAt: 1 });

export const Violation: mongoose.Model<IViolation> =
  (mongoose.models.Violation as mongoose.Model<IViolation>) ||
  mongoose.model<IViolation>('Violation', ViolationSchema, 'violations');
