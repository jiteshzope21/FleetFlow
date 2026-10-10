import { Router } from 'express';
import { ShipmentController } from './shipment.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireTenantContext } from '../../middleware/tenant.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

export const shipmentRouter = Router();

shipmentRouter.use(authenticate);
shipmentRouter.use(requireTenantContext);

shipmentRouter.get('/', ShipmentController.list);
shipmentRouter.get('/:id', ShipmentController.getById);

shipmentRouter.post(
  '/',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'DISPATCHER'),
  ShipmentController.create
);

shipmentRouter.patch(
  '/:id',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'DISPATCHER'),
  ShipmentController.update
);

shipmentRouter.post(
  '/:id/confirm-delivery',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'DISPATCHER', 'DRIVER'),
  ShipmentController.confirmDelivery
);

shipmentRouter.delete(
  '/:id',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'DISPATCHER'),
  ShipmentController.archive
);
