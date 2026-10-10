import mongoose, { Schema } from 'mongoose';

export const CARGO_CATEGORIES = [
  'GENERAL',
  'FRAGILE',
  'PERISHABLE',
  'HAZARDOUS',
  'LIQUID',
  'HEAVY_MACHINERY',
  'PARCEL',
  'OTHER',
] as const;
export type CargoCategory = (typeof CARGO_CATEGORIES)[number];

export const SHIPMENT_PRIORITIES = ['STANDARD', 'HIGH', 'URGENT'] as const;
export type ShipmentPriority = (typeof SHIPMENT_PRIORITIES)[number];

export const SHIPMENT_STATUSES = [
  'PENDING',
  'ASSIGNED',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
  'CANCELLED',
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export interface IShipmentLocation {
  address: string;
  city: string;
  state?: string;
  pincode?: string;
  contactName?: string;
  contactPhone?: string;
}

export interface IDeliveryConfirmation {
  deliveredAt: Date;
  recipientName: string;
  recipientPhone?: string;
  notes?: string;
  podNumber?: string;
}

export interface IShipment {
  _id?: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  shipmentNumber: string;
  customerId: mongoose.Types.ObjectId;
  origin: IShipmentLocation;
  destination: IShipmentLocation;
  cargoDescription: string;
  cargoCategory: CargoCategory;
  weightKg: number;
  volumeCbm?: number;
  priority: ShipmentPriority;
  status: ShipmentStatus;
  estimatedCost: number;
  agreedPrice: number;
  assignedVehicleId?: mongoose.Types.ObjectId | null;
  assignedDriverId?: mongoose.Types.ObjectId | null;
  tripId?: mongoose.Types.ObjectId | null;
  pickupDate?: Date;
  deliveryDate?: Date;
  deliveryConfirmation?: IDeliveryConfirmation | null;
  specialInstructions?: string;
  notes?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSubSchema = new Schema<IShipmentLocation>(
  {
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    contactName: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
  },
  { _id: false }
);

const DeliveryConfirmationSubSchema = new Schema<IDeliveryConfirmation>(
  {
    deliveredAt: { type: Date, required: true },
    recipientName: { type: String, required: true, trim: true },
    recipientPhone: { type: String, trim: true },
    notes: { type: String, trim: true },
    podNumber: { type: String, trim: true, uppercase: true },
  },
  { _id: false }
);

const ShipmentSchema = new Schema<IShipment>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    shipmentNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    origin: {
      type: LocationSubSchema,
      required: true,
    },
    destination: {
      type: LocationSubSchema,
      required: true,
    },
    cargoDescription: {
      type: String,
      required: true,
      trim: true,
    },
    cargoCategory: {
      type: String,
      enum: CARGO_CATEGORIES,
      default: 'GENERAL',
    },
    weightKg: {
      type: Number,
      required: true,
      min: [0, 'Weight must be non-negative'],
    },
    volumeCbm: {
      type: Number,
      min: [0, 'Volume must be non-negative'],
    },
    priority: {
      type: String,
      enum: SHIPMENT_PRIORITIES,
      default: 'STANDARD',
    },
    status: {
      type: String,
      enum: SHIPMENT_STATUSES,
      default: 'PENDING',
      index: true,
    },
    estimatedCost: {
      type: Number,
      default: 0,
      min: [0, 'Cost must be non-negative'],
    },
    agreedPrice: {
      type: Number,
      required: true,
      min: [0, 'Agreed price must be non-negative'],
    },
    assignedVehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    assignedDriverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      default: null,
      index: true,
    },
    pickupDate: {
      type: Date,
    },
    deliveryDate: {
      type: Date,
    },
    deliveryConfirmation: {
      type: DeliveryConfirmationSubSchema,
      default: null,
    },
    specialInstructions: {
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
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Compound Unique Index: Prevent duplicate shipmentNumber per company for active/non-archived
ShipmentSchema.index({ companyId: 1, shipmentNumber: 1, isArchived: 1 }, { unique: true });
ShipmentSchema.index({ companyId: 1, status: 1 });
ShipmentSchema.index({ companyId: 1, customerId: 1 });
ShipmentSchema.index({ companyId: 1, createdAt: -1 });

export const Shipment = mongoose.model<IShipment>('Shipment', ShipmentSchema);
