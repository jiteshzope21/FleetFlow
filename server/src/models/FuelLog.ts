import mongoose, { Document, Schema } from 'mongoose';
import { FUEL_TYPES, FuelType } from './Vehicle.js';

export interface IFuelLog extends Document {
  companyId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId | null;
  refuelingDate: Date;
  fuelType: FuelType;
  quantity: number; // in Liters
  pricePerUnit?: number; // price per Liter
  totalCost: number;
  odometer: number;
  fuelStation?: string;
  invoiceNumber?: string;
  notes?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FuelLogSchema = new Schema<IFuelLog>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    refuelingDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    fuelType: {
      type: String,
      enum: FUEL_TYPES,
      default: 'DIESEL',
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.1,
    },
    pricePerUnit: {
      type: Number,
      min: 0,
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    odometer: {
      type: Number,
      required: true,
      min: 0,
    },
    fuelStation: {
      type: String,
      trim: true,
    },
    invoiceNumber: {
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

FuelLogSchema.index({ companyId: 1, vehicleId: 1, isArchived: 1 });
FuelLogSchema.index({ companyId: 1, refuelingDate: -1 });

export const FuelLog = mongoose.model<IFuelLog>('FuelLog', FuelLogSchema);
