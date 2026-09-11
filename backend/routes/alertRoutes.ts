import { Router, Response } from 'express';
import { Alert } from '../models/Alert.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = Router();

/**
 * GET /api/alerts
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { severity, type, isRead, mineId } = req.query;

    const query: any = {};

    // Scoping to authorized mines
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

    if (severity && severity !== 'ALL') {
      query.severity = severity;
    }
    if (type) {
      query.type = type;
    }
    if (isRead !== undefined && isRead !== '') {
      query.isRead = isRead === 'true';
    }

    const alerts = await Alert.find(query)
      .populate('mineId', 'name mineCode state')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(alerts);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch alerts', message: err.message });
  }
});

/**
 * GET /api/alerts/:id
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid alert ID' });
      return;
    }

    const alert = await Alert.findById(id).populate('mineId', 'name mineCode state');
    if (!alert) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }

    res.json(alert);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch alert', message: err.message });
  }
});

/**
 * PUT /api/alerts/:id/read
 */
router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid alert ID' });
      return;
    }

    const alert = await Alert.findByIdAndUpdate(id, { isRead: true }, { new: true });
    if (!alert) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }

    res.json(alert);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update alert', message: err.message });
  }
});

/**
 * PUT /api/alerts/read-all
 */
router.put('/read-all', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let query: any = { isRead: false };

    if (user.role === 'MINE_OFFICER' || user.role === 'CORPORATE_MANAGER') {
      const authorizedIds = (user.mineIds || []).map((id) => new mongoose.Types.ObjectId(id));
      query.mineId = { $in: authorizedIds };
    }

    const result = await Alert.updateMany(query, { isRead: true });
    res.json({ message: 'All pending alerts marked as read', modifiedCount: result.modifiedCount });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to mark alerts as read', message: err.message });
  }
});

export default router;
