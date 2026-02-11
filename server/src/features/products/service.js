import { NotFoundError, ForbiddenError } from '../../common/errors.js'

export const listUnits = async (prisma, businessId) => {
  const products = await prisma.productService.findMany({
    where: { businessId, unit: { not: null } },
    select: { unit: true },
    distinct: ['unit'],
    orderBy: { unit: 'asc' }
  })
  return products.map(p => p.unit).filter(Boolean)
}

export const searchProducts = async (prisma, businessId, query) => {
  const products = await prisma.productService.findMany({
    where: {
      businessId,
      name: { contains: query, mode: 'insensitive' }
    },
    orderBy: { updatedAt: 'desc' },
    take: 10
  })

  return products
}

export const listProducts = async (prisma, businessId, filters = {}) => {
  const { search, limit = 20, offset = 0 } = filters

  const where = {
    businessId,
    ...(search && {
      name: { contains: search, mode: 'insensitive' }
    })
  }

  const [products, total] = await Promise.all([
    prisma.productService.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    }),
    prisma.productService.count({ where })
  ])

  return {
    products,
    total,
    limit: parseInt(limit),
    offset: parseInt(offset)
  }
}

export const createProduct = async (prisma, businessId, data) => {
  const product = await prisma.productService.create({
    data: {
      businessId,
      name: data.name,
      defaultRate: data.defaultRate || null,
      unit: data.unit || null,
      taxRate: data.taxRate || null,
      hsnCode: data.hsnCode || null
    }
  })

  return product
}

export const getProduct = async (prisma, productId, businessId) => {
  const product = await prisma.productService.findUnique({
    where: { id: productId }
  })

  if (!product) {
    throw new NotFoundError('Product not found')
  }

  if (product.businessId !== businessId) {
    throw new ForbiddenError('Access denied')
  }

  return product
}

export const deleteProduct = async (prisma, productId, businessId) => {
  const product = await prisma.productService.findUnique({
    where: { id: productId },
    include: { invoiceLineItems: { select: { id: true }, take: 1 } }
  })

  if (!product) {
    throw new NotFoundError('Product not found')
  }

  if (product.businessId !== businessId) {
    throw new ForbiddenError('Access denied')
  }

  if (product.invoiceLineItems.length > 0) {
    throw new ForbiddenError('Cannot delete product used in existing invoices')
  }

  await prisma.productService.delete({ where: { id: productId } })
  return { success: true }
}

export const updateProduct = async (prisma, productId, businessId, data) => {
  const product = await prisma.productService.findUnique({
    where: { id: productId }
  })

  if (!product) {
    throw new NotFoundError('Product not found')
  }

  if (product.businessId !== businessId) {
    throw new ForbiddenError('Access denied')
  }

  const updated = await prisma.productService.update({
    where: { id: productId },
    data
  })

  return updated
}
