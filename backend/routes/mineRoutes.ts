import { Router, Response } from 'express';
import { Mine } from '../models/Mine.js';
import { Compliance } from '../models/Compliance.js';
import { Inspection } from '../models/Inspection.js';
import { Violation } from '../models/Violation.js';
import { Contractor } from '../models/Contractor.js';
import { Alert } from '../models/Alert.js';
import { authenticate, AuthRequest, requireMineAccess } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = Router();

/**
 * GET /api/mines
 * Returns mines filtered by user role and mine authorizations
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let query: any = {};

    if (user.role === 'MINE_OFFICER') {
      const authorizedIds = (user.mineIds || []).map((id) => new mongoose.Types.ObjectId(id));
      query = { _id: { $in: authorizedIds } };
    } else if (user.role === 'CORPORATE_MANAGER' && user.mineIds && user.mineIds.length > 0) {
      const authorizedIds = user.mineIds.map((id) => new mongoose.Types.ObjectId(id));
      query = { _id: { $in: authorizedIds } };
    }

    const mines = await Mine.find(query).sort({ complianceScore: 1 });
    res.json(mines);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch mines', message: err.message });
  }
});

/**
 * GET /api/mines/:id
 * Strictly enforces mine authorization
 */
router.get('/:id', authenticate, requireMineAccess('params', 'id'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid Mine ID' });
      return;
    }

    const mine = await Mine.findById(id);
    if (!mine) {
      res.status(404).json({ error: 'Mine not found' });
      return;
    }

    // Load related entities for comprehensive mine details view
    const [compliances, inspections, violations, contractors, alerts] = await Promise.all([
      Compliance.find({ mineId: mine._id }).sort({ dueDate: 1 }),
      Inspection.find({ mineId: mine._id }).sort({ inspectionDate: -1 }).limit(10),
      Violation.find({ mineId: mine._id }).sort({ createdAt: -1 }),
      Contractor.find({ mineId: mine._id }),
      Alert.find({ mineId: mine._id }).sort({ createdAt: -1 }).limit(10),
    ]);

    res.json({
      mine,
      compliances,
      inspections,
      violations,
      contractors,
      alerts,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch mine details', message: err.message });
  }
});

/**
 * POST /api/mines
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, mineCode, location, state, district, mineType, productionTarget, productionActual, operationalStatus } = req.body;

    if (!name || !mineCode) {
      res.status(400).json({ error: 'Mine name and unique mine code are required.' });
      return;
    }

    const existing = await Mine.findOne({ mineCode: mineCode.toUpperCase().trim() });
    if (existing) {
      res.status(400).json({ error: 'Mine with this code already exists.' });
      return;
    }

    const mine = new Mine({
      name: name.trim(),
      mineCode: mineCode.toUpperCase().trim(),
      location: location || '',
      state: state || '',
      district: district || '',
      mineType: mineType || 'Open-Cast',
      productionTarget: Number(productionTarget) || 1000,
      productionActual: Number(productionActual) || 800,
      operationalStatus: operationalStatus || 'ACTIVE',
      complianceScore: 85,
      riskLevel: 'LOW',
      createdAt: new Date(),
    });

    await mine.save();

    // If corporate manager created it, add to their authorized list
    if (req.user && req.user.role === 'CORPORATE_MANAGER') {
      req.user.mineIds.push(mine._id as any);
      await req.user.save();
    }

    res.status(201).json(mine);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create mine', message: err.message });
  }
});

/**
 * PUT /api/mines/:id
 */
router.put('/:id', authenticate, requireMineAccess('params', 'id'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Do not allow overwriting mineCode with duplicates
    if (updates.mineCode) {
      delete updates.mineCode;
    }

    const mine = await Mine.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!mine) {
      res.status(404).json({ error: 'Mine not found' });
      return;
    }

    res.json(mine);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update mine', message: err.message });
  }
});

export default router;
