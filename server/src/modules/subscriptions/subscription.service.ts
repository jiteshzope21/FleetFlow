import mongoose from 'express';
import mongoosePkg from 'mongoose';
import { Subscription, ISubscription, ISubscriptionPayment } from '../../models/Subscription.js';
import { Plan, IPlan } from '../../models/Plan.js';
import { Company } from '../../models/Company.js';
import { Vehicle } from '../../models/Vehicle.js';
import { User, IUser } from '../../models/User.js';
import { Shipment } from '../../models/Shipment.js';
import { AuditLog } from '../../models/AuditLog.js';
import { Notification } from '../../models/Notification.js';
import { AdminService } from '../admin/admin.service.js';
import { PurchaseSubscriptionInput } from './subscription.validator.js';

export class SubscriptionService {
  /**
   * Fetch current company subscription, plan details, and live quota usage
   */
  static async getCurrentSubscription(companyId: mongoosePkg.Types.ObjectId) {
    // Ensure default plans exist
    await AdminService.seedDefaultPlans();

    let sub = await Subscription.findOne({ companyId }).populate('planId');

    // Auto-initialize a default trial if one doesn't exist yet for this company
    if (!sub) {
      const defaultPlan = (await Plan.findOne({ code: 'STARTER' })) || (await Plan.findOne());
      if (defaultPlan) {
        const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        sub = await Subscription.create({
          companyId,
          planId: defaultPlan._id,
          planCode: defaultPlan.code,
          status: 'TRIAL',
          billingCycle: 'MONTHLY',
          startDate: new Date(),
          endDate: trialEndsAt,
          trialEndsAt,
          autoRenew: true,
          payments: [
            {
              invoiceNumber: `INV-TRIAL-${Date.now().toString(36).toUpperCase()}`,
              amount: 0,
              currency: 'USD',
              billingCycle: 'MONTHLY',
              planCode: defaultPlan.code,
              planName: `${defaultPlan.name} (14-Day Free Trial)`,
              paymentMethod: 'PROMOTIONAL_TRIAL',
              transactionReference: `TRIAL_${companyId.toString().slice(-6)}_${Date.now()}`,
              paidAt: new Date(),
              status: 'SUCCEEDED',
            },
          ],
        });
        sub = await Subscription.findById(sub._id).populate('planId');
      }
    }

    if (!sub) {
      throw new Error('Could not retrieve or initialize subscription for this company.');
    }

    // Determine current start of month for shipments quota
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Compute live tenant resource metrics
    const [vehiclesCount, usersCount, shipmentsCount] = await Promise.all([
      Vehicle.countDocuments({ companyId, status: { $ne: 'DECOMMISSIONED' } }),
      User.countDocuments({ companyId, status: 'ACTIVE' }),
      Shipment.countDocuments({ companyId, createdAt: { $gte: startOfMonth } }),
    ]);

    const plan = sub.planId as unknown as IPlan;

    const endDate = new Date(sub.endDate);
    const msRemaining = endDate.getTime() - Date.now();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
    const isExpired = sub.status === 'EXPIRED' || (msRemaining <= 0 && sub.status !== 'ACTIVE');

    return {
      subscription: sub,
      plan: plan || null,
      usage: {
        vehiclesCount,
        usersCount,
        shipmentsCountThisMonth: shipmentsCount,
      },
      limits: {
        maxVehicles: plan?.maxVehicles ?? 5,
        maxUsers: plan?.maxUsers ?? 3,
        maxShipmentsPerMonth: plan?.maxShipmentsPerMonth ?? 50,
      },
      daysRemaining,
      isExpired,
      isTrial: sub.status === 'TRIAL',
    };
  }

  /**
   * Retrieve all available active plans for purchasing
   */
  static async getAvailablePlans(): Promise<IPlan[]> {
    await AdminService.seedDefaultPlans();
    return Plan.find({ isActive: true }).sort({ priceMonthly: 1 });
  }

