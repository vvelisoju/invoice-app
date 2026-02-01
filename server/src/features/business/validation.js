import { z } from 'zod'

export const updateBusinessSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number').optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),

  // GST
  gstEnabled: z.boolean().optional(),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format').optional().nullable(),
  stateCode: z.string().length(2).optional().nullable(),
  defaultTaxRate: z.number().min(0).max(100).optional().nullable(),

  // Bank
  bankName: z.string().max(100).optional().nullable(),
  accountNumber: z.string().max(20).optional().nullable(),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code').optional().nullable(),
  upiId: z.string().max(100).optional().nullable(),

  // Signature
  signatureUrl: z.string().url().optional().nullable(),
  signatureName: z.string().max(100).optional().nullable(),

  // Invoice defaults
  invoicePrefix: z.string().max(10).optional(),
  nextInvoiceNumber: z.number().int().positive().optional(),
  defaultNotes: z.string().max(1000).optional().nullable(),
  defaultTerms: z.string().max(1000).optional().nullable()
})
