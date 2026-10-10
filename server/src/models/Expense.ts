import mongoose, { Document, Schema } from 'mongoose';

export const EXPENSE_CATEGORIES = [
  'TOLLS',
  'PARKING',
  'PERMITS',
  'INSURANCE',
  'TAXES',
  'OFFICE_SUPPLIES',
  'UTILITIES',
  'SALARIES',
  'DRIVER_ALLOWANCE',
  'LODGING',
  'MISCELLANEOUS',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const PAYMENT_METHODS = [
  'CASH',
  'BANK_TRANSFER',
  'CARD',
  'UPI',
  'CHECK',
  'OTHER',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface IExpense extends Document {
  companyId: mongoose.Types.ObjectId;
  title: string;
  category: ExpenseCategory;
  expenseDate: Date;
  amount: number;
  currency: string;
  vehicleId?: mongoose.Types.ObjectId | null;
  driverId?: mongoose.Types.ObjectId | null;
  customerId?: mongoose.Types.ObjectId | null;
  vendor?: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: EXPENSE_CATEGORIES,
      default: 'MISCELLANEOUS',
      index: true,
    },
    expenseDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    vendor: {
      type: String,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'BANK_TRANSFER',
    },
    referenceNumber: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ExpenseSchema.index({ companyId: 1, category: 1, isArchived: 1 });
ExpenseSchema.index({ companyId: 1, expenseDate: -1 });

export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);
