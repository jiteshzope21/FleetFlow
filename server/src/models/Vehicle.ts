import mongoose, { Document, Schema } from 'mongoose';

export const VEHICLE_TYPES = ['TRUCK', 'TRAILER', 'VAN', 'TANKER', 'CONTAINER', 'OTHER'] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const FUEL_TYPES = ['DIESEL', 'PETROL', 'CNG', 'ELECTRIC', 'HYBRID', 'LNG'] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export const VEHICLE_STATUSES = ['ACTIVE', 'IN_MAINTENANCE', 'INACTIVE'] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export interface IVehicle {
  _id?: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  registrationNumber: string;
  type: VehicleType;
  make: string;
  model: string;
  year: number;
  fuelType: FuelType;
  currentOdometer: number;
  status: VehicleStatus;
  assignedDriverId?: mongoose.Types.ObjectId | null;
  purchaseDate?: Date;
  purchasePrice?: number;
  insuranceExpiryDate?: Date;
  registrationExpiryDate?: Date;
  pollutionExpiryDate?: Date;
  notes?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: VEHICLE_TYPES,
      default: 'TRUCK',
    },
    make: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
      min: 1980,
      max: new Date().getFullYear() + 2,
    },
    fuelType: {
      type: String,
      enum: FUEL_TYPES,
      default: 'DIESEL',
    },
    currentOdometer: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: VEHICLE_STATUSES,
      default: 'ACTIVE',
      index: true,
    },
    assignedDriverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    purchaseDate: {
      type: Date,
    },
    purchasePrice: {
      type: Number,
      min: 0,
    },
    insuranceExpiryDate: {
      type: Date,
    },
    registrationExpiryDate: {
      type: Date,
    },
    pollutionExpiryDate: {
      type: Date,
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

// Compound unique index per tenant for active vehicles
VehicleSchema.index(
  { companyId: 1, registrationNumber: 1, isArchived: 1 },
  { unique: true }
);

VehicleSchema.index({ companyId: 1, status: 1, isArchived: 1 });

export const Vehicle = mongoose.model<IVehicle>('Vehicle', VehicleSchema);
