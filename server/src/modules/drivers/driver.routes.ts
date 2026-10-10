import { Router } from 'express';
import { DriverController } from './driver.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireTenantContext } from '../../middleware/tenant.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  createDriverSchema,
  updateDriverSchema,
  driverQuerySchema,
} from './driver.validator.js';

export const driverRouter = Router();

driverRouter.use(authenticate);
driverRouter.use(requireTenantContext);

driverRouter.get(
  '/',
  validateRequest({ query: driverQuerySchema }),
  DriverController.getDrivers
);

driverRouter.get('/:id', DriverController.getDriverById);

driverRouter.post(
  '/',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'FLEET_MANAGER', 'DISPATCHER'),
  validateRequest({ body: createDriverSchema }),
  DriverController.createDriver
);

driverRouter.patch(
  '/:id',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'FLEET_MANAGER', 'DISPATCHER'),
  validateRequest({ body: updateDriverSchema }),
  DriverController.updateDriver
);

driverRouter.delete(
  '/:id',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'FLEET_MANAGER', 'DISPATCHER'),
  DriverController.deleteDriver
);
