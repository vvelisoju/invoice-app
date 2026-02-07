import { z } from 'zod'

export const createTaxRateSchema = z.object({
  name: z.string().min(1, 'Tax rate name is required').max(50),
  rate: z.number().min(0).max(100),
  isDefault: z.boolean().optional().default(false)
})

export const updateTaxRateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  rate: z.number().min(0).max(100).optional(),
  isDefault: z.boolean().optional()
})
