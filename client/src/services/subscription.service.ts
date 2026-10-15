import { api } from '../lib/api.js';
import {
  ApiResponse,
  ISubscriptionDetailsResponse,
  ISubscriptionPlan,
  ICompanySubscription,
  ISubscriptionPayment,
} from '../types/index.js';

export interface PurchaseSubscriptionPayload {
  planId: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'SIMULATED_GATEWAY';
  paymentDetails?: {
    cardholderName?: string;
    cardNumberLast4?: string;
    cardBrand?: string;
    transactionRef?: string;
  };
}

export const subscriptionService = {
  getCurrent: async (): Promise<ISubscriptionDetailsResponse> => {
    const res = await api.get<ApiResponse<ISubscriptionDetailsResponse>>('/subscriptions/current');
    return res.data.data;
  },

  getPlans: async (): Promise<ISubscriptionPlan[]> => {
    const res = await api.get<ApiResponse<ISubscriptionPlan[]>>('/subscriptions/plans');
    return res.data.data;
  },

  purchase: async (
    payload: PurchaseSubscriptionPayload
  ): Promise<{ subscription: ICompanySubscription; receipt: ISubscriptionPayment; message: string }> => {
    const res = await api.post<
      ApiResponse<{ subscription: ICompanySubscription; receipt: ISubscriptionPayment; message: string }>
    >('/subscriptions/purchase', payload);
    return res.data.data;
  },

  toggleAutoRenew: async (autoRenew: boolean): Promise<ICompanySubscription> => {
    const res = await api.patch<ApiResponse<ICompanySubscription>>('/subscriptions/auto-renew', {
      autoRenew,
    });
    return res.data.data;
  },

  cancel: async (reason?: string): Promise<ICompanySubscription> => {
    const res = await api.post<ApiResponse<ICompanySubscription>>('/subscriptions/cancel', {
      reason,
    });
    return res.data.data;
  },
};
