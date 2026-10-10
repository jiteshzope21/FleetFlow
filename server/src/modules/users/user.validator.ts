import { z } from 'zod';
import { USER_ROLES } from '../../models/User.js';

// Roles that can be assigned to new company members by company owner/manager
const COMPANY_ASSIGNABLE_ROLES = [
  'MANAGER',
  'DISPATCHER',
  'ACCOUNTANT',
  'FLEET_MANAGER',
  'MAINTENANCE_MANAGER',
  'DRIVER',
  'VIEWER',
] as const;

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(COMPANY_ASSIGNABLE_ROLES, {
    errorMap: () => ({
      message: 'Role must be one of: MANAGER, DISPATCHER, ACCOUNTANT, FLEET_MANAGER, MAINTENANCE_MANAGER, DRIVER, VIEWER',
    }),
  }),
  phone: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(COMPANY_ASSIGNABLE_ROLES).optional(),
  phone: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const userQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(parseInt(val, 10), 100) : 20)),
  search: z.string().optional(),
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
