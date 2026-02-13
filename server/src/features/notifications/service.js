import { prisma } from '../../common/prisma.js'
import { logger } from '../../common/logger.js'
import { NotFoundError, ValidationError } from '../../common/errors.js'
import { resolveTemplate, listTemplates as listTemplateDefinitions } from './templates.js'
import { isFirebaseEnabled, sendPushToTokens } from '../../common/firebase.js'

// ============================================================================
// EMIT — Main entry point called by other services (fire-and-forget)
// ============================================================================

/**
 * Emit a notification from a predefined template.
 *
 * @param {string} templateKey - Key from NOTIFICATION_TEMPLATES
 * @param {object} context
 * @param {string}  [context.userId]     - Target user ID (for USER targetType)
 * @param {string}  [context.businessId] - Target business ID (for BUSINESS targetType)
 * @param {string}  [context.planId]     - Target plan ID (for PLAN targetType)
 * @param {object}  [context.variables]  - Template interpolation variables
 * @param {object}  [context.data]       - Deep-link / action metadata JSON
 * @param {string}  [context.type]       - Override delivery type (IN_APP | PUSH | BOTH)
 */
export async function emit(templateKey, context = {}) {
  try {
    const resolved = resolveTemplate(templateKey, context.variables || {})
    if (!resolved) {
      logger.warn({ templateKey }, '[Notification] Unknown template key, skipping')
      return null
    }

    // Determine target
    let targetType = context.targetType || resolved.targetType
    let targetId = null

    if (targetType === 'USER') {
      targetId = context.userId
    } else if (targetType === 'BUSINESS') {
      targetId = context.businessId
    } else if (targetType === 'PLAN') {
      targetId = context.planId
    }
    // ALL → targetId stays null

    // Dedup: skip if same templateKey+targetType+targetId was sent in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const existing = await prisma.notification.findFirst({
      where: {
        templateKey,
        targetType,
        targetId: targetId || undefined,
        sentAt: { gte: oneHourAgo },
      },
      select: { id: true },
    })

    if (existing) {
      logger.info({ templateKey, targetType, targetId }, '[Notification] Dedup — skipping duplicate within 1h')
      return existing
    }

    // Count targets
    const totalTargets = await countTargets(targetType, targetId)

    // Auto-upgrade to BOTH if Firebase is enabled and type not explicitly set
    const deliveryType = context.type || (isFirebaseEnabled() ? 'BOTH' : 'IN_APP')

    const notification = await prisma.notification.create({
      data: {
        templateKey,
        title: resolved.title,
        body: resolved.body,
        type: deliveryType,
        targetType,
        targetId,
        data: context.data || null,
        sentBy: null, // system-generated
        totalTargets,
      },
    })

    logger.info(
      { id: notification.id, templateKey, targetType, targetId, totalTargets },
      '[Notification] Emitted'
    )

    // Fire-and-forget push delivery
    if (deliveryType === 'PUSH' || deliveryType === 'BOTH') {
      deliverPush(notification).catch(() => {})
    }

    return notification
  } catch (err) {
    // Never fail the parent operation
    logger.error({ err: err.message, templateKey }, '[Notification] emit() failed')
    return null
  }
}

// ============================================================================
// SEND CUSTOM — Admin sends a custom notification
// ============================================================================

