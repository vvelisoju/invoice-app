import * as notificationService from './service.js'

// ============================================================================
// USER ENDPOINTS
// ============================================================================

export async function listNotifications(request, reply) {
  const { limit, offset, unreadOnly } = request.query || {}
  const result = await notificationService.listForUser(
    request.user.userId,
    request.user.businessId,
    { limit, offset, unreadOnly: unreadOnly === 'true' || unreadOnly === true }
  )
  return { data: result }
}

export async function getUnreadCount(request, reply) {
  const count = await notificationService.getUnreadCount(
    request.user.userId,
    request.user.businessId
  )
  return { data: { count } }
}

export async function markAsRead(request, reply) {
  const { id } = request.params
  const read = await notificationService.markAsRead(request.user.userId, id)
  return { data: read }
}

export async function markAllAsRead(request, reply) {
  const result = await notificationService.markAllAsRead(
    request.user.userId,
    request.user.businessId
  )
  return { data: result }
}

export async function registerDeviceToken(request, reply) {
  const { token, platform } = request.body
  const deviceToken = await notificationService.registerDeviceToken(
    request.user.userId,
    token,
    platform
  )
  return { data: deviceToken }
}

export async function removeDeviceToken(request, reply) {
  const { token } = request.body || {}
  const result = await notificationService.removeDeviceToken(request.user.userId, token)
  return { data: result }
}

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

export async function adminListNotifications(request, reply) {
  const { limit, offset, targetType, templateKey } = request.query || {}
  const result = await notificationService.listAll({ limit, offset, targetType, templateKey })
  return { data: result }
}

export async function adminGetNotification(request, reply) {
  const { id } = request.params
  const notification = await notificationService.getDetails(id)
  return { data: notification }
}

export async function adminSendNotification(request, reply) {
  const notification = await notificationService.sendCustom(
    request.user.userId,
    request.body
  )
  return { data: notification }
}

export async function adminListTemplates(request, reply) {
  const templates = notificationService.listTemplates()
  return { data: templates }
}
