import { Router } from 'express';
import { NotificationController } from './notification.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

export const notificationRouter = Router();

notificationRouter.use(authenticate);

notificationRouter.get('/', NotificationController.getNotifications);
notificationRouter.patch('/:id/read', NotificationController.markAsRead);
notificationRouter.post('/read-all', NotificationController.markAllAsRead);
