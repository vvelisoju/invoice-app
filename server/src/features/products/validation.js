import { z } from 'zod'

export const searchProductsSchema = z.object({
  search: z.string().min(1, 'Search query is required')
})

const taxComponentSchema = z.object({
  name: z.string().min(1),
  rate: z.number().min(0).max(100)
})

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  defaultRate: z.number().nonnegative().optional().or(z.string().transform(Number)).nullable(),
  unit: z.string().optional().nullable(),
  taxRate: z.number().nonnegative().optional().or(z.string().transform(Number)).nullable(),
  taxRateName: z.string().optional().nullable(),
  taxComponents: z.array(taxComponentSchema).optional().nullable(),
  hsnCode: z.string().optional().nullable()
})

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  defaultRate: z.number().nonnegative().optional().or(z.string().transform(Number)).nullable(),
  unit: z.string().optional().nullable(),
  taxRate: z.number().nonnegative().optional().or(z.string().transform(Number)).nullable(),
  taxRateName: z.string().optional().nullable(),
  taxComponents: z.array(taxComponentSchema).optional().nullable(),
  hsnCode: z.string().optional().nullable()
})
