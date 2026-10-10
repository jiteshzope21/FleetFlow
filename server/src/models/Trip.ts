import mongoose, { Schema } from 'mongoose';

export const TRIP_STATUSES = [
  'DRAFT',
  'PLANNED',
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export const STOP_TYPES = ['PICKUP', 'DELIVERY', 'WAYPOINT', 'REST'] as const;
export type StopType = (typeof STOP_TYPES)[number];

export interface ITripStop {
  stopNumber: number;
  locationName: string;
  address?: string;
  city: string;
  type: StopType;
  plannedTime?: Date;
  actualTime?: Date;
  notes?: string;
}

export interface ITripCostBreakdown {
  fuelCost?: number;
  tollCost?: number;
  driverAllowance?: number;
  maintenanceCost?: number;
  otherCost?: number;
}

export interface ITrip {
  _id?: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  tripNumber: string;
  vehicleId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId;
  shipmentIds: mongoose.Types.ObjectId[];
  originCity: string;
  destinationCity: string;
  stops?: ITripStop[];
  status: TripStatus;
  plannedDepartureDate: Date;
  plannedArrivalDate: Date;
  actualDepartureDate?: Date;
  actualArrivalDate?: Date;
  startOdometer?: number;
  endOdometer?: number;
  estimatedDistanceKm: number;
  actualDistanceKm?: number;
  estimatedCost: number;
  actualCost?: number;
  costBreakdown?: ITripCostBreakdown;
  notes?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TripStopSubSchema = new Schema<ITripStop>(
  {
    stopNumber: { type: Number, required: true },
    locationName: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    type: { type: String, enum: STOP_TYPES, default: 'WAYPOINT' },
    plannedTime: { type: Date },
    actualTime: { type: Date },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const TripCostBreakdownSubSchema = new Schema<ITripCostBreakdown>(
  {
    fuelCost: { type: Number, default: 0, min: 0 },
    tollCost: { type: Number, default: 0, min: 0 },
    driverAllowance: { type: Number, default: 0, min: 0 },
    maintenanceCost: { type: Number, default: 0, min: 0 },
    otherCost: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const TripSchema = new Schema<ITrip>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    tripNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
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
      required: true,
      index: true,
    },
    shipmentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Shipment',
      },
    ],
    originCity: {
      type: String,
      required: true,
      trim: true,
    },
    destinationCity: {
      type: String,
      required: true,
      trim: true,
    },
    stops: [TripStopSubSchema],
    status: {
      type: String,
      enum: TRIP_STATUSES,
      default: 'PLANNED',
      index: true,
    },
    plannedDepartureDate: {
      type: Date,
      required: true,
    },
    plannedArrivalDate: {
      type: Date,
      required: true,
    },
    actualDepartureDate: {
      type: Date,
    },
    actualArrivalDate: {
      type: Date,
    },
    startOdometer: {
      type: Number,
      min: [0, 'Start odometer must be non-negative'],
    },
    endOdometer: {
      type: Number,
      min: [0, 'End odometer must be non-negative'],
    },
    estimatedDistanceKm: {
      type: Number,
      required: true,
      min: [1, 'Distance must be at least 1 km'],
    },
    actualDistanceKm: {
      type: Number,
      min: [0, 'Actual distance must be non-negative'],
    },
    estimatedCost: {
      type: Number,
      default: 0,
      min: [0, 'Estimated cost must be non-negative'],
    },
    actualCost: {
      type: Number,
      default: 0,
      min: [0, 'Actual cost must be non-negative'],
    },
    costBreakdown: {
      type: TripCostBreakdownSubSchema,
      default: () => ({}),
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
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

TripSchema.index({ companyId: 1, tripNumber: 1, isArchived: 1 }, { unique: true });
TripSchema.index({ companyId: 1, status: 1 });
TripSchema.index({ companyId: 1, vehicleId: 1 });
TripSchema.index({ companyId: 1, driverId: 1 });
TripSchema.index({ companyId: 1, plannedDepartureDate: 1 });

export const Trip = mongoose.model<ITrip>('Trip', TripSchema);
