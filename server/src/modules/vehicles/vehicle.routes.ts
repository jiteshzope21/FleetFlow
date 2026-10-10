import { Router } from 'express';
import { VehicleController } from './vehicle.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireTenantContext } from '../../middleware/tenant.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleQuerySchema,
} from './vehicle.validator.js';

export const vehicleRouter = Router();

vehicleRouter.use(authenticate);
vehicleRouter.use(requireTenantContext);

vehicleRouter.get(
  '/',
  validateRequest({ query: vehicleQuerySchema }),
  VehicleController.getVehicles
);

vehicleRouter.get('/:id', VehicleController.getVehicleById);

vehicleRouter.post(
  '/',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'FLEET_MANAGER'),
  validateRequest({ body: createVehicleSchema }),
  VehicleController.createVehicle
);

vehicleRouter.patch(
  '/:id',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'FLEET_MANAGER'),
  validateRequest({ body: updateVehicleSchema }),
  VehicleController.updateVehicle
);

vehicleRouter.delete(
  '/:id',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'FLEET_MANAGER'),
  VehicleController.deleteVehicle
);
