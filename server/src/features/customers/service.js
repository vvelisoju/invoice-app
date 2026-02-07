import { NotFoundError, ForbiddenError } from '../../common/errors.js'

export const searchCustomers = async (prisma, businessId, query) => {
  const customers = await prisma.customer.findMany({
    where: {
      businessId,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } }
      ]
    },
    orderBy: { updatedAt: 'desc' },
    take: 10
  })

  return customers
}

export const listCustomers = async (prisma, businessId, filters = {}) => {
  const { search, limit = 20, offset = 0 } = filters

  const where = {
    businessId,
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    })
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        invoices: {
          select: { id: true, total: true, status: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    }),
    prisma.customer.count({ where })
  ])

  return {
    customers,
    total,
    limit: parseInt(limit),
    offset: parseInt(offset)
  }
}

export const createCustomer = async (prisma, businessId, data) => {
  const customer = await prisma.customer.create({
    data: {
      businessId,
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      gstin: data.gstin || null,
      stateCode: data.stateCode || null,
      address: data.address || null
    }
  })

  return customer
}

export const getCustomer = async (prisma, customerId, businessId) => {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId }
  })

  if (!customer) {
    throw new NotFoundError('Customer not found')
  }

  if (customer.businessId !== businessId) {
    throw new ForbiddenError('Access denied')
  }

  return customer
}

export const updateCustomer = async (prisma, customerId, businessId, data) => {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId }
  })

  if (!customer) {
    throw new NotFoundError('Customer not found')
  }

  if (customer.businessId !== businessId) {
    throw new ForbiddenError('Access denied')
  }

  const updated = await prisma.customer.update({
    where: { id: customerId },
    data
  })

  return updated
}
