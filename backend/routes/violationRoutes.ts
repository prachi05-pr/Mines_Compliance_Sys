import { Router, Response } from 'express';
import { Violation } from '../models/Violation.js';
import { Inspection } from '../models/Inspection.js';
import { Mine } from '../models/Mine.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AlertService } from '../services/alertService.js';
import mongoose from 'mongoose';

const router = Router();

/**
 * GET /api/violations
 * Supports category, severity, status, and mineId query filters
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { category, severity, status, mineId } = req.query;

    const query: any = {};

    // Authorization scoping
    if (user.role === 'MINE_OFFICER' || user.role === 'CORPORATE_MANAGER') {
      const authorizedIds = (user.mineIds || []).map((id) => new mongoose.Types.ObjectId(id));
      if (mineId && authorizedIds.some((id) => id.toString() === mineId)) {
        query.mineId = new mongoose.Types.ObjectId(mineId as string);
      } else {
        query.mineId = { $in: authorizedIds };
      }
    } else if (mineId) {
      query.mineId = new mongoose.Types.ObjectId(mineId as string);
    }

    if (category) query.category = category;
    if (severity) query.severity = severity;
    if (status) query.status = status;

    const violations = await Violation.find(query)
      .populate('mineId', 'name mineCode state location')
      .populate('inspectionId', 'inspectionDate inspectionType observations')
      .populate('confirmedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json(violations);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch violations', message: err.message });
  }
});

/**
 * GET /api/violations/:id
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid violation ID' });
      return;
    }

    const violation = await Violation.findById(id)
      .populate('mineId', 'name mineCode state location complianceScore riskLevel')
      .populate('inspectionId')
      .populate('confirmedBy', 'name email');

    if (!violation) {
      res.status(404).json({ error: 'Violation not found' });
      return;
    }

    // Authorization check
    const authorizedIds = (req.user!.mineIds || []).map((mid) => mid.toString());
    if (!authorizedIds.includes((violation.mineId as any)._id.toString())) {
      res.status(403).json({ error: 'Unauthorized to view this violation' });
      return;
    }

    res.json(violation);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch violation details', message: err.message });
  }
});

/**
 * PUT /api/violations/:id/confirm
 * Human Validation: Mine Officer validates AI suggestion
 */
router.put('/:id/confirm', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid violation ID' });
      return;
    }

    const violation = await Violation.findById(id);
    if (!violation) {
      res.status(404).json({ error: 'Violation not found' });
      return;
    }

    // Role check: Only Mine Officer can confirm violations
    if (req.user!.role !== 'MINE_OFFICER') {
      res.status(403).json({ error: 'Only Mine Safety Officers can perform statutory field validation and confirmation.' });
      return;
    }

    // Mine authorization check
    const authorizedIds = (req.user!.mineIds || []).map((mid) => mid.toString());
    if (!authorizedIds.includes(violation.mineId.toString())) {
      res.status(403).json({ error: 'Unauthorized to confirm violations for this mine.' });
      return;
    }

    // Update status to CONFIRMED
    violation.status = 'CONFIRMED';
    violation.confirmedBy = req.user!._id;
    violation.confirmedAt = new Date();
    await violation.save();

    // Mark inspection as COMPLETED
    if (violation.inspectionId) {
      await Inspection.findByIdAndUpdate(violation.inspectionId, { status: 'COMPLETED' });
    }

    // Dispatch NEW_VIOLATION alert
    await AlertService.createAlertsForViolation(
      violation.mineId,
      violation.violationType,
      violation.severity as any,
      violation._id as any
    );

    // Minor penalty on mine compliance score
    const mine = await Mine.findById(violation.mineId);
    if (mine) {
      const penalty = violation.severity === 'CRITICAL' ? 8 : violation.severity === 'HIGH' ? 5 : 2;
      mine.complianceScore = Math.max(0, mine.complianceScore - penalty);
      await mine.save();
    }

    res.json({
      message: 'Violation confirmed successfully by authorized human inspector.',
      violation,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to confirm violation', message: err.message });
  }
});

/**
 * PUT /api/violations/:id/reject
 * Human Validation: Mine Officer or Authority rejects AI suggestion
 */
router.put('/:id/reject', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid violation ID' });
      return;
    }

    const violation = await Violation.findById(id);
    if (!violation) {
      res.status(404).json({ error: 'Violation not found' });
      return;
    }

    // Mine authorization check
    if (req.user!.role === 'MINE_OFFICER') {
      const authorizedIds = (req.user!.mineIds || []).map((mid) => mid.toString());
      if (!authorizedIds.includes(violation.mineId.toString())) {
        res.status(403).json({ error: 'Unauthorized to reject violations for this mine.' });
        return;
      }
    }

    violation.status = 'REJECTED';
    violation.confirmedBy = req.user!._id;
    violation.confirmedAt = new Date();
    await violation.save();

    // Mark inspection as COMPLETED
    if (violation.inspectionId) {
      await Inspection.findByIdAndUpdate(violation.inspectionId, { status: 'COMPLETED' });
    }

    res.json({
      message: 'AI suggestion rejected. No confirmed statutory violation created.',
      violation,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reject violation', message: err.message });
  }
});

export default router;
