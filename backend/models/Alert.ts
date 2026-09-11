import mongoose, { Schema, Document, Types } from 'mongoose';

export type AlertType =
  | 'CRITICAL_RISK'
  | 'HIGH_RISK'
  | 'RECURRING_VIOLATION'
  | 'COMPLIANCE_DEADLINE'
  | 'COMPLIANCE_OVERDUE'
  | 'OPERATIONAL_ANOMALY'
  | 'ATTENDANCE_ANOMALY'
  | 'DOWNTIME_ANOMALY'
  | 'NEW_VIOLATION'
  | 'AI_ANALYSIS_PENDING'
  | 'AI_SERVICE_FAILURE'
  | 'INSPECTION_REVIEW_PENDING'
  | 'MULTIPLE_VIOLATIONS'
  | 'MINE_RISK_ESCALATION'
  | 'COMPLIANCE_SCORE_DROP';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface IAlert extends Document {
  userId?: Types.ObjectId | null;
  mineId: Types.ObjectId;
  type: AlertType;
  title: string;
  message: string;
  severity: AlertSeverity;
  relatedEntityId?: Types.ObjectId | null;
  isRead: boolean;
  createdAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    mineId: {
      type: Schema.Types.ObjectId,
      ref: 'Mine',
      required: [true, 'Mine reference is required'],
    },
    type: {
      type: String,
      required: [true, 'Alert type is required'],
      enum: [
        'CRITICAL_RISK',
        'HIGH_RISK',
        'RECURRING_VIOLATION',
        'COMPLIANCE_DEADLINE',
        'COMPLIANCE_OVERDUE',
        'OPERATIONAL_ANOMALY',
        'ATTENDANCE_ANOMALY',
        'DOWNTIME_ANOMALY',
        'NEW_VIOLATION',
        'AI_ANALYSIS_PENDING',
        'AI_SERVICE_FAILURE',
        'INSPECTION_REVIEW_PENDING',
        'MULTIPLE_VIOLATIONS',
        'MINE_RISK_ESCALATION',
        'COMPLIANCE_SCORE_DROP',
      ],
    },
    title: {
      type: String,
      required: [true, 'Alert title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Alert message is required'],
      trim: true,
    },
    severity: {
      type: String,
      required: [true, 'Alert severity is required'],
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    relatedEntityId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
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

AlertSchema.index({ userId: 1 });
AlertSchema.index({ mineId: 1 });
AlertSchema.index({ isRead: 1 });
AlertSchema.index({ createdAt: -1 });
AlertSchema.index({ type: 1 });

export const Alert: mongoose.Model<IAlert> =
  (mongoose.models.Alert as mongoose.Model<IAlert>) ||
  mongoose.model<IAlert>('Alert', AlertSchema, 'alerts');
