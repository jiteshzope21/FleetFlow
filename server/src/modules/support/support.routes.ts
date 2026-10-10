import { Router } from 'express';
import { SupportController } from './support.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireTenantContext } from '../../middleware/tenant.middleware.js';

export const supportRouter = Router();

supportRouter.use(authenticate, requireTenantContext);

supportRouter.get('/', SupportController.getTickets);
supportRouter.get('/:id', SupportController.getTicketById);
supportRouter.post('/', SupportController.createTicket);
supportRouter.post('/:id/reply', SupportController.replyTicket);
