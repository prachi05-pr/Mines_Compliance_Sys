import { Alert, IAlert, AlertType, AlertSeverity } from '../models/Alert.js';
import mongoose, { Types } from 'mongoose';

export class AlertService {
  /**
   * Centralized method to create an alert with duplicate prevention.
   */
  static async createAlert(params: {
    userId?: Types.ObjectId | string | null;
    mineId: Types.ObjectId | string;
    type: AlertType;
    title: string;
    message: string;
    severity: AlertSeverity;
    relatedEntityId?: Types.ObjectId | string | null;
  }): Promise<IAlert | null> {
    try {
      const mineObjId = new mongoose.Types.ObjectId(params.mineId);
      const userObjId = params.userId ? new mongoose.Types.ObjectId(params.userId) : null;
      const relatedObjId = params.relatedEntityId ? new mongoose.Types.ObjectId(params.relatedEntityId) : null;

      // Duplicate prevention: check if identical alert was created within the last 12 hours
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
      const query: any = {
        mineId: mineObjId,
        type: params.type,
        createdAt: { $gte: twelveHoursAgo },
      };

      if (relatedObjId) {
        query.relatedEntityId = relatedObjId;
      }

      const existingAlert = await Alert.findOne(query);
      if (existingAlert) {
        // Prevent duplicate creation
        return existingAlert;
      }

      const alert = new Alert({
        userId: userObjId,
        mineId: mineObjId,
        type: params.type,
        title: params.title,
        message: params.message,
        severity: params.severity,
        relatedEntityId: relatedObjId,
        isRead: false,
        createdAt: new Date(),
      });

      await alert.save();
      return alert;
    } catch (err: any) {
      console.error('Error creating alert in AlertService:', err.message);
      return null;
    }
  }

  /**
   * Generate alerts based on risk scoring and risk escalation.
   */
  static async createAlertsForRisk(
    mineId: Types.ObjectId | string,
    riskScore: number,
    currentLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    previousLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    inspectionId?: Types.ObjectId | string
  ) {
    if (riskScore >= 75) {
      await this.createAlert({
        mineId,
        type: 'CRITICAL_RISK',
        title: 'Critical Risk Threshold Exceeded',
        message: `Calculated mine risk score reached ${riskScore}/100 (CRITICAL). Immediate statutory intervention required.`,
        severity: 'CRITICAL',
        relatedEntityId: inspectionId,
      });
    } else if (riskScore >= 50) {
      await this.createAlert({
        mineId,
        type: 'HIGH_RISK',
        title: 'High Risk Level Detected',
        message: `Mine risk score evaluated at ${riskScore}/100 (HIGH). Elevated operational monitoring recommended.`,
        severity: 'HIGH',
        relatedEntityId: inspectionId,
      });
    }

    if (previousLevel && currentLevel !== previousLevel) {
      const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      if (levels.indexOf(currentLevel) > levels.indexOf(previousLevel)) {
        await this.createAlert({
          mineId,
          type: 'MINE_RISK_ESCALATION',
          title: 'Mine Risk Escalation',
          message: `Mine risk status escalated from ${previousLevel} to ${currentLevel} following latest safety assessment.`,
          severity: currentLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          relatedEntityId: inspectionId,
        });
      }
    }
  }

  /**
   * Alert when recurring violations exceed threshold
   */
  static async createAlertsForRecurrence(
    mineId: Types.ObjectId | string,
    category: string,
    violationType: string,
    count: number,
    inspectionId?: Types.ObjectId | string
  ) {
    if (count >= 2) {
      await this.createAlert({
        mineId,
        type: 'RECURRING_VIOLATION',
        title: `Recurring Violation: ${violationType.replace(/_/g, ' ')}`,
        message: `Category ${category} has recorded ${count} recurring infractions over recent inspection cycles. Systemic correction required.`,
        severity: count >= 4 ? 'CRITICAL' : 'HIGH',
        relatedEntityId: inspectionId,
      });
    }
  }

