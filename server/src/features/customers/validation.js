import { z } from 'zod'

export const searchCustomersSchema = z.object({
  search: z.string().min(1, 'Search query is required')
})

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional().nullable(),
  email: z.string().email().optional().nullable(),
  gstin: z.string().length(15).optional().nullable(),
  stateCode: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  poNumber: z.string().max(50).optional().nullable()
})

export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional().nullable(),
  email: z.string().email().optional().nullable(),
  gstin: z.string().length(15).optional().nullable(),
  stateCode: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  poNumber: z.string().max(50).optional().nullable()
})
