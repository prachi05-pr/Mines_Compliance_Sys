import { Router, Response } from 'express';
import { Inspection } from '../models/Inspection.js';
import { Mine } from '../models/Mine.js';
import { Violation } from '../models/Violation.js';
import { authenticate, AuthRequest, requireMineAccess } from '../middleware/auth.js';
import { AiService } from '../services/aiService.js';
import { RecurrenceService } from '../services/recurrenceService.js';
import { AnomalyService } from '../services/anomalyService.js';
import { RiskService } from '../services/riskService.js';
import { AlertService } from '../services/alertService.js';
import mongoose from 'mongoose';

const router = Router();

/**
 * GET /api/inspections
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let query: any = {};

    if (user.role === 'MINE_OFFICER') {
      const authorizedIds = (user.mineIds || []).map((id) => new mongoose.Types.ObjectId(id));
      query = { mineId: { $in: authorizedIds } };
    } else if (user.role === 'CORPORATE_MANAGER') {
      const authorizedIds = (user.mineIds || []).map((id) => new mongoose.Types.ObjectId(id));
      query = { mineId: { $in: authorizedIds } };
    }

    const inspections = await Inspection.find(query)
      .populate('mineId', 'name mineCode state location')
      .populate('officerId', 'name email')
      .sort({ inspectionDate: -1 });

    res.json(inspections);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch inspections', message: err.message });
  }
});

/**
 * GET /api/inspections/:id
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid inspection ID' });
      return;
    }

    const inspection = await Inspection.findById(id)
      .populate('mineId', 'name mineCode state location complianceScore riskLevel')
      .populate('officerId', 'name email');

    if (!inspection) {
      res.status(404).json({ error: 'Inspection not found' });
      return;
    }

    // Mine authorization check
    const authorizedIds = (req.user!.mineIds || []).map((mid) => mid.toString());
    if (!authorizedIds.includes((inspection.mineId as any)._id.toString())) {
      res.status(403).json({ error: 'Unauthorized to view inspections for this mine.' });
      return;
    }

    // Fetch related AI_SUGGESTED or CONFIRMED violations linked to this inspection
    const violations = await Violation.find({ inspectionId: inspection._id });

    res.json({
      inspection,
      violations,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch inspection details', message: err.message });
  }
});

/**
 * POST /api/inspections
 * Creates a new statutory inspection
 */
router.post('/', authenticate, requireMineAccess('body', 'mineId'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      mineId,
      formType = 'FORM_IV_A',
      date,
      inspectionDate,
      shift = '1ST',
      submissionTime,
      inspectionTimings,
      observations,
      checklist,
      inspectionType,
      operationalData,
      autoAnalyze,
    } = req.body;

    if (!mineId) {
      res.status(400).json({ error: 'mineId is required' });
      return;
    }

    const resolvedDate = date ? new Date(date) : inspectionDate ? new Date(inspectionDate) : new Date();
    const resolvedType =
      formType === 'FORM_IV_A'
        ? "Form IV-A – Sirdar's Daily Report"
        : inspectionType || 'Routine Safety Inspection';

    const now = new Date();
    const resolvedSubmissionTime =
      submissionTime || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    const inspection = new Inspection({
      mineId: new mongoose.Types.ObjectId(mineId),
      officerId: req.user!._id,
      formType: formType || 'FORM_IV_A',
      shift: shift || '1ST',
      submissionTime: resolvedSubmissionTime,
      inspectionTimings: inspectionTimings || { first: '', second: '', third: '' },
      inspectionDate: resolvedDate,
      inspectionType: resolvedType,
      checklist: checklist || [],
      observations: observations || [],
      formObservations: Array.isArray(observations) ? observations : [],
      operationalData: {
        production: Number(operationalData?.production) || 0,
        attendance: Number(operationalData?.attendance) || 100,
        downtimeHours: Number(operationalData?.downtimeHours) || 0,
        safetyIncidents: Number(operationalData?.safetyIncidents) || 0,
      },
      status: 'DRAFT',
      riskScore: 0,
      riskLevel: 'LOW',
      createdAt: new Date(),
    });

    await inspection.save();

    // If autoAnalyze flag is provided, execute full pipeline immediately
    if (autoAnalyze) {
      return executeInspectionAnalysis(inspection, req, res);
    }

    res.status(201).json(inspection);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create inspection', message: err.message });
  }
});

