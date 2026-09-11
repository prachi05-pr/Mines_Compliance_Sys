import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

import { connectDB, getDatabaseStatus } from './backend/config/database.js';
import { seedDatabase } from './backend/seed/seedData.js';

import authRoutes from './backend/routes/authRoutes.js';
import mineRoutes from './backend/routes/mineRoutes.js';
import complianceRoutes from './backend/routes/complianceRoutes.js';
import contractorRoutes from './backend/routes/contractorRoutes.js';
import inspectionRoutes from './backend/routes/inspectionRoutes.js';
import violationRoutes from './backend/routes/violationRoutes.js';
import alertRoutes from './backend/routes/alertRoutes.js';
import dashboardRoutes from './backend/routes/dashboardRoutes.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Connect to Database
  try {
    await connectDB();
    // Pre-seed demo data if clean database
    await seedDatabase(false);
  } catch (err: any) {
    console.error('Database connection error during boot:', err.message);
  }

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'AI-Enabled Coal Mine Governance Platform',
      version: '1.0.0-SIH2026',
      timestamp: new Date().toISOString(),
      database: getDatabaseStatus(),
    });
  });

  app.get('/api/db-status', (req, res) => {
    res.json(getDatabaseStatus());
  });

  app.post('/api/seed', async (req, res) => {
    try {
      await seedDatabase(true);
      res.json({ message: 'Synthetic demo database re-seeded successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Seed error', message: err.message });
    }
  });

  // Mount Feature Modules
  app.use('/api/auth', authRoutes);
  app.use('/api/mines', mineRoutes);
  app.use('/api/compliance', complianceRoutes);
  app.use('/api/contractors', contractorRoutes);
  app.use('/api/inspections', inspectionRoutes);
  app.use('/api/violations', violationRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Coal Mine Governance Platform server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