  /**
   * Process a subscription purchase or plan upgrade
   */
  static async purchaseSubscription(
    companyId: mongoosePkg.Types.ObjectId,
    input: PurchaseSubscriptionInput,
    actor?: IUser
  ) {
    if (!mongoosePkg.Types.ObjectId.isValid(input.planId)) {
      throw new Error('Invalid plan selection ID.');
    }

    const plan = await Plan.findById(input.planId);
    if (!plan || !plan.isActive) {
      throw new Error('Selected subscription plan does not exist or is inactive.');
    }

    let sub = await Subscription.findOne({ companyId });

    const startDate = new Date();
    const endDate = new Date();
    const isYearly = input.billingCycle === 'YEARLY';

    if (isYearly) {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const price = isYearly ? plan.priceYearly : plan.priceMonthly;
    const invSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${invSuffix}`;

    const paymentRecord: ISubscriptionPayment = {
      invoiceNumber,
      amount: price,
      currency: plan.currency || 'USD',
      billingCycle: input.billingCycle,
      planCode: plan.code,
      planName: plan.name,
      paymentMethod: input.paymentMethod || 'CREDIT_CARD',
      transactionReference:
        input.paymentDetails?.transactionRef ||
        `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      paidAt: new Date(),
      status: 'SUCCEEDED',
    };

    if (!sub) {
      sub = new Subscription({
        companyId,
        planId: plan._id,
        planCode: plan.code,
        status: 'ACTIVE',
        billingCycle: input.billingCycle,
        startDate,
        endDate,
        autoRenew: true,
        payments: [paymentRecord],
      });
    } else {
      sub.planId = plan._id as any;
      sub.planCode = plan.code;
      sub.status = 'ACTIVE';
      sub.billingCycle = input.billingCycle;
      sub.startDate = startDate;
      sub.endDate = endDate;
      sub.autoRenew = true;
      if (!Array.isArray(sub.payments)) {
        sub.payments = [];
      }
      sub.payments.unshift(paymentRecord);
    }

    await sub.save();

    // Ensure company status is ACTIVE
    await Company.findByIdAndUpdate(companyId, { status: 'ACTIVE' });

    // Record system audit log
    await AuditLog.create({
      actorId: actor?._id,
      actorEmail: actor?.email || 'owner@fleetflow.io',
      actorRole: actor?.role || 'COMPANY_OWNER',
      action: 'SUBSCRIPTION_PURCHASED',
      targetType: 'Subscription',
      targetId: sub._id.toString(),
      details: {
        planCode: plan.code,
        planName: plan.name,
        billingCycle: input.billingCycle,
        amount: price,
        invoiceNumber,
      },
    });

    // Send in-app notification to company owner / team
    try {
      await Notification.create({
        companyId,
        userId: actor?._id,
        title: `Subscription Activated: ${plan.name}`,
        message: `Your workspace subscription has been upgraded to ${plan.name} (${input.billingCycle.toLowerCase()} cycle). Thank you for subscribing!`,
        type: 'SUCCESS',
        link: '/company/subscription',
      });
    } catch {
      // non-blocking
    }

    const populatedSub = await Subscription.findById(sub._id).populate('planId');

    return {
      subscription: populatedSub,
      receipt: paymentRecord,
      message: `Successfully subscribed to ${plan.name} (${input.billingCycle})`,
    };
  }

  /**
   * Toggle auto-renewal for current subscription
   */
  static async toggleAutoRenew(
    companyId: mongoosePkg.Types.ObjectId,
    autoRenew: boolean,
    actor?: IUser
  ) {
    const sub = await Subscription.findOne({ companyId });
    if (!sub) {
      throw new Error('Subscription not found.');
    }

    sub.autoRenew = autoRenew;
    await sub.save();

    await AuditLog.create({
      actorId: actor?._id,
      actorEmail: actor?.email || 'owner@fleetflow.io',
      actorRole: actor?.role || 'COMPANY_OWNER',
      action: 'SUBSCRIPTION_AUTORENEW_TOGGLED',
      targetType: 'Subscription',
      targetId: sub._id.toString(),
      details: { autoRenew },
    });

    return sub;
  }

  /**
   * Cancel auto-renew / cancel subscription
   */
  static async cancelSubscription(
    companyId: mongoosePkg.Types.ObjectId,
    reason?: string,
    actor?: IUser
  ) {
    const sub = await Subscription.findOne({ companyId });
    if (!sub) {
      throw new Error('Subscription not found.');
    }

    sub.autoRenew = false;
    if (reason) {
      sub.notes = (sub.notes ? sub.notes + '\n' : '') + `Cancellation reason (${new Date().toISOString()}): ${reason}`;
    }
    await sub.save();

    await AuditLog.create({
      actorId: actor?._id,
      actorEmail: actor?.email || 'owner@fleetflow.io',
      actorRole: actor?.role || 'COMPANY_OWNER',
      action: 'SUBSCRIPTION_CANCELLED',
      targetType: 'Subscription',
      targetId: sub._id.toString(),
      details: { reason },
    });

    return sub;
  }
}
