import { Router } from 'express';
import { ReportController } from './report.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireTenantContext } from '../../middleware/tenant.middleware.js';

export const reportRouter = Router();

reportRouter.use(authenticate);
reportRouter.use(requireTenantContext);

reportRouter.get('/summary', ReportController.getSummary);
reportRouter.get('/export/shipments', ReportController.exportShipments);
reportRouter.get('/export/trips', ReportController.exportTrips);
