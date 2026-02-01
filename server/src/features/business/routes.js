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
            data: { type: 'object' }
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
        properties: {
          name: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string' },
          address: { type: 'string' },
          logoUrl: { type: 'string' },
          gstEnabled: { type: 'boolean' },
          gstin: { type: 'string' },
          stateCode: { type: 'string' },
          defaultTaxRate: { type: 'number' },
          bankName: { type: 'string' },
          accountNumber: { type: 'string' },
          ifscCode: { type: 'string' },
          upiId: { type: 'string' },
          signatureUrl: { type: 'string' },
          signatureName: { type: 'string' },
          invoicePrefix: { type: 'string' },
          nextInvoiceNumber: { type: 'integer' },
          defaultNotes: { type: 'string' },
          defaultTerms: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'object' }
          }
        }
      }
    }
  }, handlers.updateProfile)

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
