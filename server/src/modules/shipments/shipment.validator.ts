import { z } from 'zod';
import { CARGO_CATEGORIES, SHIPMENT_PRIORITIES, SHIPMENT_STATUSES } from '../../models/Shipment.js';

const LocationSchema = z.object({
  address: z.string().min(2, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
});

export const CreateShipmentSchema = z.object({
  shipmentNumber: z.string().min(3).max(30).optional(),
  customerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid customer ID'),
  origin: LocationSchema,
  destination: LocationSchema,
  cargoDescription: z.string().min(2, 'Cargo description is required'),
  cargoCategory: z.enum(CARGO_CATEGORIES).default('GENERAL'),
  weightKg: z.number().positive('Weight must be greater than 0'),
  volumeCbm: z.number().nonnegative().optional().nullable(),
  priority: z.enum(SHIPMENT_PRIORITIES).default('STANDARD'),
  estimatedCost: z.number().nonnegative().default(0),
  agreedPrice: z.number().nonnegative('Agreed price must be non-negative'),
  assignedVehicleId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid vehicle ID').optional().nullable(),
  assignedDriverId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid driver ID').optional().nullable(),
  pickupDate: z.string().datetime().optional().nullable(),
  deliveryDate: z.string().datetime().optional().nullable(),
  specialInstructions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const UpdateShipmentSchema = CreateShipmentSchema.partial().extend({
  status: z.enum(SHIPMENT_STATUSES).optional(),
});

export const ConfirmDeliverySchema = z.object({
  recipientName: z.string().min(2, 'Recipient name is required'),
  recipientPhone: z.string().optional().nullable(),
  deliveredAt: z.string().datetime().optional(),
  notes: z.string().optional().nullable(),
  podNumber: z.string().optional().nullable(),
});

export const QueryShipmentSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
  status: z.enum(SHIPMENT_STATUSES).optional(),
  customerId: z.string().optional(),
  priority: z.enum(SHIPMENT_PRIORITIES).optional(),
});

export type CreateShipmentInput = z.infer<typeof CreateShipmentSchema>;
export type UpdateShipmentInput = z.infer<typeof UpdateShipmentSchema>;
export type ConfirmDeliveryInput = z.infer<typeof ConfirmDeliverySchema>;
export type QueryShipmentInput = z.infer<typeof QueryShipmentSchema>;