export async function sendCustom(adminUserId, payload) {
  const { title, body, targetType, targetId, data, type } = payload

  if (!title || !body) {
    throw new ValidationError('Title and body are required')
  }

  const validTargetTypes = ['ALL', 'PLAN', 'BUSINESS', 'USER']
  if (!validTargetTypes.includes(targetType)) {
    throw new ValidationError(`targetType must be one of: ${validTargetTypes.join(', ')}`)
  }

  if (targetType !== 'ALL' && !targetId) {
    throw new ValidationError(`targetId is required for targetType "${targetType}"`)
  }

  // Validate target exists
  if (targetType === 'USER') {
    const user = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } })
    if (!user) throw new NotFoundError('Target user not found')
  } else if (targetType === 'BUSINESS') {
    const biz = await prisma.business.findUnique({ where: { id: targetId }, select: { id: true } })
    if (!biz) throw new NotFoundError('Target business not found')
  } else if (targetType === 'PLAN') {
    const plan = await prisma.plan.findUnique({ where: { id: targetId }, select: { id: true } })
    if (!plan) throw new NotFoundError('Target plan not found')
  }

  const totalTargets = await countTargets(targetType, targetId)

  const deliveryType = type || (isFirebaseEnabled() ? 'BOTH' : 'IN_APP')

  const notification = await prisma.notification.create({
    data: {
      templateKey: 'custom',
      title,
      body,
      type: deliveryType,
      targetType,
      targetId: targetType === 'ALL' ? null : targetId,
      data: data || null,
      sentBy: adminUserId,
      totalTargets,
    },
  })

  logger.info(
    { id: notification.id, targetType, targetId, totalTargets, sentBy: adminUserId },
    '[Notification] Custom notification sent by admin'
  )

  // Fire-and-forget push delivery
  if (deliveryType === 'PUSH' || deliveryType === 'BOTH') {
    deliverPush(notification).catch(() => {})
  }

  return notification
}

// ============================================================================
// QUERY — User-facing
// ============================================================================

/**
 * List notifications visible to a user.
 * A user sees notifications where:
 *   targetType=ALL
 *   OR targetType=USER AND targetId=userId
 *   OR targetType=BUSINESS AND targetId=businessId
 *   OR targetType=PLAN AND targetId=planId
 */
export async function listForUser(userId, businessId, { limit = 30, offset = 0, unreadOnly = false } = {}) {
  // Resolve the user's planId
  let planId = null
  if (businessId) {
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { planId: true },
    })
    planId = biz?.planId || null
  }

  const targetConditions = [
    { targetType: 'ALL' },
    { targetType: 'USER', targetId: userId },
  ]
  if (businessId) {
    targetConditions.push({ targetType: 'BUSINESS', targetId: businessId })
  }
  if (planId) {
    targetConditions.push({ targetType: 'PLAN', targetId: planId })
  }

  const where = {
    OR: targetConditions,
    // Only show notifications from the last 90 days
    sentAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
  }

  if (unreadOnly) {
    where.reads = { none: { userId } }
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      select: {
        id: true,
        templateKey: true,
        title: true,
        body: true,
        type: true,
        targetType: true,
        data: true,
        sentAt: true,
        reads: {
          where: { userId },
          select: { id: true, readAt: true },
        },
      },
    }),
    prisma.notification.count({ where }),
  ])

  // Map reads to a simple isRead boolean
  const mapped = notifications.map((n) => ({
    id: n.id,
    templateKey: n.templateKey,
    title: n.title,
    body: n.body,
    type: n.type,
    targetType: n.targetType,
    data: n.data,
    sentAt: n.sentAt,
    isRead: n.reads.length > 0,
    readAt: n.reads[0]?.readAt || null,
  }))

  return { notifications: mapped, total, limit: parseInt(limit), offset: parseInt(offset) }
}

/**
 * Get unread notification count for a user.
 */
