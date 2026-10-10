import { z } from 'zod';
import { MAINTENANCE_TYPES, MAINTENANCE_STATUSES } from '../../models/Maintenance.js';

export const createMaintenanceSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  serviceType: z.enum(MAINTENANCE_TYPES).default('ROUTINE_SERVICE'),
  description: z.string().min(2, 'Description is required').max(500).trim(),
  serviceDate: z.string().default(() => new Date().toISOString()),
  odometerAtService: z.coerce.number().min(0).optional().nullable(),
  serviceProvider: z.string().max(100).trim().optional().nullable(),
  partsCost: z.coerce.number().min(0).default(0),
  laborCost: z.coerce.number().min(0).default(0),
  totalCost: z.coerce.number().min(0).optional().nullable(),
  nextServiceDate: z.string().optional().nullable(),
  nextServiceOdometer: z.coerce.number().min(0).optional().nullable(),
  status: z.enum(MAINTENANCE_STATUSES).default('SCHEDULED'),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateMaintenanceSchema = z.object({
  vehicleId: z.string().optional(),
  serviceType: z.enum(MAINTENANCE_TYPES).optional(),
  description: z.string().min(2).max(500).trim().optional(),
  serviceDate: z.string().optional(),
  odometerAtService: z.coerce.number().min(0).optional().nullable(),
  serviceProvider: z.string().max(100).trim().optional().nullable(),
  partsCost: z.coerce.number().min(0).optional(),
  laborCost: z.coerce.number().min(0).optional(),
  totalCost: z.coerce.number().min(0).optional(),
  nextServiceDate: z.string().optional().nullable(),
  nextServiceOdometer: z.coerce.number().min(0).optional().nullable(),
  status: z.enum(MAINTENANCE_STATUSES).optional(),
  notes: z.string().max(1000).optional().nullable(),
});

export const maintenanceQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(parseInt(val, 10), 100) : 20)),
  vehicleId: z.string().optional(),
  status: z.enum(MAINTENANCE_STATUSES).optional(),
  serviceType: z.enum(MAINTENANCE_TYPES).optional(),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
export type MaintenanceQueryInput = z.infer<typeof maintenanceQuerySchema>;
