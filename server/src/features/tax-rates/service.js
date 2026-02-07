import { prisma } from '../../common/prisma.js'
import { NotFoundError, ForbiddenError } from '../../common/errors.js'

export async function listTaxRates(businessId) {
  return prisma.taxRate.findMany({
    where: { businessId },
    orderBy: [{ isDefault: 'desc' }, { rate: 'asc' }]
  })
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
      isDefault: data.isDefault || false
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

  return prisma.taxRate.update({
    where: { id: taxRateId },
    data
  })
}

export async function deleteTaxRate(businessId, taxRateId) {
  const taxRate = await prisma.taxRate.findUnique({
    where: { id: taxRateId }
  })

  if (!taxRate) throw new NotFoundError('Tax rate not found')
  if (taxRate.businessId !== businessId) throw new ForbiddenError('Access denied')

  return prisma.taxRate.delete({
    where: { id: taxRateId }
  })
}