export async function getUnreadCount(userId, businessId) {
  let planId = null
  if (businessId) {
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { planId: true },
    })
    planId = biz?.planId || null
  }

  const targetConditions = [
    { targetType: 'ALL' },
    { targetType: 'USER', targetId: userId },
  ]
  if (businessId) {
    targetConditions.push({ targetType: 'BUSINESS', targetId: businessId })
  }
  if (planId) {
    targetConditions.push({ targetType: 'PLAN', targetId: planId })
  }

  const count = await prisma.notification.count({
    where: {
      OR: targetConditions,
      sentAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      reads: { none: { userId } },
    },
  })

  return count
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(userId, notificationId) {
  // Upsert to avoid duplicates
  const read = await prisma.notificationRead.upsert({
    where: {
      notificationId_userId: { notificationId, userId },
    },
    update: {},
    create: {
      notificationId,
      userId,
    },
  })

  return read
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllAsRead(userId, businessId) {
  let planId = null
  if (businessId) {
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { planId: true },
    })
    planId = biz?.planId || null
  }

  const targetConditions = [
    { targetType: 'ALL' },
    { targetType: 'USER', targetId: userId },
  ]
  if (businessId) {
    targetConditions.push({ targetType: 'BUSINESS', targetId: businessId })
  }
  if (planId) {
    targetConditions.push({ targetType: 'PLAN', targetId: planId })
  }

  // Find all unread notifications for this user
  const unread = await prisma.notification.findMany({
    where: {
      OR: targetConditions,
      sentAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      reads: { none: { userId } },
    },
    select: { id: true },
  })

  if (unread.length === 0) return { marked: 0 }

  // Batch create read records
  const data = unread.map((n) => ({
    notificationId: n.id,
    userId,
  }))

  // Use createMany with skipDuplicates to handle race conditions
  const result = await prisma.notificationRead.createMany({
    data,
    skipDuplicates: true,
  })

  return { marked: result.count }
}

// ============================================================================
// ADMIN QUERY
// ============================================================================

export async function listAll({ limit = 30, offset = 0, targetType, templateKey } = {}) {
  const where = {
    ...(targetType && { targetType }),
    ...(templateKey && { templateKey }),
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      select: {
        id: true,
        templateKey: true,
        title: true,
        body: true,
        type: true,
        targetType: true,
        targetId: true,
        data: true,
        sentBy: true,
        sentAt: true,
        totalTargets: true,
        delivered: true,
        failed: true,
        createdAt: true,
        _count: { select: { reads: true } },
      },
    }),
    prisma.notification.count({ where }),
  ])

  const mapped = notifications.map((n) => ({
    ...n,
    readCount: n._count.reads,
    _count: undefined,
  }))

  return { notifications: mapped, total, limit: parseInt(limit), offset: parseInt(offset) }
}

export async function getDetails(notificationId) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    include: {
      reads: {
        orderBy: { readAt: 'desc' },
        take: 50,
        include: {
          user: { select: { id: true, phone: true, name: true } },
        },
      },
      _count: { select: { reads: true } },
    },
  })

  if (!notification) throw new NotFoundError('Notification not found')

  return {
    ...notification,
    readCount: notification._count.reads,
  }
}

export { listTemplateDefinitions as listTemplates }

// ============================================================================
// PUSH DELIVERY
// ============================================================================

/**
 * Deliver push notification via FCM to all target users' devices.
 * Resolves target user IDs, fetches active tokens, sends, updates stats.
 */
async function deliverPush(notification) {
  try {
    if (!isFirebaseEnabled()) return

    // Resolve target user IDs
    const userIds = await resolveTargetUserIds(notification.targetType, notification.targetId)
    if (userIds.length === 0) return

    // Fetch active device tokens for these users
    const deviceTokens = await prisma.deviceToken.findMany({
      where: {
        userId: { in: userIds },
        isActive: true,
      },
      select: { token: true },
    })

    const tokens = deviceTokens.map((dt) => dt.token)
    if (tokens.length === 0) {
      logger.info({ notificationId: notification.id }, '[Push] No active device tokens for targets')
      return
    }

    // Build push payload
    const pushData = notification.data
      ? (typeof notification.data === 'object' ? notification.data : {})
      : {}

    const result = await sendPushToTokens(tokens, {
      title: notification.title,
      body: notification.body,
      data: { ...pushData, notificationId: notification.id },
    })

    // Update delivery stats
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        delivered: { increment: result.successCount },
        failed: { increment: result.failureCount },
      },
    })

    // Deactivate stale tokens
    if (result.staleTokens.length > 0) {
      await prisma.deviceToken.updateMany({
        where: { token: { in: result.staleTokens } },
        data: { isActive: false },
      })
      logger.info(
        { count: result.staleTokens.length, notificationId: notification.id },
        '[Push] Deactivated stale FCM tokens'
      )
    }

    logger.info(
      {
        notificationId: notification.id,
        tokensSent: tokens.length,
        success: result.successCount,
        failed: result.failureCount,
      },
      '[Push] Delivery complete'
    )
  } catch (err) {
    logger.error({ err: err.message, notificationId: notification.id }, '[Push] deliverPush failed')
  }
}