  /**
   * Operational anomaly alerts (production, attendance, downtime)
   */
  static async createAlertsForAnomaly(
    mineId: Types.ObjectId | string,
    anomaly: {
      detected: boolean;
      metric: string;
      currentValue: number;
      baselineValue: number;
      deviationPercentage: number;
    },
    inspectionId?: Types.ObjectId | string
  ) {
    if (!anomaly || !anomaly.detected) return;

    let alertType: AlertType = 'OPERATIONAL_ANOMALY';
    let title = 'Operational Anomaly Detected';
    let severity: AlertSeverity = 'MEDIUM';

    if (anomaly.metric === 'attendance') {
      alertType = 'ATTENDANCE_ANOMALY';
      title = 'Significant Workforce Attendance Deficit';
      severity = anomaly.deviationPercentage < -25 ? 'HIGH' : 'MEDIUM';
    } else if (anomaly.metric === 'downtimeHours') {
      alertType = 'DOWNTIME_ANOMALY';
      title = 'Severe Equipment Downtime Spike';
      severity = anomaly.currentValue >= 12 ? 'HIGH' : 'MEDIUM';
    } else if (anomaly.metric === 'safetyIncidents') {
      alertType = 'OPERATIONAL_ANOMALY';
      title = 'On-site Safety Incident Reported';
      severity = 'CRITICAL';
    } else if (anomaly.metric === 'production') {
      title = 'Severe Production Target Shortfall';
      severity = anomaly.deviationPercentage < -30 ? 'HIGH' : 'MEDIUM';
    }

    await this.createAlert({
      mineId,
      type: alertType,
      title,
      message: `${anomaly.metric.toUpperCase()} deviated by ${anomaly.deviationPercentage.toFixed(1)}% (Observed: ${anomaly.currentValue}, Baseline: ${anomaly.baselineValue}).`,
      severity,
      relatedEntityId: inspectionId,
    });
  }

  /**
   * Compliance statutory alerts (approaching deadline, overdue, score drop)
   */
  static async createAlertsForCompliance(
    mineId: Types.ObjectId | string,
    requirement: string,
    status: string,
    dueDate: Date,
    complianceId?: Types.ObjectId | string
  ) {
    const now = new Date();
    const daysUntilDue = Math.ceil((new Date(dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (status === 'OVERDUE' || (new Date(dueDate) < now && status !== 'COMPLIANT')) {
      await this.createAlert({
        mineId,
        type: 'COMPLIANCE_OVERDUE',
        title: 'Statutory Compliance Overdue',
        message: `Mandatory requirement "${requirement}" is past due (${Math.abs(daysUntilDue)} days overdue). Statutory sanction risk.`,
        severity: 'HIGH',
        relatedEntityId: complianceId,
      });
    } else if (daysUntilDue <= 7 && daysUntilDue >= 0 && status !== 'COMPLIANT') {
      await this.createAlert({
        mineId,
        type: 'COMPLIANCE_DEADLINE',
        title: 'Compliance Deadline Approaching',
        message: `Requirement "${requirement}" due in ${daysUntilDue} day(s). Action pending.`,
        severity: daysUntilDue <= 3 ? 'HIGH' : 'MEDIUM',
        relatedEntityId: complianceId,
      });
    }
  }

  /**
   * Alert for confirmed new violation
   */
  static async createAlertsForViolation(
    mineId: Types.ObjectId | string,
    violationType: string,
    severity: AlertSeverity,
    violationId?: Types.ObjectId | string
  ) {
    await this.createAlert({
      mineId,
      type: 'NEW_VIOLATION',
      title: `Confirmed Violation: ${violationType.replace(/_/g, ' ')}`,
      message: `Human validation confirmed new ${severity} severity violation for this mine.`,
      severity,
      relatedEntityId: violationId,
    });
  }

  /**
   * Alert for review pending or multiple violations
   */
  static async createAlertsForInspection(
    mineId: Types.ObjectId | string,
    type: 'INSPECTION_REVIEW_PENDING' | 'MULTIPLE_VIOLATIONS' | 'AI_SERVICE_FAILURE',
    title: string,
    message: string,
    severity: AlertSeverity = 'MEDIUM',
    inspectionId?: Types.ObjectId | string
  ) {
    await this.createAlert({
      mineId,
      type,
      title,
      message,
      severity,
      relatedEntityId: inspectionId,
    });
  }
}
