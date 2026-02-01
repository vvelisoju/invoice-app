import { prisma } from '../../common/prisma.js'
import { v4 as uuidv4 } from 'uuid'

const IDEMPOTENCY_KEY_EXPIRY_HOURS = 24

export async function checkIdempotencyKey(key, businessId) {
  if (!key) return null

  const existing = await prisma.idempotencyKey.findUnique({
    where: {
      key_businessId: { key, businessId }
    }
  })

  if (existing) {
    // Check if expired
    const expiryTime = new Date(existing.createdAt)
    expiryTime.setHours(expiryTime.getHours() + IDEMPOTENCY_KEY_EXPIRY_HOURS)

    if (new Date() > expiryTime) {
      // Expired, delete and allow retry
      await prisma.idempotencyKey.delete({
        where: { id: existing.id }
      })
      return null
    }

    // Return cached response
    return existing.response
  }

  return null
}

export async function saveIdempotencyKey(key, businessId, response) {
  if (!key) return

  await prisma.idempotencyKey.upsert({
    where: {
      key_businessId: { key, businessId }
    },
    create: {
      id: uuidv4(),
      key,
      businessId,
      response,
      createdAt: new Date()
    },
    update: {
      response,
      createdAt: new Date()
    }
  })
}

export async function getDeltaChanges(businessId, lastSyncAt) {
  const since = lastSyncAt ? new Date(lastSyncAt) : new Date(0)

  const [invoices, customers, products] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        businessId,
        updatedAt: { gt: since }
      },
      include: {
        lineItems: true,
        customer: true
      },
      orderBy: { updatedAt: 'asc' }
    }),
    prisma.customer.findMany({
      where: {
        businessId,
        updatedAt: { gt: since }
      },
      orderBy: { updatedAt: 'asc' }
    }),
    prisma.productService.findMany({
      where: {
        businessId,
        updatedAt: { gt: since }
      },
      orderBy: { updatedAt: 'asc' }
    })
  ])

  return {
    invoices,
    customers,
    products,
    syncedAt: new Date().toISOString()
  }
}

export async function getFullSync(businessId) {
  const [invoices, customers, products, business] = await Promise.all([
    prisma.invoice.findMany({
      where: { businessId },
      include: {
        lineItems: true,
        customer: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 100 // Limit initial sync
    }),
    prisma.customer.findMany({
      where: { businessId },
      orderBy: { updatedAt: 'desc' },
      take: 500
    }),
    prisma.productService.findMany({
      where: { businessId },
      orderBy: { updatedAt: 'desc' },
      take: 500
    }),
    prisma.business.findUnique({
      where: { id: businessId }
    })
  ])

  return {
    invoices,
    customers,
    products,
    business,
    syncedAt: new Date().toISOString()
  }
}

export async function processBatchMutations(businessId, mutations) {
  const results = []

  for (const mutation of mutations) {
    try {
      // Check idempotency
      const cachedResponse = await checkIdempotencyKey(mutation.idempotencyKey, businessId)
      if (cachedResponse) {
        results.push({
          id: mutation.id,
          status: 'success',
          data: cachedResponse,
          cached: true
        })
        continue
      }

      let result
      switch (mutation.type) {
        case 'CREATE_INVOICE':
          result = await processCreateInvoice(businessId, mutation.data)
          break
        case 'UPDATE_INVOICE':
          result = await processUpdateInvoice(businessId, mutation.data)
          break
        case 'CREATE_CUSTOMER':
          result = await processCreateCustomer(businessId, mutation.data)
          break
        case 'UPDATE_CUSTOMER':
          result = await processUpdateCustomer(businessId, mutation.data)
          break
        case 'CREATE_PRODUCT':
          result = await processCreateProduct(businessId, mutation.data)
          break
        case 'UPDATE_PRODUCT':
          result = await processUpdateProduct(businessId, mutation.data)
          break
        default:
          throw new Error(`Unknown mutation type: ${mutation.type}`)
      }

      // Save idempotency key
      if (mutation.idempotencyKey) {
        await saveIdempotencyKey(mutation.idempotencyKey, businessId, result)
      }

      results.push({
        id: mutation.id,
        status: 'success',
        data: result
      })
    } catch (error) {
      results.push({
        id: mutation.id,
        status: 'error',
        error: error.message
      })
    }
  }

  return results
}

async function processCreateInvoice(businessId, data) {
  const business = await prisma.business.findUnique({
    where: { id: businessId }
  })

  let invoiceNumber = data.invoiceNumber
  if (!invoiceNumber) {
    invoiceNumber = `${business.invoicePrefix}${String(business.nextInvoiceNumber).padStart(4, '0')}`
    await prisma.business.update({
      where: { id: businessId },
      data: { nextInvoiceNumber: { increment: 1 } }
    })
  }

  // Check for existing (idempotent create)
  const existing = await prisma.invoice.findUnique({
    where: { id: data.id }
  })

  if (existing) {
    return existing
  }

  const subtotal = (data.lineItems || []).reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) * parseFloat(item.rate))
  }, 0)

  const discountTotal = parseFloat(data.discountTotal || 0)
  const taxRate = parseFloat(data.taxRate || 0)
  const taxTotal = taxRate > 0 ? ((subtotal - discountTotal) * taxRate) / 100 : 0
  const total = subtotal - discountTotal + taxTotal

  return prisma.invoice.create({
    data: {
      id: data.id,
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
      taxRate: taxRate || null,
      notes: data.notes || null,
      terms: data.terms || null,
      lineItems: {
        create: (data.lineItems || []).map(item => ({
          id: item.id,
          name: item.name,
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
          lineTotal: parseFloat(item.quantity) * parseFloat(item.rate),
          productServiceId: item.productServiceId || null
        }))
      }
    },
    include: { lineItems: true, customer: true }
  })
}

