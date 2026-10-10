import mongoose, { Document, Schema } from 'mongoose';

export const MAINTENANCE_TYPES = [
  'ROUTINE_SERVICE',
  'REPAIR',
  'INSPECTION',
  'TIRE_REPLACEMENT',
  'OIL_CHANGE',
  'BRAKE_SERVICE',
  'ACCIDENT_REPAIR',
  'OTHER',
] as const;
export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number];

export const MAINTENANCE_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

export interface IMaintenance extends Document {
  companyId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  serviceType: MaintenanceType;
  description: string;
  serviceDate: Date;
  odometerAtService?: number;
  serviceProvider?: string;
  partsCost: number;
  laborCost: number;
  totalCost: number;
  nextServiceDate?: Date;
  nextServiceOdometer?: number;
  status: MaintenanceStatus;
  notes?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceSchema = new Schema<IMaintenance>(
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
    serviceType: {
      type: String,
      enum: MAINTENANCE_TYPES,
      default: 'ROUTINE_SERVICE',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    serviceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    odometerAtService: {
      type: Number,
      min: 0,
    },
    serviceProvider: {
      type: String,
      trim: true,
    },
    partsCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    laborCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    nextServiceDate: {
      type: Date,
    },
    nextServiceOdometer: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: MAINTENANCE_STATUSES,
      default: 'SCHEDULED',
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

MaintenanceSchema.index({ companyId: 1, vehicleId: 1, isArchived: 1 });
MaintenanceSchema.index({ companyId: 1, status: 1, isArchived: 1 });
MaintenanceSchema.index({ companyId: 1, serviceDate: -1 });

export const Maintenance = mongoose.model<IMaintenance>('Maintenance', MaintenanceSchema);
