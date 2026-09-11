import { Mine } from '../models/Mine.js';
import mongoose, { Types } from 'mongoose';

export interface AnomalyResult {
  detected: boolean;
  metric: string;
  currentValue: number;
  baselineValue: number;
  deviationPercentage: number;
  description: string;
}

export class AnomalyService {
  /**
   * Deterministic operational statistical anomaly detector.
   */
  static async detectOperationalAnomaly(
    mineId: Types.ObjectId | string,
    operationalData: {
      production?: number;
      attendance?: number;
      downtimeHours?: number;
      safetyIncidents?: number;
    }
  ): Promise<AnomalyResult> {
    const mineObjId = new mongoose.Types.ObjectId(mineId);
    const mine = await Mine.findById(mineObjId);

    const targetProduction = mine?.productionTarget || 1000;
    const baselineAttendance = 100; // Expected attendance percentage or baseline headcount ratio
    const baselineDowntime = 4; // Normal max acceptable equipment downtime hours per shift
    const baselineIncidents = 0;

    const prod = operationalData.production ?? 0;
    const att = operationalData.attendance ?? 100;
    const down = operationalData.downtimeHours ?? 0;
    const incidents = operationalData.safetyIncidents ?? 0;

    // Check Safety Incidents first (Zero Tolerance)
    if (incidents > 0) {
      return {
        detected: true,
        metric: 'safetyIncidents',
        currentValue: incidents,
        baselineValue: baselineIncidents,
        deviationPercentage: 100,
        description: `Safety anomaly: ${incidents} lost-time safety incident(s) reported during shift.`,
      };
    }

    // Check Equipment Downtime (>8 hours is a major anomaly)
    if (down > 8) {
      const dev = ((down - baselineDowntime) / baselineDowntime) * 100;
      return {
        detected: true,
        metric: 'downtimeHours',
        currentValue: down,
        baselineValue: baselineDowntime,
        deviationPercentage: Math.round(dev * 10) / 10,
        description: `Equipment downtime reached ${down} hrs (${dev > 0 ? '+' : ''}${dev.toFixed(1)}% above shift tolerance).`,
      };
    }

    // Check Production Deficit (>20% shortfall from target)
    if (targetProduction > 0 && prod < targetProduction * 0.8) {
      const dev = ((prod - targetProduction) / targetProduction) * 100;
      return {
        detected: true,
        metric: 'production',
        currentValue: prod,
        baselineValue: targetProduction,
        deviationPercentage: Math.round(dev * 10) / 10,
        description: `Coal production is ${Math.abs(dev).toFixed(1)}% below the scheduled target of ${targetProduction} TPD.`,
      };
    }

    // Check Attendance Deficit (<80% normal attendance)
    if (att < 80) {
      const dev = ((att - baselineAttendance) / baselineAttendance) * 100;
      return {
        detected: true,
        metric: 'attendance',
        currentValue: att,
        baselineValue: baselineAttendance,
        deviationPercentage: Math.round(dev * 10) / 10,
        description: `Workforce attendance dropped to ${att}% (${Math.abs(dev).toFixed(1)}% manpower deficit).`,
      };
    }

    // No significant anomaly detected
    return {
      detected: false,
      metric: 'none',
      currentValue: prod,
      baselineValue: targetProduction,
      deviationPercentage: 0,
      description: 'Operational metrics are within acceptable statutory baseline tolerances.',
    };
  }
}
