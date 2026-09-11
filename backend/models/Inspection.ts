import mongoose, { Schema, Document, Types } from 'mongoose';

export type InspectionStatus = 'DRAFT' | 'AI_ANALYZED' | 'UNDER_REVIEW' | 'COMPLETED';
export type InspectionRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface IFormIVObservation {
  section: string;
  title: string;
  description?: string;
  status: string;
  details?: string;
}

export interface IFormIVTimings {
  first: string;
  second?: string;
  third?: string;
}

export interface IInspectionOperationalData {
  production?: number;
  attendance?: number;
  downtimeHours?: number;
  safetyIncidents?: number;
}

export interface IInspectionAiAnalysis {
  category: string;
  violationType: string;
  severity: string;
  confidence: number;
  explanation: string;
  recurrence?: {
    previousOccurrences: number;
    recurrenceLevel: string;
    lastOccurrence?: Date | null;
  };
  anomaly?: {
    detected: boolean;
    metric: string;
    currentValue: number;
    baselineValue: number;
    deviationPercentage: number;
  };
}

export interface IInspection extends Document {
  mineId: Types.ObjectId;
  officerId: Types.ObjectId;
  formType: string;
  shift?: string;
  submissionTime?: string;
  inspectionTimings?: IFormIVTimings;
  inspectionDate: Date;
  inspectionType: string;
  checklist?: any[];
  observations: any;
  formObservations?: IFormIVObservation[];
  operationalData?: IInspectionOperationalData;
  status: InspectionStatus;
  aiAnalysis?: IInspectionAiAnalysis | null;
  riskScore: number;
  riskLevel: InspectionRiskLevel;
  createdAt: Date;
}

const InspectionSchema = new Schema<IInspection>(
  {
    mineId: {
      type: Schema.Types.ObjectId,
      ref: 'Mine',
      required: [true, 'Mine reference is required'],
    },
    officerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Officer reference is required'],
    },
    formType: {
      type: String,
      default: 'FORM_IV_A',
      trim: true,
    },
    shift: {
      type: String,
      enum: ['1ST', '2ND', '3RD'],
      default: '1ST',
    },
    submissionTime: {
      type: String,
      default: '',
    },
    inspectionTimings: {
      first: { type: String, default: '' },
      second: { type: String, default: '' },
      third: { type: String, default: '' },
    },
    inspectionDate: {
      type: Date,
      default: Date.now,
    },
    inspectionType: {
      type: String,
      default: "Form IV-A – Sirdar's Daily Report",
      trim: true,
    },
    checklist: [Schema.Types.Mixed],
    observations: {
      type: Schema.Types.Mixed,
      default: [],
    },
    formObservations: [
      {
        section: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, default: '' },
        status: { type: String, required: true },
        details: { type: String, default: '' },
      },
    ],
    operationalData: {
      production: {
        type: Number,
        default: 0,
      },
      attendance: {
        type: Number,
        default: 0,
      },
      downtimeHours: {
        type: Number,
        default: 0,
      },
      safetyIncidents: {
        type: Number,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: ['DRAFT', 'AI_ANALYZED', 'UNDER_REVIEW', 'COMPLETED'],
      default: 'DRAFT',
    },
    aiAnalysis: {
      type: Schema.Types.Mixed,
      default: null,
    },
    riskScore: {
      type: Number,
      default: 0,
      min: [0, 'Risk score must be at least 0'],
      max: [100, 'Risk score cannot exceed 100'],
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW',
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

InspectionSchema.index({ mineId: 1 });
InspectionSchema.index({ officerId: 1 });
InspectionSchema.index({ inspectionDate: 1 });
InspectionSchema.index({ status: 1 });

export const Inspection: mongoose.Model<IInspection> =
  (mongoose.models.Inspection as mongoose.Model<IInspection>) ||
  mongoose.model<IInspection>('Inspection', InspectionSchema, 'inspections');
