import { v4 as uuidv4 } from 'uuid'
import { NotFoundError, ValidationError, ForbiddenError } from '../../common/errors.js'
import { checkCanIssueInvoice, incrementUsageCounter, getBusinessPlanUsage } from '../plans/service.js'
import { emit as emitNotification } from '../notifications/service.js'

// Default prefixes per document type (server-side mirror of client defaults)
const DOC_TYPE_DEFAULT_PREFIX = {
  invoice: 'INV-', tax_invoice: 'TINV-', proforma: 'PI-', receipt: 'RCT-',
  sales_receipt: 'SR-', cash_receipt: 'CR-', quote: 'QT-', estimate: 'EST-',
  credit_memo: 'CM-', credit_note: 'CN-', purchase_order: 'PO-', delivery_note: 'DN-',
}

export const createInvoice = async (prisma, businessId, data) => {
  const business = await prisma.business.findUnique({
    where: { id: businessId }
  })

  if (!business) {
    throw new NotFoundError('Business not found')
  }

  // Resolve per-document-type prefix and next number
  const docType = data.documentType || 'invoice'
  const docConfig = business.documentTypeConfig || {}
  const typeConfig = docConfig[docType] || {}

  // Generate invoice number if not provided
  let invoiceNumber = data.invoiceNumber
  if (!invoiceNumber) {
    // Use per-doc-type config if available, else fall back to business defaults (for 'invoice' type) or doc-type default prefix
    let prefix, nextNum
    if (docType === 'invoice' && typeConfig.prefix === undefined && typeConfig.nextNumber === undefined) {
      // Legacy: use business-level invoicePrefix + nextInvoiceNumber for plain invoices
      prefix = business.invoicePrefix
      nextNum = business.nextInvoiceNumber
    } else {
      prefix = typeConfig.prefix || DOC_TYPE_DEFAULT_PREFIX[docType] || business.invoicePrefix
      nextNum = typeConfig.nextNumber || 1
    }

    invoiceNumber = `${prefix}${String(nextNum).padStart(4, '0')}`

    // Increment the appropriate next number counter
    if (docType === 'invoice' && typeConfig.prefix === undefined && typeConfig.nextNumber === undefined) {
      // Legacy path: increment business-level counter
      await prisma.business.update({
        where: { id: businessId },
        data: { nextInvoiceNumber: { increment: 1 } }
      })
    } else {
      // Per-doc-type path: increment nextNumber inside documentTypeConfig JSON
      const updatedDocConfig = { ...docConfig }
      updatedDocConfig[docType] = { ...(updatedDocConfig[docType] || {}), nextNumber: (nextNum) + 1 }
      await prisma.business.update({
        where: { id: businessId },
        data: { documentTypeConfig: updatedDocConfig }
      })
    }
  }

  // Check for duplicate invoice number
  const existing = await prisma.invoice.findUnique({
    where: {
      businessId_invoiceNumber: {
        businessId,
        invoiceNumber
      }
    }
  })

  if (existing) {
    throw new ValidationError('Invoice number already exists')
  }

  // Calculate totals
  const subtotal = data.lineItems.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) * parseFloat(item.rate))
  }, 0)

  const discountTotal = parseFloat(data.discountTotal || 0)
  
  // Calculate tax
  let taxTotal = 0
  let taxBreakup = null
  let taxMode = 'NONE'

  if (data.taxRate && parseFloat(data.taxRate) > 0) {
    const taxableAmount = subtotal - discountTotal
    const taxRate = parseFloat(data.taxRate)
    taxTotal = (taxableAmount * taxRate) / 100

    // Determine tax mode based on state codes
    if (business.stateCode && data.customerStateCode) {
      if (business.stateCode === data.customerStateCode) {
        taxMode = 'CGST_SGST'
        taxBreakup = {
          cgst: taxRate / 2,
          sgst: taxRate / 2,
          cgstAmount: taxTotal / 2,
          sgstAmount: taxTotal / 2
        }
      } else {
        taxMode = 'IGST'
        taxBreakup = {
          igst: taxRate,
          igstAmount: taxTotal
        }
      }
    }
  }

  const total = subtotal - discountTotal + taxTotal

  // Determine initial status based on business workflow setting
  // When enableStatusWorkflow is false (default), invoices are saved as PAID directly
  // When true, invoices start as DRAFT and go through Issue → Paid flow
  const initialStatus = business.enableStatusWorkflow ? 'DRAFT' : 'PAID'

  // If saving directly as PAID (no workflow), check plan limits and count usage
  if (!business.enableStatusWorkflow) {
    await checkCanIssueInvoice(businessId)
  }

  // Create invoice with line items
  const invoice = await prisma.invoice.create({
    data: {
      id: data.id || uuidv4(),
      businessId,
      customerId: data.customerId || null,
      invoiceNumber,
      documentType: data.documentType || 'invoice',
      date: data.date ? new Date(data.date) : new Date(),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: initialStatus,
      issuedAt: !business.enableStatusWorkflow ? new Date() : null,
      paidAt: !business.enableStatusWorkflow ? new Date() : null,
      subtotal,
      discountTotal,
      taxTotal,
      total,
      taxMode,
      taxRate: data.taxRate ? parseFloat(data.taxRate) : null,
      taxBreakup,
      placeOfSupplyStateCode: data.customerStateCode || null,
      fromAddress: data.fromAddress || null,
      billTo: data.billTo || null,
      shipTo: data.shipTo || null,
      notes: data.notes || null,
      terms: data.terms || business.defaultTerms || null,
      logoUrl: business.logoUrl || null,
      signatureUrl: business.signatureUrl || null,
      lineItems: {
        create: data.lineItems.map(item => ({
          id: item.id || uuidv4(),
          name: item.name,
          hsnCode: item.hsnCode || null,
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
          lineTotal: parseFloat(item.quantity) * parseFloat(item.rate),
          productServiceId: item.productServiceId || null
        }))
      }
    },
    include: {
      lineItems: true,
      customer: true
    }
  })

  // Increment usage counter when saving directly as PAID
  if (!business.enableStatusWorkflow) {
    await incrementUsageCounter(businessId)
    checkUsageLimitWarning(businessId, business.ownerUserId)
  }

  return invoice
}

