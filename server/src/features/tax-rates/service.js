import { prisma } from '../../common/prisma.js'
import { NotFoundError, ForbiddenError } from '../../common/errors.js'
import { logger } from '../../common/logger.js'

// ============================================================================
// Default GST Intrastate Tax Groups (CGST + SGST)
// ============================================================================

const DEFAULT_GST_GROUPS = [
  { name: 'GST 0%',  rate: 0,  isDefault: false },
  { name: 'GST 5%',  rate: 5,  isDefault: false },
  { name: 'GST 12%', rate: 12, isDefault: false },
  { name: 'GST 18%', rate: 18, isDefault: true  },
  { name: 'GST 28%', rate: 28, isDefault: false },
]

/**
 * Create default GST intrastate tax groups (CGST + SGST) for a business.
 * Idempotent — skips if any tax rates already exist for the business.
 * Wrapped in a DB transaction for atomicity.
 */
export async function createDefaultGSTIntrastateTaxes(businessId) {
  return prisma.$transaction(async (tx) => {
    // Idempotency: skip if business already has tax rates
    const existing = await tx.taxRate.count({ where: { businessId } })
    if (existing > 0) {
      logger.info({ businessId, existing }, '[GST Seed] Tax rates already exist, skipping')
      return null
    }

    const created = await Promise.all(
      DEFAULT_GST_GROUPS.map((group) =>
        tx.taxRate.create({
          data: {
            businessId,
            name: group.name,
            rate: group.rate,
            isDefault: group.isDefault,
            components: [
              { name: 'CGST', rate: group.rate / 2 },
              { name: 'SGST', rate: group.rate / 2 },
            ],
          },
        })
      )
    )

    logger.info({ businessId, count: created.length }, '[GST Seed] Default intrastate tax groups created')
    return created
  })
}

export async function listTaxRates(businessId) {
  let taxRates = await prisma.taxRate.findMany({
    where: { businessId },
    orderBy: [{ isDefault: 'desc' }, { rate: 'asc' }]
  })

  // Auto-seed default GST groups if business has none yet
  if (taxRates.length === 0) {
    try {
      logger.info({ businessId }, '[GST Seed] No tax rates found, auto-seeding defaults')
      const seeded = await createDefaultGSTIntrastateTaxes(businessId)
      if (seeded) {
        taxRates = await prisma.taxRate.findMany({
          where: { businessId },
          orderBy: [{ isDefault: 'desc' }, { rate: 'asc' }]
        })
      }
    } catch (err) {
      logger.error({ err, businessId }, '[GST Seed] Auto-seed failed in listTaxRates')
    }
  }

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
