import { Router } from 'express';
import { CompanyController } from './company.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireTenantContext } from '../../middleware/tenant.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { updateCompanyProfileSchema } from './company.validator.js';

export const companyRouter = Router();

companyRouter.use(authenticate);
companyRouter.use(requireTenantContext);

// Any authenticated company member can view company profile
companyRouter.get('/profile', CompanyController.getProfile);

// Only COMPANY_OWNER, MANAGER (or SUPER_ADMIN) can update company profile
companyRouter.patch(
  '/profile',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER'),
  validateRequest({ body: updateCompanyProfileSchema }),
  CompanyController.updateProfile
);
