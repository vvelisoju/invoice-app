import { prisma } from '../../common/prisma.js'
import { logger } from '../../common/logger.js'
import { ForbiddenError, NotFoundError, ValidationError } from '../../common/errors.js'
import { getRazorpay, verifyRazorpaySignature } from '../../common/razorpay.js'
import { config } from '../../common/config.js'

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
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const usageCounter = await prisma.usageCounter.findUnique({
    where: {
      businessId_monthKey: {
        businessId,
        monthKey
      }
    }
  })

  // Count issued invoices this month
  const issuedThisMonth = usageCounter?.invoicesIssuedCount || await prisma.invoice.count({
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
  const entitlements = plan?.entitlements || {}
  const monthlyLimit = entitlements.monthlyInvoicesLimit || 10 // Default free plan limit

  return {
    plan: {
      id: plan?.id,
      name: plan?.displayName || plan?.name || 'Free',
      monthlyInvoiceLimit: monthlyLimit,
      entitlements
    },
    usage: {
      invoicesIssued: issuedThisMonth,
      invoicesRemaining: Math.max(0, monthlyLimit - issuedThisMonth),
      periodStart: startOfMonth.toISOString(),
      periodEnd: endOfMonth.toISOString()
    },
    subscription: business.subscription ? {
      status: business.subscription.status,
      renewAt: business.subscription.renewAt
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
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  await prisma.usageCounter.upsert({
    where: {
      businessId_monthKey: {
        businessId,
        monthKey
      }
    },
    create: {
      businessId,
      monthKey,
      invoicesIssuedCount: 1
    },
    update: {
      invoicesIssuedCount: { increment: 1 }
    }
  })
}

async function getDefaultPlan() {
  return prisma.plan.findFirst({
    where: { name: 'free' }
  })
}

// ============================================================================
// Razorpay Payment Flow
// ============================================================================

/**
 * Step 1: Create a Razorpay order for a plan subscription.
 * @param {string} billingPeriod - 'monthly' or 'yearly'
 */
export async function createSubscriptionOrder(businessId, planId, billingPeriod = 'yearly') {
  const plan = await prisma.plan.findUnique({ where: { id: planId } })
  if (!plan) throw new NotFoundError('Plan not found')
  if (!plan.active) throw new ValidationError('This plan is no longer available')

  const isYearly = billingPeriod === 'yearly'
  const price = isYearly ? Number(plan.priceYearly) : Number(plan.priceMonthly)

  if (!price || price <= 0) {
    throw new ValidationError('Cannot create an order for a free plan')
  }

  const razorpay = getRazorpay()
  const amountInPaise = Math.round(price * 100)

  let order
  try {
    order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `sub_${businessId.slice(0, 8)}_${Date.now()}`,
      notes: {
        businessId,
        planId,
        planName: plan.displayName || plan.name,
        billingPeriod
      }
    })
  } catch (err) {
    logger.error({ err: err.message, statusCode: err.statusCode, details: err.error }, '[Razorpay] Order creation failed')
    throw new ValidationError(`Payment gateway error: ${err.error?.description || err.message || 'Unable to create order'}`)
  }

  // Create a pending subscription record
  await prisma.subscription.create({
    data: {
      businessId,
      planId,
      status: 'PAST_DUE',
      razorpayOrderId: order.id,
      amount: price,
      currency: 'INR'
    }
  })

  return {
    razorpayOrderId: order.id,
    razorpayKeyId: config.razorpay.keyId,
    amount: amountInPaise,
    currency: 'INR',
    billingPeriod,
    planName: plan.displayName || plan.name
  }
}

/**
 * Step 2: Verify Razorpay payment and activate subscription.
 */
export async function verifySubscriptionPayment(businessId, { razorpayOrderId, razorpayPaymentId, razorpaySignature, planId }) {
  // Verify signature
  const isValid = verifyRazorpaySignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature
  })

  if (!isValid) {
    throw new ValidationError('Payment verification failed — invalid signature')
  }

  // Find the pending subscription
  const subscription = await prisma.subscription.findUnique({
    where: { razorpayOrderId }
  })

  if (!subscription) {
    throw new NotFoundError('Subscription order not found')
  }

  // Determine billing period from the amount paid vs plan prices
  const plan = await prisma.plan.findUnique({ where: { id: planId } })
  const isYearly = plan && Number(subscription.amount) === Number(plan.priceYearly)

  // Activate subscription + assign plan to business in a transaction
  const now = new Date()
  const renewAt = new Date(now)
  if (isYearly) {
    renewAt.setFullYear(renewAt.getFullYear() + 1)
  } else {
    renewAt.setMonth(renewAt.getMonth() + 1)
  }

  const [updatedSub] = await prisma.$transaction([
    prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        razorpayPaymentId,
        razorpaySignature,
        startDate: now,
        renewAt
      }
    }),
    prisma.business.update({
      where: { id: businessId },
      data: {
        planId,
        subscriptionId: subscription.id
      }
    })
  ])

  return updatedSub
}

export async function getPlanById(planId) {
  return prisma.plan.findUnique({ where: { id: planId } })
}

// Admin functions
export async function listPlans() {
  return prisma.plan.findMany({
    where: { active: true },
    orderBy: { priceMonthly: 'asc' }
  })
}

export async function adminListPlans() {
  return prisma.plan.findMany({
    orderBy: [{ active: 'desc' }, { priceMonthly: 'asc' }],
    include: {
      _count: { select: { businesses: true, subscriptions: true } }
    }
  })
}

export async function createPlan(data) {
  return prisma.plan.create({
    data: {
      name: data.name,
      displayName: data.displayName || data.name,
      description: data.description || '',
      entitlements: data.entitlements || {},
      priceMonthly: data.priceMonthly || null,
      priceYearly: data.priceYearly || null,
      active: true
    }
  })
}

export async function updatePlan(planId, data) {
  // Only allow updating specific fields
  const allowed = {}
  if (data.displayName !== undefined) allowed.displayName = data.displayName
  if (data.name !== undefined) allowed.name = data.name
  if (data.description !== undefined) allowed.description = data.description
  if (data.entitlements !== undefined) allowed.entitlements = data.entitlements
  if (data.priceMonthly !== undefined) allowed.priceMonthly = data.priceMonthly
  if (data.priceYearly !== undefined) allowed.priceYearly = data.priceYearly
  if (data.active !== undefined) allowed.active = data.active

  return prisma.plan.update({
    where: { id: planId },
    data: allowed
  })
}

export async function deletePlan(planId) {
  // Check if any businesses are using this plan
  const count = await prisma.business.count({ where: { planId } })
  if (count > 0) {
    throw new ValidationError(`Cannot delete plan: ${count} business(es) are currently using it. Deactivate it instead.`)
  }
  // Soft-delete by marking inactive
  return prisma.plan.update({
    where: { id: planId },
    data: { active: false }
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