/**
 * PUT /api/inspections/:id
 */
router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid inspection ID' });
      return;
    }

    const inspection = await Inspection.findById(id);
    if (!inspection) {
      res.status(404).json({ error: 'Inspection not found' });
      return;
    }

    const authorizedIds = (req.user!.mineIds || []).map((mid) => mid.toString());
    if (!authorizedIds.includes(inspection.mineId.toString())) {
      res.status(403).json({ error: 'Unauthorized for this mine inspection.' });
      return;
    }

    const { checklist, observations, operationalData, inspectionType, status } = req.body;
    if (checklist) inspection.checklist = checklist;
    if (observations !== undefined) inspection.observations = observations;
    if (inspectionType) inspection.inspectionType = inspectionType;
    if (status) inspection.status = status;
    if (operationalData) {
      inspection.operationalData = {
        production: operationalData.production ?? inspection.operationalData.production,
        attendance: operationalData.attendance ?? inspection.operationalData.attendance,
        downtimeHours: operationalData.downtimeHours ?? inspection.operationalData.downtimeHours,
        safetyIncidents: operationalData.safetyIncidents ?? inspection.operationalData.safetyIncidents,
      };
    }

    await inspection.save();
    res.json(inspection);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update inspection', message: err.message });
  }
});

/**
 * POST /api/inspections/:id/analyze
 * Full Pipeline: AI Analysis -> Recurrence -> Anomaly -> Risk Scoring -> AI_SUGGESTED Violation -> Alerts
 */
router.post('/:id/analyze', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid inspection ID' });
      return;
    }

    const inspection = await Inspection.findById(id);
    if (!inspection) {
      res.status(404).json({ error: 'Inspection not found' });
      return;
    }

    const authorizedIds = (req.user!.mineIds || []).map((mid) => mid.toString());
    if (!authorizedIds.includes(inspection.mineId.toString())) {
      res.status(403).json({ error: 'Unauthorized to analyze inspections for this mine.' });
      return;
    }

    return executeInspectionAnalysis(inspection, req, res);
  } catch (err: any) {
    res.status(500).json({ error: 'AI analysis pipeline failure', message: err.message });
  }
});

