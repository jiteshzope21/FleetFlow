import { z } from 'zod';

export const purchaseSubscriptionSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'SIMULATED_GATEWAY']).default('CREDIT_CARD'),
  paymentDetails: z
    .object({
      cardholderName: z.string().optional(),
      cardNumberLast4: z.string().optional(),
      cardBrand: z.string().optional(),
      transactionRef: z.string().optional(),
    })
    .optional(),
});

export const toggleAutoRenewSchema = z.object({
  autoRenew: z.boolean(),
});

export const cancelSubscriptionSchema = z.object({
  reason: z.string().optional(),
});

export type PurchaseSubscriptionInput = z.infer<typeof purchaseSubscriptionSchema>;
export type ToggleAutoRenewInput = z.infer<typeof toggleAutoRenewSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
