import { NotFoundError, ForbiddenError } from '../../common/errors.js'

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

export const createProduct = async (prisma, businessId, data) => {
  const product = await prisma.productService.create({
    data: {
      businessId,
      name: data.name,
      defaultRate: data.defaultRate || null,
      unit: data.unit || null
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
