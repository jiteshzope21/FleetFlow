import { z } from 'zod';

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, 'Item description is required'),
  quantity: z.number().min(1).default(1),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  tripId: z.string().optional(),
  shipmentId: z.string().optional(),
  dueDate: z.string().datetime().or(z.string()),
  items: z.array(invoiceItemSchema).min(1, 'At least one invoice item is required'),
  taxRate: z.number().min(0).max(100).default(0),
  notes: z.string().trim().optional(),
});

export const recordPaymentSchema = z.object({
  amount: z.number().min(0.01, 'Payment amount must be greater than 0'),
  paymentDate: z.string().datetime().or(z.string()).optional(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'UPI', 'CREDIT_CARD', 'OTHER']).default('BANK_TRANSFER'),
  transactionReference: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const invoiceQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['DRAFT', 'ISSUED', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED']).optional(),
  customerId: z.string().optional(),
});
