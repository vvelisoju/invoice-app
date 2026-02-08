import { v4 as uuidv4 } from 'uuid'
import { NotFoundError, ValidationError, ForbiddenError } from '../../common/errors.js'
import { checkCanIssueInvoice, incrementUsageCounter } from '../plans/service.js'

export const createInvoice = async (prisma, businessId, data) => {
  const business = await prisma.business.findUnique({
    where: { id: businessId }
  })

  if (!business) {
    throw new NotFoundError('Business not found')
  }

  // Generate invoice number if not provided
  let invoiceNumber = data.invoiceNumber
  if (!invoiceNumber) {
    invoiceNumber = `${business.invoicePrefix}${String(business.nextInvoiceNumber).padStart(4, '0')}`
    
    // Increment next invoice number
    await prisma.business.update({
      where: { id: businessId },
      data: { nextInvoiceNumber: { increment: 1 } }
    })
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

  // Create invoice with line items
  const invoice = await prisma.invoice.create({
    data: {
      id: data.id || uuidv4(),
      businessId,
      customerId: data.customerId || null,
      invoiceNumber,
      date: data.date ? new Date(data.date) : new Date(),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: 'DRAFT',
      subtotal,
      discountTotal,
      taxTotal,
      total,
      taxMode,
      taxRate: data.taxRate ? parseFloat(data.taxRate) : null,
      taxBreakup,
      placeOfSupplyStateCode: data.customerStateCode || null,
      notes: data.notes || null,
      terms: data.terms || business.defaultTerms || null,
      logoUrl: business.logoUrl || null,
      signatureUrl: business.signatureUrl || null,
      lineItems: {
        create: data.lineItems.map(item => ({
          id: item.id || uuidv4(),
          name: item.name,
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

  if (invoice.status !== 'DRAFT') {
    throw new ValidationError('Cannot edit issued invoice')
  }

  // Recalculate totals if line items changed
  let updateData = { ...data }

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
      ...(data.lineItems && {
        lineItems: {
          create: data.lineItems.map(item => ({
            id: item.id || uuidv4(),
            name: item.name,
            quantity: parseFloat(item.quantity),
            rate: parseFloat(item.rate),
            lineTotal: parseFloat(item.quantity) * parseFloat(item.rate),
            productServiceId: item.productServiceId || null
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
  const { search, status, dateFrom, dateTo, limit = 20, offset = 0 } = filters

  const where = {
    businessId,
    ...(status && { status }),
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

  return updated
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
    data: { status }
  })

  return updated
}
