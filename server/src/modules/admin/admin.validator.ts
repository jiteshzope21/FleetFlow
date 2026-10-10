import { z } from 'zod';

export const updateCompanyStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'TRIAL', 'SUSPENDED']),
  reason: z.string().trim().max(500).optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
  reason: z.string().trim().max(500).optional(),
});

export const createPlanSchema = z.object({
  code: z.string().trim().min(2).max(30).toUpperCase(),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().default(''),
  priceMonthly: z.number().min(0).default(0),
  priceYearly: z.number().min(0).default(0),
  currency: z.string().trim().default('USD'),
  maxVehicles: z.number().min(1).default(5),
  maxUsers: z.number().min(1).default(3),
  maxShipmentsPerMonth: z.number().min(1).default(50),
  features: z.array(z.string()).default([]),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const updatePlanSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().optional(),
  priceMonthly: z.number().min(0).optional(),
  priceYearly: z.number().min(0).optional(),
  maxVehicles: z.number().min(1).optional(),
  maxUsers: z.number().min(1).optional(),
  maxShipmentsPerMonth: z.number().min(1).optional(),
  features: z.array(z.string()).optional(),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const updateSubscriptionSchema = z.object({
  status: z.enum(['TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED']).optional(),
  planId: z.string().optional(),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']).optional(),
  endDate: z.string().datetime().or(z.string()).optional(),
  notes: z.string().trim().optional(),
});

export const createTicketReplySchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty'),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(2).max(150),
  content: z.string().trim().min(5),
  priority: z.enum(['NORMAL', 'HIGH', 'CRITICAL']).default('NORMAL'),
  targetAudience: z.enum(['ALL', 'OWNERS', 'DISPATCHERS']).default('ALL'),
  isPublished: z.boolean().default(true),
  expiresAt: z.string().datetime().or(z.string()).optional(),
});

export const updateAnnouncementSchema = z.object({
  title: z.string().trim().min(2).max(150).optional(),
  content: z.string().trim().min(5).optional(),
  priority: z.enum(['NORMAL', 'HIGH', 'CRITICAL']).optional(),
  targetAudience: z.enum(['ALL', 'OWNERS', 'DISPATCHERS']).optional(),
  isPublished: z.boolean().optional(),
});

export const updateSettingsSchema = z.object({
  settings: z.record(z.any()),
});

export const bootstrapAdminSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().trim().min(2),
  setupSecret: z.string().optional(),
});
