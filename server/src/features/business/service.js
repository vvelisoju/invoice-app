import { prisma } from '../../common/prisma.js'
import { NotFoundError, ValidationError } from '../../common/errors.js'

export async function getBusinessProfile(businessId) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      stateCode: true,
      gstEnabled: true,
      gstin: true,
      logoUrl: true,
      phone: true,
      email: true,
      website: true,
      address: true,
      bankName: true,
      accountNumber: true,
      ifscCode: true,
      upiId: true,
      signatureUrl: true,
      signatureName: true,
      invoicePrefix: true,
      nextInvoiceNumber: true,
      defaultNotes: true,
      defaultTerms: true,
      defaultTaxRate: true,
      enableStatusWorkflow: true,
      enablePoNumber: true,
      enabledInvoiceTypes: true,
      documentTypeConfig: true,
      defaultDocType: true,
      planId: true,
      createdAt: true,
      updatedAt: true
    }
  })

  if (!business) {
    throw new NotFoundError('Business not found')
  }

  return business
}

// Shared select for all business queries
const BUSINESS_SELECT = {
  id: true,
  name: true,
  stateCode: true,
  gstEnabled: true,
  gstin: true,
  logoUrl: true,
  phone: true,
  email: true,
  website: true,
  address: true,
  bankName: true,
  accountNumber: true,
  ifscCode: true,
  upiId: true,
  signatureUrl: true,
  signatureName: true,
  invoicePrefix: true,
  nextInvoiceNumber: true,
  defaultNotes: true,
  defaultTerms: true,
  defaultTaxRate: true,
  enableStatusWorkflow: true,
  enablePoNumber: true,
  enabledInvoiceTypes: true,
  documentTypeConfig: true,
  defaultDocType: true,
  planId: true,
  createdAt: true,
  updatedAt: true
}

async function ensureBusiness(businessId) {
  const business = await prisma.business.findUnique({ where: { id: businessId } })
  if (!business) throw new NotFoundError('Business not found')
  return business
}

// ============================================================================
// Section-specific update functions
// ============================================================================

/**
 * Update business info (name, phone, email, website, address, logoUrl)
 */
export async function updateBusinessInfo(businessId, data) {
  await ensureBusiness(businessId)
  const updateData = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.phone !== undefined) updateData.phone = data.phone
  if (data.email !== undefined) updateData.email = data.email
  if (data.address !== undefined) updateData.address = data.address
  if (data.website !== undefined) updateData.website = data.website
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl
  return prisma.business.update({ where: { id: businessId }, data: updateData, select: BUSINESS_SELECT })
}

/**
 * Update GST settings (gstEnabled, gstin, stateCode, defaultTaxRate)
 */
export async function updateGstSettings(businessId, data) {
  await ensureBusiness(businessId)
  const updateData = {}
  if (data.gstEnabled !== undefined) updateData.gstEnabled = data.gstEnabled
  if (data.gstin !== undefined) updateData.gstin = data.gstin
  if (data.stateCode !== undefined) updateData.stateCode = data.stateCode
  if (data.defaultTaxRate !== undefined) updateData.defaultTaxRate = data.defaultTaxRate
  return prisma.business.update({ where: { id: businessId }, data: updateData, select: BUSINESS_SELECT })
}

/**
 * Update bank & payment details
 */
export async function updateBankSettings(businessId, data) {
  await ensureBusiness(businessId)
  const updateData = {}
  if (data.bankName !== undefined) updateData.bankName = data.bankName
  if (data.accountNumber !== undefined) updateData.accountNumber = data.accountNumber
  if (data.ifscCode !== undefined) updateData.ifscCode = data.ifscCode
  if (data.upiId !== undefined) updateData.upiId = data.upiId
  if (data.signatureUrl !== undefined) updateData.signatureUrl = data.signatureUrl
  if (data.signatureName !== undefined) updateData.signatureName = data.signatureName
  return prisma.business.update({ where: { id: businessId }, data: updateData, select: BUSINESS_SELECT })
}

/**
 * Update invoice settings (prefix, next number, notes, terms, workflow, types, doc config)
 */
