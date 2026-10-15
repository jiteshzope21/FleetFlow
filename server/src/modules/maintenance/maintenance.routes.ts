import { Router } from 'express';
import { MaintenanceController } from './maintenance.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireTenantContext } from '../../middleware/tenant.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  createMaintenanceSchema,
  updateMaintenanceSchema,
  maintenanceQuerySchema,
} from './maintenance.validator.js';

export const maintenanceRouter = Router();

maintenanceRouter.use(authenticate);
maintenanceRouter.use(requireTenantContext);

maintenanceRouter.get(
  '/',
  validateRequest({ query: maintenanceQuerySchema }),
  MaintenanceController.getMaintenanceList
);

maintenanceRouter.get('/:id', MaintenanceController.getMaintenanceById);

maintenanceRouter.post(
  '/',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'FLEET_MANAGER', 'MAINTENANCE_MANAGER'),
  validateRequest({ body: createMaintenanceSchema }),
  MaintenanceController.createMaintenance
);

maintenanceRouter.patch(
  '/:id',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'FLEET_MANAGER', 'MAINTENANCE_MANAGER'),
  validateRequest({ body: updateMaintenanceSchema }),
  MaintenanceController.updateMaintenance
);

maintenanceRouter.put(
  '/:id',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'FLEET_MANAGER', 'MAINTENANCE_MANAGER'),
  validateRequest({ body: updateMaintenanceSchema }),
  MaintenanceController.updateMaintenance
);

maintenanceRouter.delete(
  '/:id',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'FLEET_MANAGER', 'MAINTENANCE_MANAGER'),
  MaintenanceController.deleteMaintenance
);
