import { z } from 'zod';
import { VEHICLE_TYPES, FUEL_TYPES, VEHICLE_STATUSES } from '../../models/Vehicle.js';

export const createVehicleSchema = z.object({
  registrationNumber: z
    .string()
    .min(2, 'Registration number must be at least 2 characters')
    .max(20, 'Registration number cannot exceed 20 characters')
    .trim(),
  type: z.enum(VEHICLE_TYPES).default('TRUCK'),
  make: z.string().min(1, 'Make is required').max(50).trim(),
  model: z.string().min(1, 'Model is required').max(50).trim(),
  year: z.coerce
    .number()
    .int()
    .min(1980, 'Year must be 1980 or later')
    .max(new Date().getFullYear() + 2, 'Year cannot be in the distant future'),
  fuelType: z.enum(FUEL_TYPES).default('DIESEL'),
  currentOdometer: z.coerce.number().min(0, 'Odometer reading cannot be negative').default(0),
  status: z.enum(VEHICLE_STATUSES).default('ACTIVE'),
  assignedDriverId: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  purchasePrice: z.coerce.number().min(0).optional().nullable(),
  insuranceExpiryDate: z.string().optional().nullable(),
  registrationExpiryDate: z.string().optional().nullable(),
  pollutionExpiryDate: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateVehicleSchema = z.object({
  registrationNumber: z.string().min(2).max(20).trim().optional(),
  type: z.enum(VEHICLE_TYPES).optional(),
  make: z.string().min(1).max(50).trim().optional(),
  model: z.string().min(1).max(50).trim().optional(),
  year: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 2).optional(),
  fuelType: z.enum(FUEL_TYPES).optional(),
  currentOdometer: z.coerce.number().min(0).optional(),
  status: z.enum(VEHICLE_STATUSES).optional(),
  assignedDriverId: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  purchasePrice: z.coerce.number().min(0).optional().nullable(),
  insuranceExpiryDate: z.string().optional().nullable(),
  registrationExpiryDate: z.string().optional().nullable(),
  pollutionExpiryDate: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const vehicleQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(parseInt(val, 10), 100) : 20)),
  search: z.string().optional(),
  status: z.enum(VEHICLE_STATUSES).optional(),
  type: z.enum(VEHICLE_TYPES).optional(),
  fuelType: z.enum(FUEL_TYPES).optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleQueryInput = z.infer<typeof vehicleQuerySchema>;
