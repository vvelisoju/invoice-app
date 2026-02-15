import { authenticate, authenticateAdmin } from '../../common/auth.js'
import * as handlers from './handlers.js'
import { handleWebhook } from './webhookHandler.js'

export default async function planRoutes(fastify) {
  // Razorpay webhook (unauthenticated — verified via signature)
  // Encapsulated in its own context to override content type parser for raw body access
  fastify.register(async (webhookCtx) => {
    webhookCtx.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
      req.rawBody = body
      try {
        done(null, JSON.parse(body))
      } catch (err) {
        done(err)
      }
    })

    webhookCtx.post('/webhook/razorpay', {
      schema: {
        description: 'Razorpay webhook endpoint for payment events',
        tags: ['webhooks'],
        hide: true
      }
    }, handleWebhook)
  })

  // User routes (authenticated)
  fastify.register(async (userRoutes) => {
    userRoutes.addHook('onRequest', authenticate)

    // Get current plan and usage
    userRoutes.get('/usage', {
      schema: {
        description: 'Get current plan and usage for the business',
        tags: ['plans']
      }
    }, handlers.getUsage)

    // List available plans
    userRoutes.get('/', {
      schema: {
        description: 'List all available plans',
        tags: ['plans']
      }
    }, handlers.listPlans)

    // Create Razorpay order for plan subscription
    userRoutes.post('/create-order', {
      schema: {
        description: 'Create a Razorpay order for subscribing to a plan',
        tags: ['plans'],
        body: {
          type: 'object',
          properties: {
            planId: { type: 'string' },
            billingPeriod: { type: 'string', enum: ['monthly', 'yearly'] }
          },
          required: ['planId']
        }
      }
    }, handlers.createOrder)

    // Verify Razorpay payment and activate subscription
    userRoutes.post('/verify-payment', {
      schema: {
        description: 'Verify Razorpay payment signature and activate subscription',
        tags: ['plans'],
        body: {
          type: 'object',
          properties: {
            razorpayOrderId: { type: 'string' },
            razorpayPaymentId: { type: 'string' },
            razorpaySignature: { type: 'string' },
            planId: { type: 'string' }
          },
          required: ['razorpayOrderId', 'razorpayPaymentId', 'razorpaySignature', 'planId']
        }
      }
    }, handlers.verifyPayment)

    // Get subscription details
    userRoutes.get('/subscription', {
      schema: {
        description: 'Get current subscription details for the business',
        tags: ['plans']
      }
    }, handlers.getSubscriptionDetails)

    // Cancel subscription (end-of-period)
    userRoutes.post('/cancel-subscription', {
      schema: {
        description: 'Cancel the current subscription (takes effect at end of billing period)',
        tags: ['plans'],
        body: {
          type: 'object',
          properties: {
            reason: { type: 'string' }
          }
        }
      }
    }, handlers.cancelSubscription)

    // List subscription invoices for the current business
    userRoutes.get('/billing-history', {
      schema: {
        description: 'Get subscription invoices for the current business',
        tags: ['plans']
      }
    }, handlers.getBillingHistory)
  })

  // Admin routes
  fastify.register(async (adminRoutes) => {
    adminRoutes.addHook('onRequest', authenticateAdmin)

    // List all plans (including inactive) for admin
    adminRoutes.get('/', {
      schema: {
        description: 'List all plans including inactive (admin only)',
        tags: ['admin', 'plans']
      }
    }, handlers.adminListPlans)

    // Create plan
    adminRoutes.post('/', {
      schema: {
        description: 'Create a new plan (admin only)',
        tags: ['admin', 'plans'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            displayName: { type: 'string' },
            description: { type: 'string' },
            entitlements: { type: 'object' },
            priceMonthly: { type: ['number', 'null'] },
            priceYearly: { type: ['number', 'null'] },
            active: { type: 'boolean' }
          },
          required: ['name']
        }
      }
    }, handlers.createPlan)

    // Update plan
    adminRoutes.patch('/:id', {
      schema: {
        description: 'Update a plan (admin only)',
        tags: ['admin', 'plans']
      }
    }, handlers.updatePlan)

    // Delete (deactivate) plan
    adminRoutes.delete('/:id', {
      schema: {
        description: 'Deactivate a plan (admin only)',
        tags: ['admin', 'plans']
      }
    }, handlers.deletePlan)

    // List businesses
    adminRoutes.get('/businesses', {
      schema: {
        description: 'List all businesses (admin only)',
        tags: ['admin'],
        querystring: {
          type: 'object',
          properties: {
            search: { type: 'string' },
            planId: { type: 'string' },
            limit: { type: 'integer' },
            offset: { type: 'integer' }
          }
        }
      }
    }, handlers.listBusinesses)

    // Get business details
    adminRoutes.get('/businesses/:id', {
      schema: {
        description: 'Get business details (admin only)',
        tags: ['admin']
      }
    }, handlers.getBusinessDetails)

    // Assign plan to business
    adminRoutes.post('/assign', {
      schema: {
        description: 'Assign a plan to a business (admin only)',
        tags: ['admin', 'plans'],
        body: {
          type: 'object',
          properties: {
            businessId: { type: 'string' },
            planId: { type: 'string' }
          },
          required: ['businessId', 'planId']
        }
      }
    }, handlers.assignPlan)
  }, { prefix: '/admin' })
}
