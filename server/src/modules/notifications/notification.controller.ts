import { Request, Response } from 'express';
import { NotificationService } from './notification.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export class NotificationController {
  static async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const list = await NotificationService.getNotifications(req.companyId, req.user?._id as any);
      successResponse(res, list, 'Notifications retrieved.');
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  }

  static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const updated = await NotificationService.markAsRead(req.params.id, req.companyId);
      successResponse(res, updated, 'Notification marked as read.');
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }

  static async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const result = await NotificationService.markAllAsRead(req.companyId, req.user?._id as any);
      successResponse(res, result, 'All notifications marked as read.');
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  }
}
