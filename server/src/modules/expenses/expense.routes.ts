import { Router } from 'express';
import { ExpenseController } from './expense.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireTenantContext } from '../../middleware/tenant.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseQuerySchema,
} from './expense.validator.js';

export const expenseRouter = Router();

expenseRouter.use(authenticate);
expenseRouter.use(requireTenantContext);

expenseRouter.get(
  '/',
  validateRequest({ query: expenseQuerySchema }),
  ExpenseController.getExpenses
);

expenseRouter.get('/:id', ExpenseController.getExpenseById);

expenseRouter.post(
  '/',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'ACCOUNTANT', 'FLEET_MANAGER'),
  validateRequest({ body: createExpenseSchema }),
  ExpenseController.createExpense
);

expenseRouter.patch(
  '/:id',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'ACCOUNTANT', 'FLEET_MANAGER'),
  validateRequest({ body: updateExpenseSchema }),
  ExpenseController.updateExpense
);

expenseRouter.delete(
  '/:id',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER', 'ACCOUNTANT'),
  ExpenseController.deleteExpense
);
