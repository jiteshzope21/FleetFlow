import { Router } from 'express';
import { SupportController } from './support.controller.js';
import { ChatController } from './chat.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireTenantContext } from '../../middleware/tenant.middleware.js';

export const supportRouter = Router();

supportRouter.use(authenticate, requireTenantContext);

// AI Chatbot Support Routes (Placed before /:id parameter match)
supportRouter.post('/chat', ChatController.sendMessage);
supportRouter.get('/chat/conversations', ChatController.getConversations);
supportRouter.get('/chat/conversations/:id', ChatController.getConversationById);
supportRouter.delete('/chat/conversations/:id', ChatController.deleteConversation);
supportRouter.post('/chat/escalate', ChatController.escalate);
supportRouter.get('/chat/model-info', ChatController.getModelInfo);

// Support Ticket Routes
supportRouter.get('/', SupportController.getTickets);
supportRouter.get('/:id', SupportController.getTicketById);
supportRouter.post('/', SupportController.createTicket);
supportRouter.post('/:id/reply', SupportController.replyTicket);
