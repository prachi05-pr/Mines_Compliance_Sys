import { Router, Response } from 'express';
import { DashboardService } from '../services/dashboardService.js';
import { authenticate, AuthRequest, requireRoles } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/dashboard/officer
 */
router.get('/officer', authenticate, requireRoles('MINE_OFFICER', 'CORPORATE_MANAGER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const mineIds = user.mineIds || [];

    const data = await DashboardService.getOfficerDashboard(mineIds);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load Officer Dashboard data', message: err.message });
  }
});

/**
 * GET /api/dashboard/corporate
 */
router.get('/corporate', authenticate, requireRoles('CORPORATE_MANAGER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const accessibleMineIds = user.mineIds;

    const data = await DashboardService.getCorporateDashboard(accessibleMineIds);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load Corporate Dashboard data', message: err.message });
  }
});

export default router;
