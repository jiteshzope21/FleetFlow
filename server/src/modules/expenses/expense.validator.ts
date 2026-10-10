import { z } from 'zod';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../models/Expense.js';

export const createExpenseSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(150).trim(),
  category: z.enum(EXPENSE_CATEGORIES).default('MISCELLANEOUS'),
  expenseDate: z.string().default(() => new Date().toISOString()),
  amount: z.coerce.number().min(0, 'Amount must be non-negative'),
  currency: z.string().max(10).trim().default('INR'),
  vehicleId: z.string().optional().nullable(),
  driverId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  vendor: z.string().max(100).trim().optional().nullable(),
  paymentMethod: z.enum(PAYMENT_METHODS).default('BANK_TRANSFER'),
  referenceNumber: z.string().max(100).trim().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateExpenseSchema = z.object({
  title: z.string().min(2).max(150).trim().optional(),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  expenseDate: z.string().optional(),
  amount: z.coerce.number().min(0).optional(),
  currency: z.string().max(10).trim().optional(),
  vehicleId: z.string().optional().nullable(),
  driverId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  vendor: z.string().max(100).trim().optional().nullable(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  referenceNumber: z.string().max(100).trim().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const expenseQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(parseInt(val, 10), 100) : 20)),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  customerId: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseQueryInput = z.infer<typeof expenseQuerySchema>;
