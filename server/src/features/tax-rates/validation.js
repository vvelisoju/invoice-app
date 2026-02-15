import { z } from 'zod'

const taxComponentSchema = z.object({
  name: z.string().min(1, 'Component name is required').max(30),
  rate: z.number().min(0).max(100)
})

export const createTaxRateSchema = z.object({
  name: z.string().min(1, 'Tax rate name is required').max(50),
  rate: z.number().min(0).max(100),
  isDefault: z.boolean().optional().default(false),
  components: z.array(taxComponentSchema).min(2, 'Tax group must have at least 2 components').optional().nullable()
})

export const updateTaxRateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  rate: z.number().min(0).max(100).optional(),
  isDefault: z.boolean().optional(),
  components: z.array(taxComponentSchema).min(2).optional().nullable()
})
