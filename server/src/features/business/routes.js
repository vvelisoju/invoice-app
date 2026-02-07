import { authenticate } from '../../common/auth.js'
import * as handlers from './handlers.js'

export default async function businessRoutes(fastify) {
  // All routes require authentication
  fastify.addHook('onRequest', authenticate)

  // Get business profile
  fastify.get('/', {
    schema: {
      description: 'Get current business profile',
      tags: ['business'],
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'object', additionalProperties: true }
          }
        }
      }
    }
  }, handlers.getProfile)

  // Update business profile
  fastify.patch('/', {
    schema: {
      description: 'Update business profile',
      tags: ['business'],
      body: {
        type: 'object',
        additionalProperties: true
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'object', additionalProperties: true }
          }
        }
      }
    }
  }, handlers.updateProfile)

  // Upload business logo
  fastify.post('/logo', {
    schema: {
      description: 'Upload business logo image',
      tags: ['business'],
      consumes: ['multipart/form-data'],
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                logoUrl: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, handlers.uploadLogo)

  // Get business stats (dashboard)
  fastify.get('/stats', {
    schema: {
      description: 'Get business statistics',
      tags: ['business'],
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                totalInvoices: { type: 'integer' },
                paidCount: { type: 'integer' },
                paidAmount: { type: 'number' },
                unpaidCount: { type: 'integer' },
                unpaidAmount: { type: 'number' },
                draftCount: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  }, handlers.getStats)
}
