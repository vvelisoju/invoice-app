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

  // Count issued invoices this month (fixed — not affected by deletes)
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

  // Count active customers and products (affected by deletes — user can delete to free up slots)
  const [customerCount, productCount] = await Promise.all([
    prisma.customer.count({ where: { businessId } }),
    prisma.productService.count({ where: { businessId } })
  ])

  const plan = business.plan || await getDefaultPlan()
  const entitlements = plan?.entitlements || {}
  const monthlyLimit = entitlements.monthlyInvoicesLimit || 10
  const customersLimit = entitlements.customersLimit || 20
  const productsLimit = entitlements.productsLimit || 20

  return {
    plan: {
      id: plan?.id,
      name: plan?.displayName || plan?.name || 'Free',
      monthlyInvoiceLimit: monthlyLimit,
      customersLimit,
      productsLimit,
      entitlements
    },
    usage: {
      invoicesIssued: issuedThisMonth,
      invoicesRemaining: Math.max(0, monthlyLimit - issuedThisMonth),
      customersCount: customerCount,
      customersRemaining: Math.max(0, customersLimit - customerCount),
      productsCount: productCount,
      productsRemaining: Math.max(0, productsLimit - productCount),
      periodStart: startOfMonth.toISOString(),
      periodEnd: endOfMonth.toISOString()
    },
    subscription: business.subscription ? {
      id: business.subscription.id,
      status: business.subscription.status,
      billingPeriod: business.subscription.billingPeriod,
      autoRenew: business.subscription.autoRenew,
      startDate: business.subscription.startDate,
      renewAt: business.subscription.renewAt,
      cancelledAt: business.subscription.cancelledAt,
      cancelledReason: business.subscription.cancelledReason,
      amount: business.subscription.amount,
    } : null,
    canIssueInvoice: issuedThisMonth < monthlyLimit,
    canCreateCustomer: customerCount < customersLimit,
    canCreateProduct: productCount < productsLimit
  }
}

export async function checkCanIssueInvoice(businessId) {
  const usage = await getBusinessPlanUsage(businessId)
  
  if (!usage.canIssueInvoice) {
    throw new ForbiddenError(
      `Monthly invoice limit reached (${usage.plan.monthlyInvoiceLimit}). Please upgrade your plan.`,
      { code: 'PLAN_LIMIT_REACHED', resourceType: 'invoice', usage }
    )
  }

  return true
}

export async function checkCanCreateCustomer(businessId) {
  const usage = await getBusinessPlanUsage(businessId)

  if (!usage.canCreateCustomer) {
    throw new ForbiddenError(
      `Customer limit reached (${usage.plan.customersLimit}). Delete unused customers or upgrade your plan.`,
      { code: 'PLAN_LIMIT_REACHED', resourceType: 'customer', usage }
    )
  }

  return true
}

export async function checkCanCreateProduct(businessId) {
  const usage = await getBusinessPlanUsage(businessId)

  if (!usage.canCreateProduct) {
    throw new ForbiddenError(
      `Product limit reached (${usage.plan.productsLimit}). Delete unused products or upgrade your plan.`,
      { code: 'PLAN_LIMIT_REACHED', resourceType: 'product', usage }
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
 * Clean up stale PAST_DUE subscription records (abandoned checkouts).
 * Called before creating a new order to prevent record buildup.
 */
async function cleanupStalePendingOrders(businessId) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  await prisma.subscription.deleteMany({
    where: {
      businessId,
      status: 'PAST_DUE',
      razorpayPaymentId: null,
      createdAt: { lt: oneHourAgo }
    }
  })
}

/**
 * Step 1: Create a Razorpay order for a plan subscription.
 * Handles existing active subscriptions (upgrade/downgrade/renewal).
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

  // Clean up abandoned checkout records
  await cleanupStalePendingOrders(businessId)

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
      currency: 'INR',
      billingPeriod
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
 * Cancels any previous active subscription for this business.
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

  if (subscription.status === 'ACTIVE') {
    // Already activated (e.g. via webhook) — return as-is
    return subscription
  }

  // Determine billing period — use stored value, fallback to amount comparison
  const plan = await prisma.plan.findUnique({ where: { id: planId } })
  const storedPeriod = subscription.billingPeriod
  const isYearly = storedPeriod
    ? storedPeriod === 'yearly'
    : (plan && Number(subscription.amount) === Number(plan.priceYearly))

  // Activate subscription + assign plan to business in a transaction
  const now = new Date()
  const renewAt = new Date(now)
  if (isYearly) {
    renewAt.setFullYear(renewAt.getFullYear() + 1)
  } else {
    renewAt.setMonth(renewAt.getMonth() + 1)
  }

  // Cancel any previous active subscription for this business
  const previousSub = await prisma.subscription.findFirst({
    where: {
      businessId,
      status: 'ACTIVE',
      id: { not: subscription.id }
    }
  })

  const txOps = [
    prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        razorpayPaymentId,
        razorpaySignature,
        billingPeriod: isYearly ? 'yearly' : 'monthly',
        autoRenew: true,
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
  ]

  // Mark old subscription as cancelled if upgrading/changing
  if (previousSub) {
    txOps.push(
      prisma.subscription.update({
        where: { id: previousSub.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: now,
          cancelledReason: 'plan_changed',
          autoRenew: false
        }
      })
    )
  }

  const [updatedSub] = await prisma.$transaction(txOps)

  return updatedSub
}

// ============================================================================
// Subscription Management
// ============================================================================

/**
 * Get detailed subscription info for a business (user-facing).
 */
export async function getSubscriptionDetails(businessId) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      plan: true,
      subscription: true
    }
  })

  if (!business) throw new NotFoundError('Business not found')

  const sub = business.subscription
  if (!sub) {
    return {
      hasSubscription: false,
      plan: business.plan ? {
        id: business.plan.id,
        name: business.plan.displayName || business.plan.name,
      } : null
    }
  }

  // Check if subscription is effectively expired
  const isExpired = sub.status === 'ACTIVE' && sub.renewAt && new Date(sub.renewAt) < new Date()

  return {
    hasSubscription: true,
    subscription: {
      id: sub.id,
      status: isExpired ? 'EXPIRED' : sub.status,
      billingPeriod: sub.billingPeriod,
      autoRenew: sub.autoRenew,
      amount: sub.amount,
      currency: sub.currency,
      startDate: sub.startDate,
      renewAt: sub.renewAt,
      cancelledAt: sub.cancelledAt,
      cancelledReason: sub.cancelledReason,
    },
    plan: business.plan ? {
      id: business.plan.id,
      name: business.plan.displayName || business.plan.name,
      priceMonthly: business.plan.priceMonthly,
      priceYearly: business.plan.priceYearly,
    } : null
  }
}

