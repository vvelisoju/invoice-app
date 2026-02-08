import { z } from 'zod'

const lineItemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Item name is required'),
  quantity: z.number().positive('Quantity must be positive').or(z.string().transform(Number)),
  rate: z.number().nonnegative('Rate must be non-negative').or(z.string().transform(Number)),
  productServiceId: z.string().uuid().optional().nullable()
})

export const createInvoiceSchema = z.object({
  id: z.string().uuid().optional(),
  customerId: z.string().uuid().optional().nullable(),
  invoiceNumber: z.string().optional(),
  date: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  discountTotal: z.number().nonnegative().optional().or(z.string().transform(Number)).default(0),
  taxRate: z.number().nonnegative().max(100).optional().or(z.string().transform(Number)).nullable(),
  customerStateCode: z.string().optional().nullable(),
  fromAddress: z.string().optional().nullable(),
  billTo: z.string().optional().nullable(),
  shipTo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable()
})

export const updateInvoiceSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  date: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  lineItems: z.array(lineItemSchema).optional(),
  discountTotal: z.number().nonnegative().optional().or(z.string().transform(Number)),
  taxRate: z.number().nonnegative().max(100).optional().or(z.string().transform(Number)).nullable(),
  customerStateCode: z.string().optional().nullable(),
  fromAddress: z.string().optional().nullable(),
  billTo: z.string().optional().nullable(),
  shipTo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable()
})

export const issueInvoiceSchema = z.object({
  templateBaseId: z.string().uuid().optional().nullable(),
  templateConfigSnapshot: z.any().optional().nullable(),
  templateVersion: z.number().int().positive().optional().nullable()
})

export const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'ISSUED', 'PAID', 'CANCELLED', 'VOID'])
})

export const listInvoicesSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'ISSUED', 'PAID', 'CANCELLED', 'VOID']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional()
})