async function executeInspectionAnalysis(inspection: any, req: AuthRequest, res: Response): Promise<void> {
  const mine = await Mine.findById(inspection.mineId);
  const previousMineRisk = mine?.riskLevel || 'LOW';

  // 1. Build text representation of observations for AI Analysis
  let inspectionText = '';
  if (Array.isArray(inspection.observations) && inspection.observations.length > 0) {
    const issues = inspection.observations.filter(
      (obs: any) =>
        obs.status === 'ISSUE_OBSERVED' ||
        obs.status === 'ACCIDENT_OCCURRED' ||
        (obs.details && obs.details.trim().length > 0)
    );

    if (issues.length > 0) {
      inspectionText = issues
        .map(
          (obs: any) =>
            `${obs.title || obs.section}: [${obs.status}] ${obs.details || 'Issue observed during sirdar underground inspection.'}`
        )
        .join('. ');
    } else {
      inspectionText = `All 8 underground statutory observations (Roof & sides, Ventilation, Coal dust, Fencing, Water seepage, Timber support, Dangers, Accidents) inspected during Sirdar shift ${inspection.shift || '1st'} and verified satisfactory.`;
    }
  } else if (typeof inspection.observations === 'string') {
    inspectionText = inspection.observations || 'Routine underground pit inspection';
  } else {
    inspectionText = "Form IV-A Sirdar's Daily Safety Inspection";
  }

  const aiResult = await AiService.analyzeInspection({
    mineId: inspection.mineId.toString(),
    inspectionText,
    operationalData: inspection.operationalData,
  });

  // 2. Historical Recurrence Detection
  const recurrence = await RecurrenceService.evaluateRecurrence(
    inspection.mineId,
    aiResult.category,
    aiResult.violationType
  );

  // 3. Operational Anomaly Detection (ignore telemetry shortfall for Form IV-A if telemetry is omitted)
  const isFormIVWithoutTelemetry =
    inspection.formType === 'FORM_IV_A' &&
    (!inspection.operationalData?.production && !inspection.operationalData?.attendance);

  const anomaly = isFormIVWithoutTelemetry
    ? {
        detected: false,
        metric: 'none',
        currentValue: 0,
        baselineValue: 0,
        deviationPercentage: 0,
        description: 'Statutory Form IV-A safety report verified.',
      }
    : await AnomalyService.detectOperationalAnomaly(
        inspection.mineId,
        inspection.operationalData || {}
      );

  // 4. Count existing active confirmed violations for risk calculation
  const activeConfirmedViolationsCount = await Violation.countDocuments({
    mineId: inspection.mineId,
    status: 'CONFIRMED',
  });

  // 5. Explainable Risk Engine
  const riskCalculation = RiskService.calculateRisk({
    aiSeverity: aiResult.severity,
    aiConfidence: aiResult.confidence,
    recurrenceCount: recurrence.previousOccurrences,
    anomalyDetected: anomaly.detected,
    anomalyMetric: anomaly.metric,
    complianceScore: mine?.complianceScore || 80,
    confirmedViolationsCount: activeConfirmedViolationsCount,
  });

  // 6. Update Inspection Document
  inspection.status = 'UNDER_REVIEW';
  inspection.aiAnalysis = {
    category: aiResult.category,
    violationType: aiResult.violationType,
    severity: aiResult.severity,
    confidence: aiResult.confidence,
    explanation: aiResult.explanation,
    recurrence: {
      previousOccurrences: recurrence.previousOccurrences,
      recurrenceLevel: recurrence.recurrenceLevel,
      lastOccurrence: recurrence.lastOccurrence,
    },
    anomaly: {
      detected: anomaly.detected,
      metric: anomaly.metric,
      currentValue: anomaly.currentValue,
      baselineValue: anomaly.baselineValue,
      deviationPercentage: anomaly.deviationPercentage,
    },
  };
  inspection.riskScore = riskCalculation.riskScore;
  inspection.riskLevel = riskCalculation.riskLevel;

  await inspection.save();

  // 7. Update Mine Risk Level
  if (mine) {
    mine.riskLevel = riskCalculation.riskLevel;
    await mine.save();
  }

  // 8. Human-in-the-loop: create AI_SUGGESTED Violation (DO NOT automatically confirm)
  let violationDoc: any = null;
  if (aiResult.violationType !== 'STATUTORY_SURVEILLANCE_VERIFIED' && aiResult.severity !== 'LOW') {
    violationDoc = await Violation.findOne({
      inspectionId: inspection._id,
      violationType: aiResult.violationType,
    });

    if (!violationDoc) {
      violationDoc = new Violation({
        mineId: inspection.mineId,
        inspectionId: inspection._id,
        category: aiResult.category,
        violationType: aiResult.violationType,
        description: aiResult.explanation,
        severity: aiResult.severity,
        confidence: aiResult.confidence,
        status: 'AI_SUGGESTED',
        createdAt: new Date(),
      });
      await violationDoc.save();
    }
  }

  // 9. Centralized Alert Dispatches
  const alertPromises: Promise<any>[] = [
    AlertService.createAlertsForRisk(
      inspection.mineId,
      riskCalculation.riskScore,
      riskCalculation.riskLevel,
      previousMineRisk,
      inspection._id
    ),
  ];

  if (recurrence.previousOccurrences > 0) {
    alertPromises.push(
      AlertService.createAlertsForRecurrence(
        inspection.mineId,
        aiResult.category,
        aiResult.violationType,
        recurrence.previousOccurrences,
        inspection._id
      )
    );
  }

  if (anomaly.detected) {
    alertPromises.push(AlertService.createAlertsForAnomaly(inspection.mineId, anomaly, inspection._id));
  }

  if (violationDoc) {
    alertPromises.push(
      AlertService.createAlertsForInspection(
        inspection.mineId,
        'INSPECTION_REVIEW_PENDING',
        `Inspection Review Pending: ${aiResult.violationType.replace(/_/g, ' ')}`,
        `AI identified a ${aiResult.severity} severity finding requiring Mine Officer human validation.`,
        aiResult.severity === 'CRITICAL' ? 'CRITICAL' : 'MEDIUM',
        inspection._id
      )
    );
  }

  await Promise.all(alertPromises);

  res.json({
    message: 'AI statutory analysis completed. Finding is ready for Human Validation.',
    inspection,
    violation: violationDoc,
    riskAnalysis: {
      score: riskCalculation.riskScore,
      level: riskCalculation.riskLevel,
      reasons: riskCalculation.reasons,
    },
    recurrence,
    anomaly,
  });
}

export default router;
