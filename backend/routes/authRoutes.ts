import { Router, Request, Response } from 'express';
import { User } from '../models/User.js';
import { hashPassword, verifyPassword, generateToken } from '../services/authService.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/signup
 */
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, mineIds, organizationId } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ error: 'Name, email, password, and role are required.' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(400).json({ error: 'A user with this email address already exists.' });
      return;
    }

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashPassword(password),
      role,
      mineIds: mineIds || [],
      organizationId: organizationId || null,
      createdAt: new Date(),
    });

    await user.save();
    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mineIds: user.mineIds,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Signup error', message: err.message });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isValid = verifyPassword(password, user.password);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mineIds: user.mineIds,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Login error', message: err.message });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      mineIds: req.user.mineIds,
      createdAt: req.user.createdAt,
    },
  });
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
