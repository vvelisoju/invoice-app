import { prisma } from '../../common/prisma.js'
import { logger } from '../../common/logger.js'

export async function createEnquiry(data) {
  const enquiry = await prisma.externalEnquiry.create({
    data: {
      source: data.source || 'unknown',
      name: data.name || '',
      phone: data.phone || '',
      interestedIn: data.interestedIn || '',
      message: data.message || null,
      formType: data.formType || 'general',
      extraData: data.extraData || null,
    }
  })
  logger.info({ id: enquiry.id, source: enquiry.source }, 'External enquiry created')
  return enquiry
}

export async function listEnquiries(filters = {}) {
  const {
    source, status, search, dateFrom, dateTo,
    sortBy = 'createdAt', sortOrder = 'desc',
    limit = 25, offset = 0
  } = filters

  const where = {}

  if (source) where.source = source
  if (status) where.status = status

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { interestedIn: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(dateFrom)
    if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z')
  }

  const [data, total] = await Promise.all([
    prisma.externalEnquiry.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip: offset,
    }),
    prisma.externalEnquiry.count({ where }),
  ])

  return { data, total, limit, offset }
}

export async function getEnquiryById(id) {
  return prisma.externalEnquiry.findUnique({ where: { id } })
}

export async function updateEnquiry(id, data) {
  const enquiry = await prisma.externalEnquiry.update({
    where: { id },
    data,
  })
  logger.info({ id, status: data.status }, 'External enquiry updated')
  return enquiry
}

export async function getEnquiryStats() {
  const [total, byStatus, bySrc] = await Promise.all([
    prisma.externalEnquiry.count(),
    prisma.externalEnquiry.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.externalEnquiry.groupBy({
      by: ['source'],
      _count: { id: true },
    }),
  ])

  return {
    total,
    byStatus: byStatus.reduce((acc, r) => ({ ...acc, [r.status]: r._count.id }), {}),
    bySource: bySrc.reduce((acc, r) => ({ ...acc, [r.source]: r._count.id }), {}),
  }
}
