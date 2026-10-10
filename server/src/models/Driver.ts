import mongoose, { Document, Schema } from 'mongoose';

export const DRIVER_STATUSES = ['ACTIVE', 'INACTIVE', 'ON_LEAVE'] as const;
export type DriverStatus = (typeof DRIVER_STATUSES)[number];

export interface IDriver extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: Date;
  address?: string;
  dateOfJoining?: Date;
  status: DriverStatus;
  assignedVehicleId?: mongoose.Types.ObjectId | null;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relation?: string;
  };
  notes?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriver>(
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
    licenseNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    licenseCategory: {
      type: String,
      required: true,
      trim: true,
      default: 'HMV / Heavy Transport',
    },
    licenseExpiryDate: {
      type: Date,
      required: true,
    },
    address: {
      type: String,
      trim: true,
    },
    dateOfJoining: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: DRIVER_STATUSES,
      default: 'ACTIVE',
      index: true,
    },
    assignedVehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relation: { type: String, trim: true },
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

// Compound unique index per tenant for license numbers
DriverSchema.index(
  { companyId: 1, licenseNumber: 1, isArchived: 1 },
  { unique: true }
);

DriverSchema.index({ companyId: 1, status: 1, isArchived: 1 });

export const Driver = mongoose.model<IDriver>('Driver', DriverSchema);
