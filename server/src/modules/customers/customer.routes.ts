import { Router } from 'express';
import { CustomerController } from './customer.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireTenantContext } from '../../middleware/tenant.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema,
} from './customer.validator.js';

export const customerRouter = Router();

customerRouter.use(authenticate);
customerRouter.use(requireTenantContext);

customerRouter.get(
  '/',
  validateRequest({ query: customerQuerySchema }),
  CustomerController.getCustomers
);

customerRouter.get('/:id', CustomerController.getCustomerById);

customerRouter.post(
  '/',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'DISPATCHER', 'ACCOUNTANT'),
  validateRequest({ body: createCustomerSchema }),
  CustomerController.createCustomer
);

customerRouter.patch(
  '/:id',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'DISPATCHER', 'ACCOUNTANT'),
  validateRequest({ body: updateCustomerSchema }),
  CustomerController.updateCustomer
);

customerRouter.delete(
  '/:id',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'DISPATCHER', 'ACCOUNTANT'),
  CustomerController.deleteCustomer
);