export async function updateInvoiceSettings(businessId, data) {
  await ensureBusiness(businessId)
  const updateData = {}

  // invoicePrefix: allow empty string (NOT nullable in DB, but empty string is valid)
  if (data.invoicePrefix !== undefined) updateData.invoicePrefix = data.invoicePrefix ?? ''
  if (data.defaultNotes !== undefined) updateData.defaultNotes = data.defaultNotes
  if (data.defaultTerms !== undefined) updateData.defaultTerms = data.defaultTerms
  if (data.enableStatusWorkflow !== undefined) updateData.enableStatusWorkflow = data.enableStatusWorkflow
  if (data.enablePoNumber !== undefined) updateData.enablePoNumber = data.enablePoNumber
  if (data.enabledInvoiceTypes !== undefined) updateData.enabledInvoiceTypes = data.enabledInvoiceTypes
  if (data.documentTypeConfig !== undefined) updateData.documentTypeConfig = data.documentTypeConfig
  if (data.defaultDocType !== undefined) updateData.defaultDocType = data.defaultDocType || 'invoice'

  // Next invoice number (with user-friendly validation)
  if (data.nextInvoiceNumber !== undefined) {
    const highestInvoice = await prisma.invoice.findFirst({
      where: { businessId, status: { not: 'DRAFT' } },
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true }
    })

    if (highestInvoice) {
      const currentNumber = parseInt(highestInvoice.invoiceNumber.replace(/\D/g, ''), 10) || 0
      if (data.nextInvoiceNumber <= currentNumber) {
        throw new ValidationError(
          `Next invoice number must be greater than ${currentNumber}. You have already issued invoices up to #${currentNumber}.`
        )
      }
    }

    updateData.nextInvoiceNumber = data.nextInvoiceNumber
  }

  return prisma.business.update({ where: { id: businessId }, data: updateData, select: BUSINESS_SELECT })
}

/**
 * Legacy: Update business profile (all fields at once).
 * Kept for backward compatibility (BusinessSettingsModal, logo/signature upload, sidebar default change).
 */
export async function updateBusinessProfile(businessId, data) {
  await ensureBusiness(businessId)

  const updateData = {}

  // Basic info
  if (data.name !== undefined) updateData.name = data.name
  if (data.phone !== undefined) updateData.phone = data.phone
  if (data.email !== undefined) updateData.email = data.email
  if (data.address !== undefined) updateData.address = data.address
  if (data.website !== undefined) updateData.website = data.website
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl

  // GST settings
  if (data.gstEnabled !== undefined) updateData.gstEnabled = data.gstEnabled
  if (data.gstin !== undefined) updateData.gstin = data.gstin
  if (data.stateCode !== undefined) updateData.stateCode = data.stateCode
  if (data.defaultTaxRate !== undefined) updateData.defaultTaxRate = data.defaultTaxRate

  // Bank details
  if (data.bankName !== undefined) updateData.bankName = data.bankName
  if (data.accountNumber !== undefined) updateData.accountNumber = data.accountNumber
  if (data.ifscCode !== undefined) updateData.ifscCode = data.ifscCode
  if (data.upiId !== undefined) updateData.upiId = data.upiId

  // Signature
  if (data.signatureUrl !== undefined) updateData.signatureUrl = data.signatureUrl
  if (data.signatureName !== undefined) updateData.signatureName = data.signatureName

  // Invoice defaults — allow empty string for invoicePrefix
  if (data.invoicePrefix !== undefined) updateData.invoicePrefix = data.invoicePrefix ?? ''
  if (data.defaultNotes !== undefined) updateData.defaultNotes = data.defaultNotes
  if (data.defaultTerms !== undefined) updateData.defaultTerms = data.defaultTerms
  if (data.enableStatusWorkflow !== undefined) updateData.enableStatusWorkflow = data.enableStatusWorkflow
  if (data.enablePoNumber !== undefined) updateData.enablePoNumber = data.enablePoNumber
  if (data.enabledInvoiceTypes !== undefined) updateData.enabledInvoiceTypes = data.enabledInvoiceTypes
  if (data.documentTypeConfig !== undefined) updateData.documentTypeConfig = data.documentTypeConfig
  if (data.defaultDocType !== undefined) updateData.defaultDocType = data.defaultDocType || 'invoice'

  // Next invoice number (with user-friendly validation)
  if (data.nextInvoiceNumber !== undefined) {
    const highestInvoice = await prisma.invoice.findFirst({
      where: { businessId, status: { not: 'DRAFT' } },
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true }
    })

    if (highestInvoice) {
      const currentNumber = parseInt(highestInvoice.invoiceNumber.replace(/\D/g, ''), 10) || 0
      if (data.nextInvoiceNumber <= currentNumber) {
        throw new ValidationError(
          `Next invoice number must be greater than ${currentNumber}. You have already issued invoices up to #${currentNumber}.`
        )
      }
    }

    updateData.nextInvoiceNumber = data.nextInvoiceNumber
  }

  return prisma.business.update({ where: { id: businessId }, data: updateData, select: BUSINESS_SELECT })
}

export async function getBusinessStats(businessId) {
  const [totalInvoices, totalPaid, totalUnpaid, totalDraft] = await Promise.all([
    prisma.invoice.count({
      where: { businessId }
    }),
    prisma.invoice.aggregate({
      where: { businessId, status: 'PAID' },
      _sum: { total: true },
      _count: true
    }),
    prisma.invoice.aggregate({
      where: { businessId, status: 'ISSUED' },
      _sum: { total: true },
      _count: true
    }),
    prisma.invoice.count({
      where: { businessId, status: 'DRAFT' }
    })
  ])

  return {
    totalInvoices,
    paidCount: totalPaid._count,
    paidAmount: totalPaid._sum.total || 0,
    unpaidCount: totalUnpaid._count,
    unpaidAmount: totalUnpaid._sum.total || 0,
    draftCount: totalDraft
  }
}
