import { Router } from 'express';
import { AiController } from './ai.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireTenantContext } from '../../middleware/tenant.middleware.js';

export const aiRouter = Router();

aiRouter.use(authenticate);
aiRouter.use(requireTenantContext);

aiRouter.get('/health', AiController.getHealth);
aiRouter.post('/predict-trip-cost', AiController.predictTripCost);
aiRouter.get('/insights', AiController.getFleetInsights);
aiRouter.get('/recommendations', AiController.getRecommendations);
aiRouter.patch('/recommendations/:id/dismiss', AiController.dismissRecommendation);
