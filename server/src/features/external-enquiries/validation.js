import { z } from 'zod'

// Public submission schema (from external websites)
// All fields optional — validation is handled by the UI; backend accepts anything
export const createEnquirySchema = z.object({
  source: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  interestedIn: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  formType: z.string().optional().nullable(),
  extraData: z.record(z.any()).optional().nullable(),
})

// Admin update schema
export const updateEnquirySchema = z.object({
  status: z.enum(['new', 'contacted', 'converted', 'closed']).optional(),
  notes: z.string().optional().nullable(),
})

// Admin list query schema
export const listEnquiriesSchema = z.object({
  source: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['createdAt', 'name', 'source', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})
