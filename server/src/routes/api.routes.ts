import { Router } from 'express';
import { checkDBHealth } from '../config/db.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { companyRouter } from '../modules/company/company.routes.js';
import { userRouter } from '../modules/users/user.routes.js';
import { dashboardRouter } from '../modules/dashboard/dashboard.routes.js';

export const apiRouter = Router();

// Health check endpoint (Health & Accurate Database Connectivity Status)
apiRouter.get('/health', (_req, res) => {
  const dbHealth = checkDBHealth();
  const isHealthy = dbHealth.isConnected;

  const data = {
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'FleetFlow SaaS API',
    version: '1.0.0 (Phase 1)',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: dbHealth.state,
      connected: dbHealth.isConnected,
      storageType: dbHealth.storageType,
      isPersistent: dbHealth.isPersistent,
      note: dbHealth.isPersistent
        ? 'Connected to persistent MongoDB Atlas / external database.'
        : dbHealth.isConnected
        ? 'Running with ephemeral in-memory storage. Data will reset on server restart.'
        : 'Database is disconnected.',
    },
  };

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    data,
  });
});

// Module routes
apiRouter.use('/auth', authRouter);
apiRouter.use('/company', companyRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/dashboard', dashboardRouter);
