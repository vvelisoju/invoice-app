import { authenticate, authenticateAdmin } from '../../common/auth.js'
import * as handlers from './handlers.js'

export default async function notificationRoutes(fastify) {
  // ── User routes (authenticated) ──────────────────────────────────────
  fastify.register(async (userRoutes) => {
    userRoutes.addHook('onRequest', authenticate)

    userRoutes.get('/', {
      schema: {
        description: 'List notifications for current user',
        tags: ['notifications'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'integer', minimum: 1, maximum: 100 },
            offset: { type: 'integer', minimum: 0 },
            unreadOnly: { type: 'string' },
          },
        },
      },
    }, handlers.listNotifications)

    userRoutes.get('/unread-count', {
      schema: {
        description: 'Get unread notification count',
        tags: ['notifications'],
      },
    }, handlers.getUnreadCount)

    userRoutes.post('/:id/read', {
      schema: {
        description: 'Mark a notification as read',
        tags: ['notifications'],
      },
    }, handlers.markAsRead)

    userRoutes.post('/read-all', {
      schema: {
        description: 'Mark all notifications as read',
        tags: ['notifications'],
      },
    }, handlers.markAllAsRead)

    userRoutes.post('/device-token', {
      schema: {
        description: 'Register FCM device token',
        tags: ['notifications'],
        body: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            platform: { type: 'string', enum: ['web', 'android', 'ios'] },
          },
          required: ['token', 'platform'],
        },
      },
    }, handlers.registerDeviceToken)

    userRoutes.delete('/device-token', {
      schema: {
        description: 'Remove device token',
        tags: ['notifications'],
        body: {
          type: 'object',
          properties: {
            token: { type: 'string' },
          },
        },
      },
    }, handlers.removeDeviceToken)
  })

  // ── Admin routes ─────────────────────────────────────────────────────
  fastify.register(async (adminRoutes) => {
    adminRoutes.addHook('onRequest', authenticateAdmin)

    adminRoutes.get('/', {
      schema: {
        description: 'List all notifications (admin)',
        tags: ['admin', 'notifications'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'integer', minimum: 1, maximum: 100 },
            offset: { type: 'integer', minimum: 0 },
            targetType: { type: 'string', enum: ['ALL', 'PLAN', 'BUSINESS', 'USER'] },
            templateKey: { type: 'string' },
          },
        },
      },
    }, handlers.adminListNotifications)

    adminRoutes.get('/templates', {
      schema: {
        description: 'List available notification templates',
        tags: ['admin', 'notifications'],
      },
    }, handlers.adminListTemplates)

    adminRoutes.get('/:id', {
      schema: {
        description: 'Get notification details with read stats',
        tags: ['admin', 'notifications'],
      },
    }, handlers.adminGetNotification)

    adminRoutes.post('/', {
      schema: {
        description: 'Send a custom notification',
        tags: ['admin', 'notifications'],
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            body: { type: 'string' },
            targetType: { type: 'string', enum: ['ALL', 'PLAN', 'BUSINESS', 'USER'] },
            targetId: { type: 'string' },
            data: { type: 'object' },
            type: { type: 'string', enum: ['IN_APP', 'PUSH', 'BOTH'] },
          },
          required: ['title', 'body', 'targetType'],
        },
      },
    }, handlers.adminSendNotification)
  }, { prefix: '/admin' })
}
