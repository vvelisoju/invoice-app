import { authenticate } from '../../common/auth.js'
import * as handlers from './handlers.js'

export default async function reportsRoutes(fastify) {
  fastify.addHook('onRequest', authenticate)

  // Invoice summary
  fastify.get('/summary', {
    schema: {
      description: 'Get invoice summary with totals',
      tags: ['reports'],
      querystring: {
        type: 'object',
        properties: {
          dateFrom: { type: 'string', format: 'date' },
          dateTo: { type: 'string', format: 'date' }
        }
      }
    }
  }, handlers.getInvoiceSummary)

  // GST summary
  fastify.get('/gst', {
    schema: {
      description: 'Get GST summary with breakup',
      tags: ['reports'],
      querystring: {
        type: 'object',
        properties: {
          dateFrom: { type: 'string', format: 'date' },
          dateTo: { type: 'string', format: 'date' }
        }
      }
    }
  }, handlers.getGSTSummary)

  // Monthly trend
  fastify.get('/trend', {
    schema: {
      description: 'Get monthly invoice trend',
      tags: ['reports'],
      querystring: {
        type: 'object',
        properties: {
          months: { type: 'integer', minimum: 1, maximum: 12, default: 6 }
        }
      }
    }
  }, handlers.getMonthlyTrend)
}