/**
 * Cancel a subscription. End-of-period cancellation (industry standard).
 * The subscription stays active until renewAt, then expires.
 */
export async function cancelSubscription(businessId, reason = 'user_requested') {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { subscription: true }
  })

  if (!business) throw new NotFoundError('Business not found')
  if (!business.subscription) throw new ValidationError('No active subscription to cancel')

  const sub = business.subscription
  if (sub.status === 'CANCELLED' || sub.status === 'EXPIRED') {
    throw new ValidationError('Subscription is already cancelled or expired')
  }

  // End-of-period cancellation: mark autoRenew=false, keep ACTIVE until renewAt
  const updatedSub = await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      autoRenew: false,
      cancelledAt: new Date(),
      cancelledReason: reason
    }
  })

  logger.info({ businessId, subscriptionId: sub.id, reason }, '[Subscription] Cancelled (end-of-period)')

  return updatedSub
}

/**
 * Process expired subscriptions. Called by cron job.
 * Finds ACTIVE subscriptions past their renewAt date with autoRenew=false,
 * marks them EXPIRED, and downgrades the business to the free plan.
 */
export async function processExpiredSubscriptions() {
  const now = new Date()

  // Find subscriptions that are past renewal date
  const expiredSubs = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      renewAt: { lt: now },
      autoRenew: false
    },
    include: {
      businesses: { select: { id: true } }
    }
  })

  if (expiredSubs.length === 0) return { processed: 0 }

  const freePlan = await getDefaultPlan()
  let processed = 0

  for (const sub of expiredSubs) {
    try {
      const txOps = [
        prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'EXPIRED' }
        })
      ]

      // Downgrade all businesses linked to this subscription to free plan
      for (const biz of sub.businesses) {
        txOps.push(
          prisma.business.update({
            where: { id: biz.id },
            data: {
              planId: freePlan?.id || null,
              subscriptionId: null
            }
          })
        )
      }

      await prisma.$transaction(txOps)
      processed++
      logger.info({ subscriptionId: sub.id }, '[Subscription] Expired and downgraded to free')
    } catch (err) {
      logger.error({ subscriptionId: sub.id, err: err.message }, '[Subscription] Failed to process expiry')
    }
  }

  // Also expire subscriptions that are past renewal with autoRenew=true
  // but have been past due for more than 7 days (grace period)
  const gracePeriodEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const overdueAutoRenewSubs = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      renewAt: { lt: gracePeriodEnd },
      autoRenew: true
    },
    include: {
      businesses: { select: { id: true } }
    }
  })

  for (const sub of overdueAutoRenewSubs) {
    try {
      const txOps = [
        prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: 'EXPIRED',
            autoRenew: false,
            cancelledReason: 'expired'
          }
        })
      ]

      for (const biz of sub.businesses) {
        txOps.push(
          prisma.business.update({
            where: { id: biz.id },
            data: {
              planId: freePlan?.id || null,
              subscriptionId: null
            }
          })
        )
      }

      await prisma.$transaction(txOps)
      processed++
      logger.info({ subscriptionId: sub.id }, '[Subscription] Auto-renew expired after grace period')
    } catch (err) {
      logger.error({ subscriptionId: sub.id, err: err.message }, '[Subscription] Failed to process overdue expiry')
    }
  }

  return { processed }
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
