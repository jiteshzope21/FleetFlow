import mongoose, { Document, Schema } from 'mongoose';

export interface IPlan extends Document {
  code: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxVehicles: number;
  maxUsers: number;
  maxShipmentsPerMonth: number;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    code: {
      type: String,
      required: [true, 'Plan code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    priceMonthly: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    priceYearly: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    maxVehicles: {
      type: Number,
      required: true,
      default: 5,
    },
    maxUsers: {
      type: Number,
      required: true,
      default: 3,
    },
    maxShipmentsPerMonth: {
      type: Number,
      required: true,
      default: 50,
    },
    features: {
      type: [String],
      default: [],
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Plan = mongoose.model<IPlan>('Plan', PlanSchema);
