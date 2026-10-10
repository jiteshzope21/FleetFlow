import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireTenantContext } from '../../middleware/tenant.middleware.js';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);
dashboardRouter.use(requireTenantContext);

dashboardRouter.get('/overview', DashboardController.getOverview);
dashboardRouter.get('/activity', DashboardController.getActivity);
