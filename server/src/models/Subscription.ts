import mongoose, { Document, Schema } from 'mongoose';

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';
export type BillingCycle = 'MONTHLY' | 'YEARLY';

export interface ISubscriptionPayment {
  _id?: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  planCode: string;
  planName: string;
  paymentMethod: string;
  transactionReference: string;
  paidAt: Date;
  status: 'SUCCEEDED' | 'FAILED' | 'PENDING';
}

export interface ISubscription extends Document {
  companyId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  planCode: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startDate: Date;
  endDate: Date;
  trialEndsAt?: Date;
  autoRenew: boolean;
  notes?: string;
  payments: ISubscriptionPayment[];
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPaymentSchema = new Schema<ISubscriptionPayment>(
  {
    invoiceNumber: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true },
    billingCycle: { type: String, enum: ['MONTHLY', 'YEARLY'], default: 'MONTHLY' },
    planCode: { type: String, required: true },
    planName: { type: String, required: true },
    paymentMethod: { type: String, default: 'CREDIT_CARD' },
    transactionReference: { type: String, required: true },
    paidAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['SUCCEEDED', 'FAILED', 'PENDING'], default: 'SUCCEEDED' },
  },
  { _id: true }
);

const SubscriptionSchema = new Schema<ISubscription>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      unique: true,
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    planCode: {
      type: String,
      required: true,
      uppercase: true,
      default: 'STARTER',
    },
    status: {
      type: String,
      enum: ['TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'],
      default: 'TRIAL',
      index: true,
    },
    billingCycle: {
      type: String,
      enum: ['MONTHLY', 'YEARLY'],
      default: 'MONTHLY',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    trialEndsAt: {
      type: Date,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      default: '',
    },
    payments: {
      type: [SubscriptionPaymentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
