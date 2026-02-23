import { z } from 'zod'

// Helper: treat empty strings as null
const emptyToNull = (val) => (val === '' ? null : val)

export const updateBusinessSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.preprocess(emptyToNull, z.string().max(20).optional().nullable()),
  email: z.preprocess(emptyToNull, z.string().email().optional().nullable()),
  website: z.preprocess(emptyToNull, z.string().max(500).optional().nullable()),
  address: z.preprocess(emptyToNull, z.string().max(500).optional().nullable()),
  logoUrl: z.preprocess(emptyToNull, z.string().max(2000).optional().nullable()),

  // GST — lenient save; strict format enforced at invoice issuance
  gstEnabled: z.boolean().optional(),
  gstin: z.preprocess(emptyToNull, z.string().max(15).optional().nullable()),
  stateCode: z.preprocess(emptyToNull, z.string().max(2).optional().nullable()),
  defaultTaxRate: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? null : Number(val),
    z.number().min(0).max(100).optional().nullable()
  ),

  // Bank — lenient save; no strict regex on settings
  bankName: z.preprocess(emptyToNull, z.string().max(100).optional().nullable()),
  accountNumber: z.preprocess(emptyToNull, z.string().max(20).optional().nullable()),
  ifscCode: z.preprocess(emptyToNull, z.string().max(11).optional().nullable()),
  upiId: z.preprocess(emptyToNull, z.string().max(100).optional().nullable()),

  // Signature
  signatureUrl: z.preprocess(emptyToNull, z.string().max(2000).optional().nullable()),
  signatureName: z.preprocess(emptyToNull, z.string().max(100).optional().nullable()),

  // Invoice workflow
  enableStatusWorkflow: z.boolean().optional(),
  enablePoNumber: z.boolean().optional(),
  
  // Invoice defaults
  invoicePrefix: z.preprocess(
    (val) => (val === null || val === undefined) ? undefined : val,
    z.string().max(10).optional()
  ),
  nextInvoiceNumber: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? undefined : Number(val),
    z.number().int().positive().optional()
  ),
  defaultNotes: z.preprocess(emptyToNull, z.string().max(1000).optional().nullable()),
  defaultTerms: z.preprocess(emptyToNull, z.string().max(1000).optional().nullable()),
  enabledInvoiceTypes: z.preprocess(
    (val) => (val === null || val === undefined) ? undefined : val,
    z.array(z.string()).min(1, 'At least one document type must be selected').optional()
  ),
  documentTypeConfig: z.preprocess(
    (val) => (val === null || val === undefined) ? undefined : val,
    z.record(z.string(), z.object({
      labels: z.record(z.string(), z.string()).optional(),
      fields: z.record(z.string(), z.any()).optional()
    })).optional()
  ),
  defaultDocType: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? undefined : String(val),
    z.string().max(50).optional()
  )
}).strip()

// Section-specific schemas for split API endpoints
export const updateBusinessInfoSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.preprocess(emptyToNull, z.string().max(20).optional().nullable()),
  email: z.preprocess(emptyToNull, z.string().email().optional().nullable()),
  website: z.preprocess(emptyToNull, z.string().max(500).optional().nullable()),
  address: z.preprocess(emptyToNull, z.string().max(500).optional().nullable()),
  logoUrl: z.preprocess(emptyToNull, z.string().max(2000).optional().nullable()),
}).strip()

export const updateGstSettingsSchema = z.object({
  gstEnabled: z.boolean().optional(),
  gstin: z.preprocess(emptyToNull, z.string().max(15).optional().nullable()),
  stateCode: z.preprocess(emptyToNull, z.string().max(2).optional().nullable()),
  defaultTaxRate: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? null : Number(val),
    z.number().min(0).max(100).optional().nullable()
  ),
}).strip()

export const updateBankSettingsSchema = z.object({
  bankName: z.preprocess(emptyToNull, z.string().max(100).optional().nullable()),
  accountNumber: z.preprocess(emptyToNull, z.string().max(20).optional().nullable()),
  ifscCode: z.preprocess(emptyToNull, z.string().max(11).optional().nullable()),
  upiId: z.preprocess(emptyToNull, z.string().max(100).optional().nullable()),
  signatureUrl: z.preprocess(emptyToNull, z.string().max(2000).optional().nullable()),
  signatureName: z.preprocess(emptyToNull, z.string().max(100).optional().nullable()),
}).strip()

export const updateInvoiceSettingsSchema = z.object({
  enableStatusWorkflow: z.boolean().optional(),
  enablePoNumber: z.boolean().optional(),
  invoicePrefix: z.preprocess(
    (val) => (val === null || val === undefined) ? undefined : val,
    z.string().max(10).optional()
  ),
  nextInvoiceNumber: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? undefined : Number(val),
    z.number().int().positive().optional()
  ),
  defaultNotes: z.preprocess(emptyToNull, z.string().max(1000).optional().nullable()),
  defaultTerms: z.preprocess(emptyToNull, z.string().max(1000).optional().nullable()),
  enabledInvoiceTypes: z.preprocess(
    (val) => (val === null || val === undefined) ? undefined : val,
    z.array(z.string()).min(1, 'At least one document type must be selected').optional()
  ),
  documentTypeConfig: z.preprocess(
    (val) => (val === null || val === undefined) ? undefined : val,
    z.record(z.string(), z.object({
      labels: z.record(z.string(), z.string()).optional(),
      fields: z.record(z.string(), z.any()).optional(),
      prefix: z.string().max(10).optional(),
      nextNumber: z.number().int().positive().optional(),
    })).optional()
  ),
  defaultDocType: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? undefined : String(val),
    z.string().max(50).optional()
  )
}).strip()
