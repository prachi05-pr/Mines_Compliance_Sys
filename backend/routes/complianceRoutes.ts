import { Router, Response } from 'express';
import { Compliance } from '../models/Compliance.js';
import { Mine } from '../models/Mine.js';
import { authenticate, AuthRequest, requireMineAccess } from '../middleware/auth.js';
import { AlertService } from '../services/alertService.js';
import mongoose from 'mongoose';

const router = Router();

/**
 * GET /api/compliance
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let query: any = {};

    if (user.role === 'MINE_OFFICER' || user.role === 'CORPORATE_MANAGER') {
      const authorizedIds = (user.mineIds || []).map((id) => new mongoose.Types.ObjectId(id));
      query = { mineId: { $in: authorizedIds } };
    }

    const compliances = await Compliance.find(query)
      .populate('mineId', 'name mineCode state')
      .sort({ dueDate: 1 });

    res.json(compliances);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch compliance records', message: err.message });
  }
});

/**
 * GET /api/compliance/mine/:mineId
 */
router.get('/mine/:mineId', authenticate, requireMineAccess('params', 'mineId'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { mineId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(mineId)) {
      res.status(400).json({ error: 'Invalid mine ID' });
      return;
    }

    const compliances = await Compliance.find({ mineId: new mongoose.Types.ObjectId(mineId) })
      .populate('mineId', 'name mineCode')
      .sort({ dueDate: 1 });

    res.json(compliances);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch mine compliance', message: err.message });
  }
});

/**
 * POST /api/compliance
 */
router.post('/', authenticate, requireMineAccess('body', 'mineId'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { mineId, category, requirement, status, dueDate, notes } = req.body;

    if (!mineId || !category || !requirement || !dueDate) {
      res.status(400).json({ error: 'mineId, category, requirement, and dueDate are required.' });
      return;
    }

    const compliance = new Compliance({
      mineId: new mongoose.Types.ObjectId(mineId),
      category,
      requirement: requirement.trim(),
      status: status || 'COMPLIANT',
      dueDate: new Date(dueDate),
      lastUpdated: new Date(),
      notes: notes || '',
      createdAt: new Date(),
    });

    await compliance.save();

    // Check if alert needs to be dispatched
    await AlertService.createAlertsForCompliance(mineId, requirement, compliance.status, compliance.dueDate, compliance._id as any);

    res.status(201).json(compliance);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create compliance record', message: err.message });
  }
});

/**
 * PUT /api/compliance/:id
 */
router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid compliance ID' });
      return;
    }

    const compliance = await Compliance.findById(id);
    if (!compliance) {
      res.status(404).json({ error: 'Compliance record not found' });
      return;
    }

    // Authorization check on the compliance's mineId
    const authorizedIds = (req.user!.mineIds || []).map((mid) => mid.toString());
    if (!authorizedIds.includes(compliance.mineId.toString())) {
      res.status(403).json({ error: 'Unauthorized for this mine compliance record' });
      return;
    }

    const { status, dueDate, notes, requirement } = req.body;
    if (status) compliance.status = status;
    if (dueDate) compliance.dueDate = new Date(dueDate);
    if (notes !== undefined) compliance.notes = notes;
    if (requirement) compliance.requirement = requirement;
    compliance.lastUpdated = new Date();

    await compliance.save();

    // Recalculate mine's compliance score
    const allMineCompliances = await Compliance.find({ mineId: compliance.mineId });
    if (allMineCompliances.length > 0) {
      const compliantCount = allMineCompliances.filter((c) => c.status === 'COMPLIANT').length;
      const partialCount = allMineCompliances.filter((c) => c.status === 'PARTIALLY_COMPLIANT').length;
      const score = Math.round(((compliantCount + partialCount * 0.5) / allMineCompliances.length) * 100);
      await Mine.findByIdAndUpdate(compliance.mineId, { complianceScore: score });
    }

    // Trigger statutory alerts if needed
    await AlertService.createAlertsForCompliance(compliance.mineId, compliance.requirement, compliance.status, compliance.dueDate, compliance._id as any);

    res.json(compliance);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update compliance record', message: err.message });
  }
});

export default router;
