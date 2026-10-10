import { z } from 'zod';
import { CUSTOMER_TYPES, CUSTOMER_STATUSES } from '../../models/Customer.js';

const addressSchema = z
  .object({
    street: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    postalCode: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
  })
  .optional()
  .nullable();

export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Customer name must be at least 2 characters').max(150).trim(),
  customerType: z.enum(CUSTOMER_TYPES).default('CORPORATE'),
  contactPerson: z.string().min(2, 'Contact person is required').max(100).trim(),
  phone: z.string().min(7, 'Phone number must be at least 7 characters').max(20).trim(),
  email: z.string().email('Invalid email').toLowerCase().optional().nullable(),
  billingAddress: addressSchema,
  shippingAddress: addressSchema,
  taxId: z.string().max(50).trim().optional().nullable(),
  paymentTerms: z.string().max(50).trim().default('NET 30'),
  status: z.enum(CUSTOMER_STATUSES).default('ACTIVE'),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(2).max(150).trim().optional(),
  customerType: z.enum(CUSTOMER_TYPES).optional(),
  contactPerson: z.string().min(2).max(100).trim().optional(),
  phone: z.string().min(7).max(20).trim().optional(),
  email: z.string().email().toLowerCase().optional().nullable(),
  billingAddress: addressSchema,
  shippingAddress: addressSchema,
  taxId: z.string().max(50).trim().optional().nullable(),
  paymentTerms: z.string().max(50).trim().optional(),
  status: z.enum(CUSTOMER_STATUSES).optional(),
  notes: z.string().max(1000).optional().nullable(),
});

export const customerQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(parseInt(val, 10), 100) : 20)),
  search: z.string().optional(),
  status: z.enum(CUSTOMER_STATUSES).optional(),
  customerType: z.enum(CUSTOMER_TYPES).optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerQueryInput = z.infer<typeof customerQuerySchema>;
