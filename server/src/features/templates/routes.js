import { authenticate } from '../../common/auth.js'
import * as handlers from './handlers.js'

export default async function templateRoutes(fastify) {
  // List base templates (public)
  fastify.get('/base', {
    schema: {
      description: 'List all available base templates',
      tags: ['templates']
    }
  }, handlers.listTemplates)

  // Get base template details
  fastify.get('/base/:id', {
    schema: {
      description: 'Get base template details',
      tags: ['templates'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    }
  }, handlers.getTemplate)

  // Protected routes
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('onRequest', authenticate)

    // Get business template config
    protectedRoutes.get('/config', {
      schema: {
        description: 'Get current business template configuration',
        tags: ['templates']
      }
    }, handlers.getBusinessConfig)

    // Update business template config
    protectedRoutes.put('/config', {
      schema: {
        description: 'Update business template configuration',
        tags: ['templates'],
        body: {
          type: 'object',
          properties: {
            baseTemplateId: { type: 'string' },
            customConfig: { type: 'object' }
          }
        }
      }
    }, handlers.updateBusinessConfig)

    // Get template snapshot for invoice issuance
    protectedRoutes.get('/snapshot', {
      schema: {
        description: 'Get template snapshot for invoice issuance',
        tags: ['templates']
      }
    }, handlers.getSnapshot)
  })
}
