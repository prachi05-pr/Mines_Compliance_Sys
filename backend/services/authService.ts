import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'coal_mine_governance_secure_jwt_secret_key_sih2026';
const AUTH_SALT = 'sih2026_coal_mine_governance_salt';

/**
 * Isolated authentication hasher compatible with MVP requirements (no bcrypt).
 */
export function hashPassword(plainText: string): string {
  return crypto.createHash('sha256').update(`${AUTH_SALT}:${plainText}`).digest('hex');
}

export function verifyPassword(plainText: string, storedHash: string): boolean {
  // Support both hashed password and raw comparison for legacy/demo flexibility
  const computed = hashPassword(plainText);
  return computed === storedHash || plainText === storedHash;
}

export function generateToken(user: IUser): string {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    mineIds: (user.mineIds || []).map((id) => id.toString()),
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
