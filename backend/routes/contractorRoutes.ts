import { Router, Response } from 'express';
import { Contractor } from '../models/Contractor.js';
import { authenticate, AuthRequest, requireMineAccess } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = Router();

/**
 * GET /api/contractors
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let query: any = {};

    if (user.role === 'MINE_OFFICER' || user.role === 'CORPORATE_MANAGER') {
      const authorizedIds = (user.mineIds || []).map((id) => new mongoose.Types.ObjectId(id));
      query = { mineId: { $in: authorizedIds } };
    }

    const contractors = await Contractor.find(query)
      .populate('mineId', 'name mineCode')
      .sort({ createdAt: -1 });

    res.json(contractors);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch contractors', message: err.message });
  }
});

/**
 * GET /api/contractors/:id
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid contractor ID' });
      return;
    }

    const contractor = await Contractor.findById(id).populate('mineId', 'name mineCode');
    if (!contractor) {
      res.status(404).json({ error: 'Contractor not found' });
      return;
    }

    const authorizedIds = (req.user!.mineIds || []).map((mid) => mid.toString());
    if (!authorizedIds.includes(contractor.mineId._id.toString())) {
      res.status(403).json({ error: 'Unauthorized for this contractor record' });
      return;
    }

    res.json(contractor);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch contractor', message: err.message });
  }
});

/**
 * POST /api/contractors
 */
router.post('/', authenticate, requireMineAccess('body', 'mineId'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { mineId, name, company, category, workforceCount, status, complianceStatus } = req.body;

    if (!mineId || !name || !company) {
      res.status(400).json({ error: 'mineId, contractor name, and company are required.' });
      return;
    }

    const contractor = new Contractor({
      mineId: new mongoose.Types.ObjectId(mineId),
      name: name.trim(),
      company: company.trim(),
      category: category || 'General Mining Services',
      workforceCount: Number(workforceCount) || 0,
      status: status || 'ACTIVE',
      complianceStatus: complianceStatus || 'COMPLIANT',
      createdAt: new Date(),
    });

    await contractor.save();
    res.status(201).json(contractor);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create contractor', message: err.message });
  }
});

/**
 * PUT /api/contractors/:id
 */
router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid contractor ID' });
      return;
    }

    const contractor = await Contractor.findById(id);
    if (!contractor) {
      res.status(404).json({ error: 'Contractor not found' });
      return;
    }

    const authorizedIds = (req.user!.mineIds || []).map((mid) => mid.toString());
    if (!authorizedIds.includes(contractor.mineId.toString())) {
      res.status(403).json({ error: 'Unauthorized for this contractor record' });
      return;
    }

    const updates = req.body;
    Object.assign(contractor, updates);
    await contractor.save();

    res.json(contractor);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update contractor', message: err.message });
  }
});

export default router;
