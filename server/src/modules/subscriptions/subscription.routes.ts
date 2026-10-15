import { Router } from 'express';
import { SubscriptionController } from './subscription.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireTenantContext } from '../../middleware/tenant.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  purchaseSubscriptionSchema,
  toggleAutoRenewSchema,
  cancelSubscriptionSchema,
} from './subscription.validator.js';

export const subscriptionRouter = Router();

// All subscription operations require authentication and active tenant context
subscriptionRouter.use(authenticate);
subscriptionRouter.use(requireTenantContext);

// Get current subscription & usage quotas (All workspace members can view limits)
subscriptionRouter.get('/current', SubscriptionController.getCurrent);

// Get available subscription plans
subscriptionRouter.get('/plans', SubscriptionController.getPlans);

// Company Owner actions:
// Purchase or upgrade subscription plan
subscriptionRouter.post(
  '/purchase',
  requireRole('COMPANY_OWNER', 'SUPER_ADMIN'),
  validate(purchaseSubscriptionSchema),
  SubscriptionController.purchase
);

// Toggle auto-renewal status
subscriptionRouter.patch(
  '/auto-renew',
  requireRole('COMPANY_OWNER', 'SUPER_ADMIN'),
  validate(toggleAutoRenewSchema),
  SubscriptionController.toggleAutoRenew
);

// Cancel auto-renew / cancel subscription
subscriptionRouter.post(
  '/cancel',
  requireRole('COMPANY_OWNER', 'SUPER_ADMIN'),
  validate(cancelSubscriptionSchema),
  SubscriptionController.cancel
);