export const updateInvoice = async (prisma, invoiceId, businessId, data) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lineItems: true }
  })

  if (!invoice) {
    throw new NotFoundError('Invoice not found')
  }

  if (invoice.businessId !== businessId) {
    throw new ForbiddenError('Access denied')
  }

  // Normalize date fields to full ISO-8601 DateTime for Prisma
  if (data.date) data.date = new Date(data.date).toISOString()
  if (data.dueDate) data.dueDate = new Date(data.dueDate).toISOString()

  // Extract fields that aren't direct Prisma update fields
  const { customerId, customerStateCode, lineItems: rawLineItems, fromAddress, billTo, shipTo, documentType, ...restData } = data

  // Recalculate totals if line items changed
  let updateData = { ...restData }

  if (data.lineItems) {
    const subtotal = data.lineItems.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) * parseFloat(item.rate))
    }, 0)

    const discountTotal = parseFloat(data.discountTotal || invoice.discountTotal)
    
    let taxTotal = 0
    let taxBreakup = null
    let taxMode = invoice.taxMode

    if (data.taxRate && parseFloat(data.taxRate) > 0) {
      const taxableAmount = subtotal - discountTotal
      const taxRate = parseFloat(data.taxRate)
      taxTotal = (taxableAmount * taxRate) / 100

      const business = await prisma.business.findUnique({
        where: { id: businessId }
      })

      if (business.stateCode && data.customerStateCode) {
        if (business.stateCode === data.customerStateCode) {
          taxMode = 'CGST_SGST'
          taxBreakup = {
            cgst: taxRate / 2,
            sgst: taxRate / 2,
            cgstAmount: taxTotal / 2,
            sgstAmount: taxTotal / 2
          }
        } else {
          taxMode = 'IGST'
          taxBreakup = {
            igst: taxRate,
            igstAmount: taxTotal
          }
        }
      }
    }

    const total = subtotal - discountTotal + taxTotal

    updateData = {
      ...updateData,
      subtotal,
      discountTotal,
      taxTotal,
      total,
      taxMode,
      taxBreakup
    }

    // Delete existing line items and create new ones
    await prisma.invoiceLineItem.deleteMany({
      where: { invoiceId }
    })
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      ...updateData,
      // Handle customer relation via connect/disconnect
      ...(customerId
        ? { customer: { connect: { id: customerId } } }
        : customerId === null ? { customer: { disconnect: true } } : {}
      ),
      // Map customerStateCode to the actual Prisma field
      ...(customerStateCode !== undefined && { placeOfSupplyStateCode: customerStateCode }),
      // Document type
      ...(documentType !== undefined && { documentType }),
      // Address snapshots (editable per-invoice)
      ...(fromAddress !== undefined && { fromAddress }),
      ...(billTo !== undefined && { billTo }),
      ...(shipTo !== undefined && { shipTo }),
      ...(rawLineItems && {
        lineItems: {
          create: rawLineItems.map(item => ({
            id: item.id || uuidv4(),
            name: item.name,
            hsnCode: item.hsnCode || null,
            quantity: parseFloat(item.quantity),
            rate: parseFloat(item.rate),
            lineTotal: parseFloat(item.quantity) * parseFloat(item.rate),
            ...(item.productServiceId ? { productService: { connect: { id: item.productServiceId } } } : {})
          }))
        }
      })
    },
    include: {
      lineItems: true,
      customer: true
    }
  })

  return updated
}

