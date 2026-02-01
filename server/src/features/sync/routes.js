import { authenticate } from '../../common/auth.js'
import * as handlers from './handlers.js'

export default async function syncRoutes(fastify) {
  fastify.addHook('onRequest', authenticate)

  // Get delta changes since last sync
  fastify.get('/delta', {
    schema: {
      description: 'Get changes since last sync',
      tags: ['sync'],
      querystring: {
        type: 'object',
        properties: {
          lastSyncAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  }, handlers.getDelta)

  // Get full sync (initial sync)
  fastify.get('/full', {
    schema: {
      description: 'Get full data for initial sync',
      tags: ['sync']
    }
  }, handlers.getFullSync)

  // Process batch mutations
  fastify.post('/batch', {
    schema: {
      description: 'Process batch of offline mutations',
      tags: ['sync'],
      body: {
        type: 'object',
        properties: {
          mutations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                idempotencyKey: { type: 'string' },
                data: { type: 'object' }
              },
              required: ['id', 'type', 'data']
            }
          }
        },
        required: ['mutations']
      }
    }
  }, handlers.processBatch)
}
