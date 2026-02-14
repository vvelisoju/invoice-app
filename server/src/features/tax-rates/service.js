import { prisma } from '../../common/prisma.js'
import { NotFoundError, ForbiddenError } from '../../common/errors.js'

export async function listTaxRates(businessId) {
  const taxRates = await prisma.taxRate.findMany({
    where: { businessId },
    orderBy: [{ isDefault: 'desc' }, { rate: 'asc' }]
  })

  // Enrich each tax rate with product usage count
  const enriched = await Promise.all(
    taxRates.map(async (tr) => {
      const productCount = await prisma.productService.count({
        where: { businessId, taxRateName: tr.name }
      })
      return { ...tr, productCount }
    })
  )

  return enriched
}

export async function createTaxRate(businessId, data) {
  // If this is set as default, unset other defaults first
  if (data.isDefault) {
    await prisma.taxRate.updateMany({
      where: { businessId, isDefault: true },
      data: { isDefault: false }
    })
  }

  return prisma.taxRate.create({
    data: {
      businessId,
      name: data.name,
      rate: data.rate,
      isDefault: data.isDefault || false,
      components: data.components || null
    }
  })
}

export async function updateTaxRate(businessId, taxRateId, data) {
  const taxRate = await prisma.taxRate.findUnique({
    where: { id: taxRateId }
  })

  if (!taxRate) throw new NotFoundError('Tax rate not found')
  if (taxRate.businessId !== businessId) throw new ForbiddenError('Access denied')

  // If setting as default, unset other defaults first
  if (data.isDefault) {
    await prisma.taxRate.updateMany({
      where: { businessId, isDefault: true, id: { not: taxRateId } },
      data: { isDefault: false }
    })
  }

  // Ensure components field is explicitly handled
  const updateData = { ...data }
  if ('components' in updateData) {
    updateData.components = updateData.components || null
  }

  return prisma.taxRate.update({
    where: { id: taxRateId },
    data: updateData
  })
}

export async function deleteTaxRate(businessId, taxRateId) {
  const taxRate = await prisma.taxRate.findUnique({
    where: { id: taxRateId }
  })

  if (!taxRate) throw new NotFoundError('Tax rate not found')
  if (taxRate.businessId !== businessId) throw new ForbiddenError('Access denied')

  // Check if any products are using this tax rate
  const productCount = await prisma.productService.count({
    where: { businessId, taxRateName: taxRate.name }
  })

  if (productCount > 0) {
    const err = new Error(`Cannot delete: ${productCount} product(s) use this tax rate`)
    err.statusCode = 409
    throw err
  }

  return prisma.taxRate.delete({
    where: { id: taxRateId }
  })
}
