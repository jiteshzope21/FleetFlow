import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from './subscription.service.js';
import { successResponse } from '../../utils/apiResponse.js';

export class SubscriptionController {
  static async getCurrent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await SubscriptionService.getCurrentSubscription(req.companyId!);
      successResponse(res, data, 'Current subscription details retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async getPlans(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await SubscriptionService.getAvailablePlans();
      successResponse(res, plans, 'Available subscription plans retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async purchase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SubscriptionService.purchaseSubscription(
        req.companyId!,
        req.body,
        req.user
      );
      successResponse(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  static async toggleAutoRenew(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updatedSub = await SubscriptionService.toggleAutoRenew(
        req.companyId!,
        req.body.autoRenew,
        req.user
      );
      successResponse(
        res,
        updatedSub,
        `Auto-renewal has been ${req.body.autoRenew ? 'enabled' : 'disabled'}.`
      );
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updatedSub = await SubscriptionService.cancelSubscription(
        req.companyId!,
        req.body?.reason,
        req.user
      );
      successResponse(
        res,
        updatedSub,
        'Subscription auto-renew cancelled. Your workspace remains active until the end of your billing cycle.'
      );
    } catch (error) {
      next(error);
    }
  }
}
