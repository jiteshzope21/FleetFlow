import mongoose, { Document, Schema } from 'mongoose';

export const CUSTOMER_TYPES = ['CORPORATE', 'INDIVIDUAL', 'FORWARDER', 'RETAIL'] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

export const CUSTOMER_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export interface ICustomer extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  customerType: CustomerType;
  contactPerson: string;
  phone: string;
  email?: string;
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  taxId?: string; // GSTIN / VAT / TIN
  paymentTerms?: string;
  status: CustomerStatus;
  notes?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    customerType: {
      type: String,
      enum: CUSTOMER_TYPES,
      default: 'CORPORATE',
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    billingAddress: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
    },
    shippingAddress: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
    },
    taxId: {
      type: String,
      trim: true,
      uppercase: true,
    },
    paymentTerms: {
      type: String,
      trim: true,
      default: 'NET 30',
    },
    status: {
      type: String,
      enum: CUSTOMER_STATUSES,
      default: 'ACTIVE',
      index: true,
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

CustomerSchema.index({ companyId: 1, name: 1, isArchived: 1 });
CustomerSchema.index({ companyId: 1, status: 1, isArchived: 1 });

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
