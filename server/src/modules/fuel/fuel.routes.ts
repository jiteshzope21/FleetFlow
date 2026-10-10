import { Router } from 'express';
import { FuelController } from './fuel.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireTenantContext } from '../../middleware/tenant.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  createFuelLogSchema,
  updateFuelLogSchema,
  fuelQuerySchema,
} from './fuel.validator.js';

export const fuelRouter = Router();

fuelRouter.use(authenticate);
fuelRouter.use(requireTenantContext);

fuelRouter.get(
  '/',
  validateRequest({ query: fuelQuerySchema }),
  FuelController.getFuelLogs
);

fuelRouter.get('/:id', FuelController.getFuelLogById);

fuelRouter.post(
  '/',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'FLEET_MANAGER', 'DISPATCHER', 'DRIVER'),
  validateRequest({ body: createFuelLogSchema }),
  FuelController.createFuelLog
);

fuelRouter.patch(
  '/:id',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'FLEET_MANAGER', 'DISPATCHER'),
  validateRequest({ body: updateFuelLogSchema }),
  FuelController.updateFuelLog
);

fuelRouter.delete(
  '/:id',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'FLEET_MANAGER'),
  FuelController.deleteFuelLog
);
