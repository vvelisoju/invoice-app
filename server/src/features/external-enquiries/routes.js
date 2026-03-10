import { authenticateAdmin } from '../../common/auth.js'
import * as handlers from './handlers.js'

// Public routes — no auth, for external website form submissions
export async function externalEnquiryPublicRoutes(fastify) {
  fastify.post('/external/enquiries', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      }
    },
    schema: {
      description: 'Submit an enquiry from an external website (public, no auth)',
      tags: ['external-enquiries'],
      body: {
        type: 'object',
        properties: {
          source: { type: 'string' },
          name: { type: 'string' },
          phone: { type: 'string' },
          interestedIn: { type: 'string' },
          message: { type: ['string', 'null'] },
          formType: { type: 'string' },
          extraData: { type: ['object', 'null'] },
        },
        required: []
      }
    }
  }, handlers.handleCreateEnquiry)
}

// Admin routes — SUPER_ADMIN only
export async function externalEnquiryAdminRoutes(fastify) {
  fastify.addHook('onRequest', authenticateAdmin)

  fastify.get('/external-enquiries', {
    schema: {
      description: 'List all external enquiries with filters',
      tags: ['admin', 'external-enquiries'],
      querystring: {
        type: 'object',
        properties: {
          source: { type: 'string' },
          status: { type: 'string' },
          search: { type: 'string' },
          dateFrom: { type: 'string', description: 'YYYY-MM-DD' },
          dateTo: { type: 'string', description: 'YYYY-MM-DD' },
          sortBy: { type: 'string', enum: ['createdAt', 'name', 'source', 'status'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          limit: { type: 'integer', minimum: 1, maximum: 100 },
          offset: { type: 'integer', minimum: 0 },
        }
      }
    }
  }, handlers.handleListEnquiries)

  fastify.get('/external-enquiries/stats', {
    schema: {
      description: 'Get external enquiry statistics',
      tags: ['admin', 'external-enquiries'],
    }
  }, handlers.handleGetEnquiryStats)

  fastify.get('/external-enquiries/:id', {
    schema: {
      description: 'Get a single external enquiry',
      tags: ['admin', 'external-enquiries'],
    }
  }, handlers.handleGetEnquiry)

  fastify.patch('/external-enquiries/:id', {
    schema: {
      description: 'Update external enquiry status/notes',
      tags: ['admin', 'external-enquiries'],
      body: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['new', 'contacted', 'converted', 'closed'] },
          notes: { type: 'string' },
        }
      }
    }
  }, handlers.handleUpdateEnquiry)
}
