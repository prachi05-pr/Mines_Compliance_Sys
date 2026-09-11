export interface RiskEngineInput {
  aiSeverity?: string;
  aiConfidence?: number;
  recurrenceCount?: number;
  anomalyDetected?: boolean;
  anomalyMetric?: string;
  complianceScore?: number;
  confirmedViolationsCount?: number;
}

export interface RiskEngineResult {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasons: string[];
}

export class RiskService {
  /**
   * Deterministic, explainable risk score calculation for statutory compliance.
   */
  static calculateRisk(input: RiskEngineInput): RiskEngineResult {
    let score = 15; // Base normal operational baseline
    const reasons: string[] = [];

    // 1. AI Severity & Confidence Contribution (up to 40 pts)
    const severity = input.aiSeverity?.toUpperCase() || 'LOW';
    const confidence = input.aiConfidence ?? 0.8;

    if (severity === 'CRITICAL') {
      const pts = Math.round(40 * confidence);
      score += pts;
      reasons.push(`Critical severity violation identified by AI inspection analysis (+${pts} pts, confidence ${(confidence * 100).toFixed(0)}%)`);
    } else if (severity === 'HIGH') {
      const pts = Math.round(28 * confidence);
      score += pts;
      reasons.push(`High severity statutory hazard detected (+${pts} pts, confidence ${(confidence * 100).toFixed(0)}%)`);
    } else if (severity === 'MEDIUM') {
      const pts = Math.round(16 * confidence);
      score += pts;
      reasons.push(`Medium risk operational non-conformance detected (+${pts} pts)`);
    } else {
      score += 5;
      reasons.push('Low-risk statutory observation noted (+5 pts)');
    }

    // 2. Historical Recurrence Contribution (up to 25 pts)
    const recurrence = input.recurrenceCount ?? 0;
    if (recurrence >= 4) {
      score += 25;
      reasons.push(`Severe recurrence: ${recurrence} previous similar violations recorded across last inspection cycles (+25 pts)`);
    } else if (recurrence >= 2) {
      score += 15;
      reasons.push(`Repeated infraction: ${recurrence} previous violations in this category (+15 pts)`);
    } else if (recurrence === 1) {
      score += 8;
      reasons.push('Prior single violation history recorded for this category (+8 pts)');
    } else {
      reasons.push('No historical recurrence recorded for this specific violation type');
    }

    // 3. Operational Anomaly Contribution (up to 20 pts)
    if (input.anomalyDetected) {
      score += 18;
      reasons.push(`Statutory operational anomaly detected in ${input.anomalyMetric || 'operational metrics'} (+18 pts)`);
    }

    // 4. Compliance Score Penalty (up to 15 pts)
    const compScore = input.complianceScore ?? 80;
    if (compScore < 60) {
      score += 15;
      reasons.push(`Mine compliance rating is critically low at ${compScore}% (+15 pts)`);
    } else if (compScore < 75) {
      score += 8;
      reasons.push(`Mine compliance rating is below standard threshold (${compScore}%) (+8 pts)`);
    }

    // 5. Unresolved Confirmed Violations (up to 10 pts)
    const confCount = input.confirmedViolationsCount ?? 0;
    if (confCount >= 3) {
      score += 10;
      reasons.push(`Multiple active confirmed statutory violations pending remediation (${confCount} active) (+10 pts)`);
    }

    // Clamp score to 0–100
    score = Math.max(0, Math.min(100, score));

    // Determine Level according to Section 15:
    // 0–24 → LOW
    // 25–49 → MEDIUM
    // 50–74 → HIGH
    // 75–100 → CRITICAL
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (score >= 75) {
      riskLevel = 'CRITICAL';
    } else if (score >= 50) {
      riskLevel = 'HIGH';
    } else if (score >= 25) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }

    return {
      riskScore: score,
      riskLevel,
      reasons,
    };
  }
}
