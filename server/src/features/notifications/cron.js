import { prisma } from '../../common/prisma.js'
import { logger } from '../../common/logger.js'
import { emit } from './service.js'
import { cleanupOldNotifications } from './service.js'

// ============================================================================
// PLAN EXPIRY WARNINGS
// Runs daily — checks for subscriptions expiring within 7 days
// ============================================================================

async function checkPlanExpiryWarnings() {
  try {
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Find active subscriptions expiring within 7 days
    const expiringSubs = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        renewAt: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
      include: {
        plan: { select: { id: true, displayName: true, name: true } },
        businesses: {
          select: { id: true, ownerUserId: true },
          take: 1,
        },
      },
    })

    let warned = 0
    for (const sub of expiringSubs) {
      const business = sub.businesses[0]
      if (!business) continue

      const planName = sub.plan?.displayName || sub.plan?.name || 'Plan'
      const expiryDate = sub.renewAt
        ? sub.renewAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'soon'

      await emit('plan_expiring_soon', {
        userId: business.ownerUserId,
        businessId: business.id,
        variables: { planName, expiryDate },
        data: { action: 'navigate', route: '/plans', entityType: 'subscription', entityId: sub.id },
      })
      warned++
    }

    // Check for expired subscriptions (renewAt in the past, still marked ACTIVE)
    const expiredSubs = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        renewAt: { lt: now },
      },
      include: {
        plan: { select: { id: true, displayName: true, name: true } },
        businesses: {
          select: { id: true, ownerUserId: true },
          take: 1,
        },
      },
    })

    let expired = 0
    for (const sub of expiredSubs) {
      const business = sub.businesses[0]
      if (!business) continue

      const planName = sub.plan?.displayName || sub.plan?.name || 'Plan'

      await emit('plan_expired', {
        userId: business.ownerUserId,
        businessId: business.id,
        variables: { planName },
        data: { action: 'navigate', route: '/plans', entityType: 'subscription', entityId: sub.id },
      })

      // Mark subscription as expired
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' },
      })
      expired++
    }

    if (warned > 0 || expired > 0) {
      logger.info({ warned, expired }, '[Notification Cron] Plan expiry check completed')
    }
  } catch (err) {
    logger.error({ err: err.message }, '[Notification Cron] Plan expiry check failed')
  }
}

// ============================================================================
// NOTIFICATION CLEANUP
// Runs daily — removes notifications older than 90 days
// ============================================================================

async function runCleanup() {
  try {
    const result = await cleanupOldNotifications(90)
    if (result.deletedNotifications > 0) {
      logger.info(result, '[Notification Cron] Cleanup completed')
    }
  } catch (err) {
    logger.error({ err: err.message }, '[Notification Cron] Cleanup failed')
  }
}

// ============================================================================
// SCHEDULER
// Uses setInterval for simplicity — runs checks every 24 hours
// First run is 60 seconds after startup to avoid blocking boot
// ============================================================================

let intervalId = null

export function startNotificationCron() {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000

  // Run once shortly after startup
  setTimeout(async () => {
    logger.info('[Notification Cron] Running initial check')
    await checkPlanExpiryWarnings()
    await runCleanup()
  }, 60 * 1000) // 60 seconds after boot

  // Then run every 24 hours
  intervalId = setInterval(async () => {
    logger.info('[Notification Cron] Running scheduled check')
    await checkPlanExpiryWarnings()
    await runCleanup()
  }, TWENTY_FOUR_HOURS)

  logger.info('[Notification Cron] Scheduler started (24h interval)')
}

export function stopNotificationCron() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
    logger.info('[Notification Cron] Scheduler stopped')
  }
}
