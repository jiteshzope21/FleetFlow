import { z } from 'zod';
import { DRIVER_STATUSES } from '../../models/Driver.js';

export const createDriverSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  phone: z.string().min(7, 'Phone must be at least 7 characters').max(20).trim(),
  email: z.string().email('Invalid email').toLowerCase().optional().nullable(),
  licenseNumber: z
    .string()
    .min(3, 'License number must be at least 3 characters')
    .max(30)
    .trim(),
  licenseCategory: z.string().min(1, 'License category is required').max(50).trim().default('HMV'),
  licenseExpiryDate: z.string().min(1, 'License expiry date is required'),
  address: z.string().max(300).optional().nullable(),
  dateOfJoining: z.string().optional().nullable(),
  status: z.enum(DRIVER_STATUSES).default('ACTIVE'),
  assignedVehicleId: z.string().optional().nullable(),
  emergencyContact: z
    .object({
      name: z.string().optional().nullable(),
      phone: z.string().optional().nullable(),
      relation: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateDriverSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  phone: z.string().min(7).max(20).trim().optional(),
  email: z.string().email().toLowerCase().optional().nullable(),
  licenseNumber: z.string().min(3).max(30).trim().optional(),
  licenseCategory: z.string().min(1).max(50).trim().optional(),
  licenseExpiryDate: z.string().optional(),
  address: z.string().max(300).optional().nullable(),
  dateOfJoining: z.string().optional().nullable(),
  status: z.enum(DRIVER_STATUSES).optional(),
  assignedVehicleId: z.string().optional().nullable(),
  emergencyContact: z
    .object({
      name: z.string().optional().nullable(),
      phone: z.string().optional().nullable(),
      relation: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const driverQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(parseInt(val, 10), 100) : 20)),
  search: z.string().optional(),
  status: z.enum(DRIVER_STATUSES).optional(),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
export type DriverQueryInput = z.infer<typeof driverQuerySchema>;
