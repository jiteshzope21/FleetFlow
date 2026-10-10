import { Router } from 'express';
import { TripController } from './trip.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireTenantContext } from '../../middleware/tenant.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

export const tripRouter = Router();

tripRouter.use(authenticate);
tripRouter.use(requireTenantContext);

tripRouter.get('/', TripController.list);
tripRouter.get('/:id', TripController.getById);

tripRouter.post(
  '/',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'DISPATCHER'),
  TripController.create
);

tripRouter.patch(
  '/:id',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'DISPATCHER'),
  TripController.update
);

tripRouter.post(
  '/:id/start',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'DISPATCHER', 'DRIVER'),
  TripController.start
);

tripRouter.post(
  '/:id/complete',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'DISPATCHER', 'DRIVER'),
  TripController.complete
);

tripRouter.post(
  '/:id/cancel',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'DISPATCHER'),
  TripController.cancel
);

tripRouter.delete(
  '/:id',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'DISPATCHER'),
  TripController.archive
);
