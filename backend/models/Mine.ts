import mongoose, { Schema, Document } from 'mongoose';

export type OperationalStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface IMine extends Document {
  name: string;
  mineCode: string;
  location: string;
  state: string;
  district: string;
  mineType: string;
  productionTarget: number;
  productionActual: number;
  operationalStatus: OperationalStatus;
  complianceScore: number;
  riskLevel: RiskLevel;
  createdAt: Date;
}

const MineSchema = new Schema<IMine>(
  {
    name: {
      type: String,
      required: [true, 'Mine name is required'],
      trim: true,
    },
    mineCode: {
      type: String,
      required: [true, 'Mine code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    location: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      default: '',
    },
    district: {
      type: String,
      default: '',
    },
    mineType: {
      type: String,
      default: 'Open-Cast',
    },
    productionTarget: {
      type: Number,
      default: 1000,
      min: [0, 'Target cannot be negative'],
    },
    productionActual: {
      type: Number,
      default: 800,
      min: [0, 'Actual production cannot be negative'],
    },
    operationalStatus: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'],
      default: 'ACTIVE',
    },
    complianceScore: {
      type: Number,
      default: 80,
      min: [0, 'Compliance score cannot be less than 0'],
      max: [100, 'Compliance score cannot exceed 100'],
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

MineSchema.index({ mineCode: 1 }, { unique: true });

export const Mine: mongoose.Model<IMine> =
  (mongoose.models.Mine as mongoose.Model<IMine>) ||
  mongoose.model<IMine>('Mine', MineSchema, 'mines');
