import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models/User.js';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'coal_mine_governance_secure_jwt_secret_key_sih2026';

export interface AuthRequest extends Request {
  user?: IUser;
  tokenPayload?: {
    userId: string;
    email: string;
    role: UserRole;
    mineIds?: string[];
  };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: UserRole;
      mineIds?: string[];
    };

    req.tokenPayload = decoded;

    if (!mongoose.Types.ObjectId.isValid(decoded.userId)) {
      res.status(401).json({ error: 'Invalid user token payload.' });
      return;
    }

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      res.status(401).json({ error: 'User associated with token not found.' });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid or expired token', message: err.message });
  }
}

export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden: Insufficient permissions for this resource.',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
      return;
    }

    next();
  };
}

export function requireMineAccess(source: 'params' | 'body' | 'query' = 'params', fieldName = 'id') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    let mineId: string | undefined;
    if (source === 'params') {
      mineId = req.params[fieldName];
    } else if (source === 'body') {
      mineId = req.body[fieldName];
    } else if (source === 'query') {
      mineId = req.query[fieldName] as string;
    }

    if (!mineId) {
      // If not specified, let controller validate or handle
      next();
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(mineId)) {
      res.status(400).json({ error: 'Invalid Mine ObjectId format' });
      return;
    }

    const authorizedMineIds = (req.user.mineIds || []).map((id) => id.toString());

    if (!authorizedMineIds.includes(mineId)) {
      res.status(403).json({
        error: 'Forbidden: You are not authorized to view or manage this mine.',
        mineId,
        authorizedMines: authorizedMineIds,
      });
      return;
    }

    next();
  };
}
