// Quota enforcement middleware without MongoDB transactions (compatible with in-memory DB)
import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/apiResponse.js';
import { SubscriptionService } from '../modules/subscriptions/subscription.service.js';
import { QuotaReservation } from '../models/QuotaReservation.js';

/**
 * Factory to create a quota enforcement middleware for a specific resource.
 * Resource can be 'vehicles', 'users', or 'shipments'.
 * It atomically reserves one unit using a findOneAndUpdate upsert.
 * If the reservation would exceed the subscription limit, the reservation is rolled back.
 * This implementation avoids MongoDB transactions to remain compatible with in-memory test servers.
 */
export function createQuotaMiddleware(resource: 'vehicles' | 'users' | 'shipments') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = (req as any).companyId;
      if (!companyId) {
        return errorResponse(res, 'Company context missing for quota enforcement.', 500);
      }

      // Get subscription limits and current usage
      const subInfo = await SubscriptionService.getCurrentSubscription(companyId);
      let limit: number;
      let currentUsage: number;
      switch (resource) {
        case 'vehicles':
          limit = subInfo.limits.maxVehicles;
          currentUsage = subInfo.usage.vehiclesCount;
          break;
        case 'users':
          limit = subInfo.limits.maxUsers;
          currentUsage = subInfo.usage.usersCount;
          break;
        case 'shipments':
          limit = subInfo.limits.maxShipmentsPerMonth;
          currentUsage = subInfo.usage.shipmentsCountThisMonth;
          break;
        default:
          limit = 0;
          currentUsage = 0;
      }

      // Atomically increment the reservation count (or create it)
      const reservation = await QuotaReservation.findOneAndUpdate(
        { companyId, resource },
        { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(Date.now() + 5 * 60 * 1000) } },
        { new: true, upsert: true }
      );

      if (!reservation) {
        return errorResponse(res, 'Failed to create quota reservation.', 500);
      }

      const total = reservation.count + currentUsage;
      if (total > limit) {
        // Roll back the reservation increment
        await QuotaReservation.findOneAndUpdate({ _id: reservation._id }, { $inc: { count: -1 } });
        // Clean up if count drops to zero
        if (reservation.count - 1 <= 0) {
          await QuotaReservation.deleteOne({ _id: reservation._id });
        }
        return errorResponse(res, `Quota exceeded for ${resource}. Limit is ${limit}.`, 400);
      }

      // Schedule cleanup after response finishes
      res.on('finish', async () => {
        try {
          await QuotaReservation.findOneAndUpdate({ _id: reservation._id }, { $inc: { count: -1 } });
          const fresh = await QuotaReservation.findById(reservation._id);
          if (fresh && fresh.count <= 0) {
            await QuotaReservation.deleteOne({ _id: reservation._id });
          }
        } catch (e) {
          console.error('Failed to clean up quota reservation', e);
        }
      });

      next();
    } catch (err: any) {
      return errorResponse(res, `Quota verification error: ${err.message}`, 500);
    }
  };
}
