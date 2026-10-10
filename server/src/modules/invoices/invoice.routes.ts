import { Router } from 'express';
import { InvoiceController } from './invoice.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireTenantContext } from '../../middleware/tenant.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createInvoiceSchema, recordPaymentSchema } from './invoice.validator.js';

export const invoiceRouter = Router();

// All invoice routes require authentication and tenant context
invoiceRouter.use(authenticate, requireTenantContext);

// Read invoices: accessible to Company Owner, Manager, Accountant, Dispatcher, Viewer
invoiceRouter.get('/', InvoiceController.getInvoices);
invoiceRouter.get('/:id', InvoiceController.getInvoiceById);

// Create invoices: Owner, Manager, Accountant
invoiceRouter.post(
  '/',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'ACCOUNTANT'),
  validate(createInvoiceSchema),
  InvoiceController.createInvoice
);

// Record payment: Owner, Manager, Accountant
invoiceRouter.post(
  '/:id/payments',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'ACCOUNTANT'),
  validate(recordPaymentSchema),
  InvoiceController.recordPayment
);