async function processUpdateInvoice(businessId, data) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: data.id }
  })

  if (!invoice || invoice.businessId !== businessId) {
    throw new Error('Invoice not found')
  }

  if (invoice.status !== 'DRAFT') {
    throw new Error('Cannot edit issued invoice')
  }

  const updateData = {}
  if (data.customerId !== undefined) updateData.customerId = data.customerId
  if (data.date !== undefined) updateData.date = new Date(data.date)
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
  if (data.notes !== undefined) updateData.notes = data.notes
  if (data.terms !== undefined) updateData.terms = data.terms

  if (data.lineItems) {
    const subtotal = data.lineItems.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) * parseFloat(item.rate))
    }, 0)
    const discountTotal = parseFloat(data.discountTotal || invoice.discountTotal || 0)
    const taxRate = parseFloat(data.taxRate || invoice.taxRate || 0)
    const taxTotal = taxRate > 0 ? ((subtotal - discountTotal) * taxRate) / 100 : 0

    updateData.subtotal = subtotal
    updateData.discountTotal = discountTotal
    updateData.taxTotal = taxTotal
    updateData.total = subtotal - discountTotal + taxTotal

    await prisma.invoiceLineItem.deleteMany({ where: { invoiceId: data.id } })
  }

  return prisma.invoice.update({
    where: { id: data.id },
    data: {
      ...updateData,
      ...(data.lineItems && {
        lineItems: {
          create: data.lineItems.map(item => ({
            id: item.id,
            name: item.name,
            quantity: parseFloat(item.quantity),
            rate: parseFloat(item.rate),
            lineTotal: parseFloat(item.quantity) * parseFloat(item.rate),
            productServiceId: item.productServiceId || null
          }))
        }
      })
    },
    include: { lineItems: true, customer: true }
  })
}

async function processCreateCustomer(businessId, data) {
  const existing = await prisma.customer.findUnique({
    where: { id: data.id }
  })

  if (existing) {
    return existing
  }

  return prisma.customer.create({
    data: {
      id: data.id,
      businessId,
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      gstin: data.gstin || null,
      stateCode: data.stateCode || null,
      address: data.address || null
    }
  })
}

async function processUpdateCustomer(businessId, data) {
  const customer = await prisma.customer.findUnique({
    where: { id: data.id }
  })

  if (!customer || customer.businessId !== businessId) {
    throw new Error('Customer not found')
  }

  return prisma.customer.update({
    where: { id: data.id },
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      gstin: data.gstin,
      stateCode: data.stateCode,
      address: data.address
    }
  })
}

async function processCreateProduct(businessId, data) {
  const existing = await prisma.productService.findUnique({
    where: { id: data.id }
  })

  if (existing) {
    return existing
  }

  return prisma.productService.create({
    data: {
      id: data.id,
      businessId,
      name: data.name,
      defaultRate: data.defaultRate ? parseFloat(data.defaultRate) : null,
      unit: data.unit || null,
      hsnCode: data.hsnCode || null
    }
  })
}

async function processUpdateProduct(businessId, data) {
  const product = await prisma.productService.findUnique({
    where: { id: data.id }
  })

  if (!product || product.businessId !== businessId) {
    throw new Error('Product not found')
  }

  return prisma.productService.update({
    where: { id: data.id },
    data: {
      name: data.name,
      defaultRate: data.defaultRate ? parseFloat(data.defaultRate) : null,
      unit: data.unit,
      hsnCode: data.hsnCode
    }
  })
}
