import { z } from 'zod';
import { FUEL_TYPES } from '../../models/Vehicle.js';

export const createFuelLogSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  driverId: z.string().optional().nullable(),
  refuelingDate: z.string().default(() => new Date().toISOString()),
  fuelType: z.enum(FUEL_TYPES).default('DIESEL'),
  quantity: z.coerce.number().positive('Quantity must be greater than zero'),
  pricePerUnit: z.coerce.number().min(0).optional().nullable(),
  totalCost: z.coerce.number().min(0).optional().nullable(),
  odometer: z.coerce.number().min(0, 'Odometer cannot be negative'),
  fuelStation: z.string().max(100).trim().optional().nullable(),
  invoiceNumber: z.string().max(50).trim().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateFuelLogSchema = z.object({
  vehicleId: z.string().optional(),
  driverId: z.string().optional().nullable(),
  refuelingDate: z.string().optional(),
  fuelType: z.enum(FUEL_TYPES).optional(),
  quantity: z.coerce.number().positive().optional(),
  pricePerUnit: z.coerce.number().min(0).optional().nullable(),
  totalCost: z.coerce.number().min(0).optional(),
  odometer: z.coerce.number().min(0).optional(),
  fuelStation: z.string().max(100).trim().optional().nullable(),
  invoiceNumber: z.string().max(50).trim().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const fuelQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(parseInt(val, 10), 100) : 20)),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  fuelType: z.enum(FUEL_TYPES).optional(),
});

export type CreateFuelLogInput = z.infer<typeof createFuelLogSchema>;
export type UpdateFuelLogInput = z.infer<typeof updateFuelLogSchema>;
export type FuelQueryInput = z.infer<typeof fuelQuerySchema>;
