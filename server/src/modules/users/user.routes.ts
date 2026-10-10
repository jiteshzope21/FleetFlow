import { Router } from 'express';
import { UserController } from './user.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireTenantContext } from '../../middleware/tenant.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
  updateStatusSchema,
} from './user.validator.js';

export const userRouter = Router();

userRouter.use(authenticate);
userRouter.use(requireTenantContext);

userRouter.get(
  '/',
  validateRequest({ query: userQuerySchema }),
  UserController.getUsers
);

userRouter.get('/:id', UserController.getUserById);

userRouter.post(
  '/',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER'),
  validateRequest({ body: createUserSchema }),
  UserController.createUser
);

userRouter.patch(
  '/:id',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER'),
  validateRequest({ body: updateUserSchema }),
  UserController.updateUser
);

userRouter.patch(
  '/:id/status',
  requireRole('SUPER_ADMIN', 'COMPANY_OWNER', 'MANAGER'),
  validateRequest({ body: updateStatusSchema }),
  UserController.updateStatus
);
