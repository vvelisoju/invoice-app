import { prisma } from '../../common/prisma.js'
import { ForbiddenError, NotFoundError } from '../../common/errors.js'

export async function getBusinessPlanUsage(businessId) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      plan: true,
      subscription: true
    }
  })

  if (!business) {
    throw new NotFoundError('Business not found')
  }

  // Get current month's usage
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const usageCounter = await prisma.usageCounter.findFirst({
    where: {
      businessId,
      periodStart: { gte: startOfMonth },
      periodEnd: { lte: endOfMonth }
    }
  })

  // Count issued invoices this month
  const issuedThisMonth = await prisma.invoice.count({
    where: {
      businessId,
      status: { not: 'DRAFT' },
      issuedAt: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  })

  const plan = business.plan || await getDefaultPlan()
  const monthlyLimit = plan?.monthlyInvoiceLimit || 10 // Default free plan limit

  return {
    plan: {
      id: plan?.id,
      name: plan?.name || 'Free',
      monthlyInvoiceLimit: monthlyLimit,
      features: plan?.features || {}
    },
    usage: {
      invoicesIssued: issuedThisMonth,
      invoicesRemaining: Math.max(0, monthlyLimit - issuedThisMonth),
      periodStart: startOfMonth.toISOString(),
      periodEnd: endOfMonth.toISOString()
    },
    subscription: business.subscription ? {
      status: business.subscription.status,
      currentPeriodEnd: business.subscription.currentPeriodEnd
    } : null,
    canIssueInvoice: issuedThisMonth < monthlyLimit
  }
}

export async function checkCanIssueInvoice(businessId) {
  const usage = await getBusinessPlanUsage(businessId)
  
  if (!usage.canIssueInvoice) {
    throw new ForbiddenError(
      `Monthly invoice limit reached (${usage.plan.monthlyInvoiceLimit}). Please upgrade your plan.`,
      { code: 'PLAN_LIMIT_REACHED', usage }
    )
  }

  return true
}

export async function incrementUsageCounter(businessId) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  await prisma.usageCounter.upsert({
    where: {
      businessId_periodStart: {
        businessId,
        periodStart: startOfMonth
      }
    },
    create: {
      businessId,
      periodStart: startOfMonth,
      periodEnd: endOfMonth,
      invoicesIssued: 1
    },
    update: {
      invoicesIssued: { increment: 1 }
    }
  })
}

async function getDefaultPlan() {
  return prisma.plan.findFirst({
    where: { name: 'Free' }
  })
}

// Admin functions
export async function listPlans() {
  return prisma.plan.findMany({
    orderBy: { monthlyInvoiceLimit: 'asc' }
  })
}

export async function createPlan(data) {
  return prisma.plan.create({
    data: {
      name: data.name,
      monthlyInvoiceLimit: data.monthlyInvoiceLimit,
      price: data.price || 0,
      currency: data.currency || 'INR',
      features: data.features || {},
      active: true
    }
  })
}

export async function updatePlan(planId, data) {
  return prisma.plan.update({
    where: { id: planId },
    data
  })
}

export async function assignPlanToBusiness(businessId, planId) {
  const plan = await prisma.plan.findUnique({
    where: { id: planId }
  })

  if (!plan) {
    throw new NotFoundError('Plan not found')
  }

  return prisma.business.update({
    where: { id: businessId },
    data: { planId }
  })
}

// Admin: List all businesses
export async function listBusinesses(filters = {}) {
  const { search, planId, limit = 50, offset = 0 } = filters

  const where = {
    ...(planId && { planId }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { owner: { phone: { contains: search } } }
      ]
    })
  }

  const [businesses, total] = await Promise.all([
    prisma.business.findMany({
      where,
      include: {
        owner: { select: { id: true, phone: true } },
        plan: true,
        _count: { select: { invoices: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    }),
    prisma.business.count({ where })
  ])

  return { businesses, total }
}

// Admin: Get business details
export async function getBusinessDetails(businessId) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      owner: { select: { id: true, phone: true, createdAt: true } },
      plan: true,
      subscription: true,
      _count: {
        select: {
          invoices: true,
          customers: true,
          products: true
        }
      }
    }
  })

  if (!business) {
    throw new NotFoundError('Business not found')
  }

  // Get usage stats
  const usage = await getBusinessPlanUsage(businessId)

  return {
    ...business,
    usage: usage.usage
  }
}
