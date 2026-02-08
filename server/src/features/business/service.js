import { prisma } from '../../common/prisma.js'
import { NotFoundError } from '../../common/errors.js'

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
      enabledInvoiceTypes: true,
      documentTypeConfig: true,
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

export async function updateBusinessProfile(businessId, data) {
  const business = await prisma.business.findUnique({
    where: { id: businessId }
  })

  if (!business) {
    throw new NotFoundError('Business not found')
  }

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

  // Invoice defaults
  if (data.invoicePrefix !== undefined) updateData.invoicePrefix = data.invoicePrefix
  if (data.defaultNotes !== undefined) updateData.defaultNotes = data.defaultNotes
  if (data.defaultTerms !== undefined) updateData.defaultTerms = data.defaultTerms
  if (data.enableStatusWorkflow !== undefined) updateData.enableStatusWorkflow = data.enableStatusWorkflow
  if (data.enabledInvoiceTypes !== undefined) updateData.enabledInvoiceTypes = data.enabledInvoiceTypes
  if (data.documentTypeConfig !== undefined) updateData.documentTypeConfig = data.documentTypeConfig

  // Next invoice number (with validation)
  if (data.nextInvoiceNumber !== undefined) {
    // Get highest issued invoice number
    const highestInvoice = await prisma.invoice.findFirst({
      where: {
        businessId,
        status: { not: 'DRAFT' }
      },
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true }
    })

    if (highestInvoice) {
      const currentNumber = parseInt(highestInvoice.invoiceNumber.replace(/\D/g, ''), 10) || 0
      if (data.nextInvoiceNumber <= currentNumber) {
        throw new Error(`Next invoice number must be greater than ${currentNumber}`)
      }
    }

    updateData.nextInvoiceNumber = data.nextInvoiceNumber
  }

  const updated = await prisma.business.update({
    where: { id: businessId },
    data: updateData,
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
      enabledInvoiceTypes: true,
      documentTypeConfig: true,
      planId: true,
      createdAt: true,
      updatedAt: true
    }
  })

  return updated
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
