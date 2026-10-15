import { Router } from 'express';
import { checkDBHealth } from '../config/db.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { companyRouter } from '../modules/company/company.routes.js';
import { userRouter } from '../modules/users/user.routes.js';
import { dashboardRouter } from '../modules/dashboard/dashboard.routes.js';
import { vehicleRouter } from '../modules/vehicles/vehicle.routes.js';
import { driverRouter } from '../modules/drivers/driver.routes.js';
import { customerRouter } from '../modules/customers/customer.routes.js';
import { maintenanceRouter } from '../modules/maintenance/maintenance.routes.js';
import { fuelRouter } from '../modules/fuel/fuel.routes.js';
import { expenseRouter } from '../modules/expenses/expense.routes.js';
import { shipmentRouter } from '../modules/shipments/shipment.routes.js';
import { tripRouter } from '../modules/trips/trip.routes.js';
import { reportRouter } from '../modules/reports/report.routes.js';
import { aiRouter } from '../modules/ai/ai.routes.js';
import { adminRouter } from '../modules/admin/admin.routes.js';
import { invoiceRouter } from '../modules/invoices/invoice.routes.js';
import { notificationRouter } from '../modules/notifications/notification.routes.js';
import { supportRouter } from '../modules/support/support.routes.js';
import { tenantAnnouncementRouter } from '../modules/announcements/announcement.routes.js';
import { subscriptionRouter } from '../modules/subscriptions/subscription.routes.js';

export const apiRouter = Router();

// Health check endpoint (Health & Accurate Database Connectivity Status)
apiRouter.get('/health', (_req, res) => {
  const dbHealth = checkDBHealth();
  const isHealthy = dbHealth.isConnected;

  const data = {
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'FleetFlow SaaS API',
    version: '4.0.0 (Phase 3 & 4)',
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
apiRouter.use('/admin', adminRouter);
apiRouter.use('/company', companyRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/vehicles', vehicleRouter);
apiRouter.use('/drivers', driverRouter);
apiRouter.use('/customers', customerRouter);
apiRouter.use('/maintenance', maintenanceRouter);
apiRouter.use('/fuel', fuelRouter);
apiRouter.use('/expenses', expenseRouter);
apiRouter.use('/shipments', shipmentRouter);
apiRouter.use('/trips', tripRouter);
apiRouter.use('/reports', reportRouter);
apiRouter.use('/ai', aiRouter);
apiRouter.use('/invoices', invoiceRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/support', supportRouter);
apiRouter.use('/announcements', tenantAnnouncementRouter);
apiRouter.use('/subscriptions', subscriptionRouter);