/**
 * Resolve target user IDs from notification targetType/targetId.
 */
async function resolveTargetUserIds(targetType, targetId) {
  if (targetType === 'USER') {
    return targetId ? [targetId] : []
  }
  if (targetType === 'BUSINESS') {
    const biz = await prisma.business.findUnique({
      where: { id: targetId },
      select: { ownerUserId: true },
    })
    return biz ? [biz.ownerUserId] : []
  }
  if (targetType === 'PLAN') {
    const businesses = await prisma.business.findMany({
      where: { planId: targetId },
      select: { ownerUserId: true },
    })
    return businesses.map((b) => b.ownerUserId)
  }
  if (targetType === 'ALL') {
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE', role: 'USER' },
      select: { id: true },
    })
    return users.map((u) => u.id)
  }
  return []
}

// ============================================================================
// DEVICE TOKENS
// ============================================================================

export async function registerDeviceToken(userId, token, platform) {
  if (!token || !platform) {
    throw new ValidationError('Token and platform are required')
  }

  const validPlatforms = ['web', 'android', 'ios']
  if (!validPlatforms.includes(platform)) {
    throw new ValidationError(`Platform must be one of: ${validPlatforms.join(', ')}`)
  }

  // Upsert: if token already exists, update userId and reactivate
  const deviceToken = await prisma.deviceToken.upsert({
    where: { token },
    update: { userId, platform, isActive: true },
    create: { userId, token, platform },
  })

  return deviceToken
}

export async function removeDeviceToken(userId, token) {
  if (token) {
    // Remove specific token
    await prisma.deviceToken.deleteMany({
      where: { userId, token },
    })
  } else {
    // Remove all tokens for user (e.g., on logout)
    await prisma.deviceToken.updateMany({
      where: { userId },
      data: { isActive: false },
    })
  }

  return { success: true }
}

// ============================================================================
// CLEANUP — Called by cron to remove old notifications
// ============================================================================

export async function cleanupOldNotifications(retentionDays = 90) {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)

  // Delete reads first (FK constraint), then notifications
  const [readResult, notifResult] = await Promise.all([
    prisma.notificationRead.deleteMany({
      where: { notification: { sentAt: { lt: cutoff } } },
    }),
    prisma.notification.deleteMany({
      where: { sentAt: { lt: cutoff } },
    }),
  ])

  if (notifResult.count > 0) {
    logger.info(
      { deletedNotifications: notifResult.count, deletedReads: readResult.count, retentionDays },
      '[Notification] Cleanup completed'
    )
  }

  return { deletedNotifications: notifResult.count, deletedReads: readResult.count }
}

// ============================================================================
// HELPERS
// ============================================================================

async function countTargets(targetType, targetId) {
  try {
    if (targetType === 'ALL') {
      return prisma.user.count({ where: { status: 'ACTIVE', role: 'USER' } })
    }
    if (targetType === 'USER') {
      return 1
    }
    if (targetType === 'BUSINESS') {
      // Count the business owner
      const biz = await prisma.business.findUnique({
        where: { id: targetId },
        select: { ownerUserId: true },
      })
      return biz ? 1 : 0
    }
    if (targetType === 'PLAN') {
      return prisma.business.count({ where: { planId: targetId } })
    }
    return 0
  } catch {
    return 0
  }
}