export const getInvoice = async (prisma, invoiceId, businessId) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      lineItems: {
        include: {
          productService: true
        }
      },
      customer: true,
      business: true
    }
  })

  if (!invoice) {
    throw new NotFoundError('Invoice not found')
  }

  if (invoice.businessId !== businessId) {
    throw new ForbiddenError('Access denied')
  }

  return invoice
}

export const listInvoices = async (prisma, businessId, filters = {}) => {
  const { search, status, customerId, dateFrom, dateTo, limit = 20, offset = 0 } = filters

  const where = {
    businessId,
    ...(status && { status }),
    ...(customerId && { customerId }),
    ...(dateFrom && { date: { gte: new Date(dateFrom) } }),
    ...(dateTo && { date: { lte: new Date(dateTo) } }),
    ...(search && {
      OR: [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } }
      ]
    })
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        customer: true,
        lineItems: true
      },
      orderBy: { date: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    }),
    prisma.invoice.count({ where })
  ])

  return {
    invoices,
    total,
    limit: parseInt(limit),
    offset: parseInt(offset)
  }
}

export const deleteInvoice = async (prisma, invoiceId, businessId) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId }
  })

  if (!invoice) {
    throw new NotFoundError('Invoice not found')
  }

  if (invoice.businessId !== businessId) {
    throw new ForbiddenError('Access denied')
  }

  if (invoice.status !== 'DRAFT') {
    throw new ValidationError('Cannot delete issued invoice')
  }

  await prisma.invoice.delete({
    where: { id: invoiceId }
  })

  return { message: 'Invoice deleted successfully' }
}

export const issueInvoice = async (prisma, invoiceId, businessId, templateData) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId }
  })

  if (!invoice) {
    throw new NotFoundError('Invoice not found')
  }

  if (invoice.businessId !== businessId) {
    throw new ForbiddenError('Access denied')
  }

  if (invoice.status !== 'DRAFT') {
    throw new ValidationError('Invoice already issued')
  }

  // Check plan limits before issuing
  await checkCanIssueInvoice(businessId)

  // Fetch latest business logo/signature for snapshot
  const business = await prisma.business.findUnique({
    where: { id: businessId }
  })

  // Update invoice with template snapshot and logo/signature
  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'ISSUED',
      issuedAt: new Date(),
      logoUrl: business?.logoUrl || invoice.logoUrl || null,
      signatureUrl: business?.signatureUrl || invoice.signatureUrl || null,
      templateBaseId: templateData?.templateBaseId || null,
      templateConfigSnapshot: templateData?.templateConfigSnapshot || null,
      templateVersion: templateData?.templateVersion || null
    },
    include: {
      lineItems: true,
      customer: true,
      business: true
    }
  })

  // Increment usage counter after successful issuance
  await incrementUsageCounter(businessId)
  checkUsageLimitWarning(businessId, business.ownerUserId)

  return updated
}

// Fire-and-forget usage limit warning check
async function checkUsageLimitWarning(businessId, userId) {
  try {
    const usage = await getBusinessPlanUsage(businessId)
    const used = usage.usage.invoicesIssued
    const limit = usage.plan.monthlyInvoiceLimit
    if (limit <= 0) return

    const pct = (used / limit) * 100

    if (pct >= 100) {
      emitNotification('usage_limit_reached', {
        userId,
        businessId,
        variables: { limit: String(limit) },
        data: { action: 'navigate', route: '/plans' },
      })
    } else if (pct >= 80) {
      emitNotification('usage_limit_warning', {
        userId,
        businessId,
        variables: { used: String(used), limit: String(limit) },
        data: { action: 'navigate', route: '/plans' },
      })
    }
  } catch {
    // Non-critical, ignore
  }
}

export const updateInvoiceStatus = async (prisma, invoiceId, businessId, status) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId }
  })

  if (!invoice) {
    throw new NotFoundError('Invoice not found')
  }

  if (invoice.businessId !== businessId) {
    throw new ForbiddenError('Access denied')
  }

  const validStatuses = ['DRAFT', 'ISSUED', 'PAID', 'CANCELLED', 'VOID']
  if (!validStatuses.includes(status)) {
    throw new ValidationError('Invalid status')
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status,
      ...(status === 'PAID' && { paidAt: new Date() })
    }
  })

  return updated
}
