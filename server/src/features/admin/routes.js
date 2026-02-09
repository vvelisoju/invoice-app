import { authenticateAdmin } from '../../common/auth.js'
import * as handlers from './handlers.js'

export default async function adminRoutes(fastify) {
  // All admin routes require SUPER_ADMIN role
  fastify.addHook('onRequest', authenticateAdmin)

  // ── Dashboard ──────────────────────────────────────────────────────────
  fastify.get('/dashboard', {
    schema: {
      description: 'Get platform dashboard stats with optional date range filter',
      tags: ['admin'],
      querystring: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          to: { type: 'string', description: 'End date (YYYY-MM-DD)' }
        }
      }
    }
  }, handlers.getDashboardStats)

  // ── Business Management ────────────────────────────────────────────────
  fastify.get('/businesses', {
    schema: {
      description: 'List all businesses with filters',
      tags: ['admin', 'businesses'],
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          planId: { type: 'string' },
          status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'BANNED'] },
          gstEnabled: { type: 'string' },
          createdFrom: { type: 'string', description: 'YYYY-MM-DD' },
          createdTo: { type: 'string', description: 'YYYY-MM-DD' },
          sortBy: { type: 'string', enum: ['createdAt', 'name', 'updatedAt', 'invoices', 'customers'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          limit: { type: 'integer', minimum: 1, maximum: 100 },
          offset: { type: 'integer', minimum: 0 }
        }
      }
    }
  }, handlers.listBusinesses)

  fastify.get('/businesses/:id', {
    schema: {
      description: 'Get business details',
      tags: ['admin', 'businesses']
    }
  }, handlers.getBusinessDetails)

  fastify.patch('/businesses/:id', {
    schema: {
      description: 'Update business details (name, phone, email, GSTIN, etc.)',
      tags: ['admin', 'businesses'],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string' },
          address: { type: 'string' },
          gstin: { type: 'string' },
          stateCode: { type: 'string' },
          gstEnabled: { type: 'boolean' },
          invoicePrefix: { type: 'string' },
          nextInvoiceNumber: { type: 'integer' },
          defaultNotes: { type: 'string' },
          defaultTerms: { type: 'string' },
          bankName: { type: 'string' },
          accountNumber: { type: 'string' },
          ifscCode: { type: 'string' },
          upiId: { type: 'string' },
          signatureName: { type: 'string' },
          website: { type: 'string' }
        }
      }
    }
  }, handlers.updateBusinessDetails)

  fastify.patch('/businesses/:id/status', {
    schema: {
      description: 'Update business status (activate/suspend/ban)',
      tags: ['admin', 'businesses'],
      body: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'BANNED'] }
        },
        required: ['status']
      }
    }
  }, handlers.updateBusinessStatus)

  fastify.patch('/businesses/:id/plan', {
    schema: {
      description: 'Assign or change business plan',
      tags: ['admin', 'businesses'],
      body: {
        type: 'object',
        properties: {
          planId: { type: 'string' }
        },
        required: ['planId']
      }
    }
  }, handlers.updateBusinessPlan)

  // ── User Management ────────────────────────────────────────────────────
  fastify.get('/users', {
    schema: {
      description: 'List all users with filters',
      tags: ['admin', 'users'],
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          role: { type: 'string', enum: ['USER', 'SUPER_ADMIN'] },
          status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'BANNED'] },
          sortBy: { type: 'string', enum: ['createdAt', 'phone', 'name'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          limit: { type: 'integer', minimum: 1, maximum: 100 },
          offset: { type: 'integer', minimum: 0 }
        }
      }
    }
  }, handlers.listUsers)

  fastify.get('/users/:id', {
    schema: {
      description: 'Get user details',
      tags: ['admin', 'users']
    }
  }, handlers.getUserDetails)

  fastify.patch('/users/:id/role', {
    schema: {
      description: 'Update user role',
      tags: ['admin', 'users'],
      body: {
        type: 'object',
        properties: {
          role: { type: 'string', enum: ['USER', 'SUPER_ADMIN'] }
        },
        required: ['role']
      }
    }
  }, handlers.updateUserRole)

  fastify.patch('/users/:id/status', {
    schema: {
      description: 'Update user status (activate/suspend/ban)',
      tags: ['admin', 'users'],
      body: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'BANNED'] }
        },
        required: ['status']
      }
    }
  }, handlers.updateUserStatus)

  // ── Impersonation ──────────────────────────────────────────────────────
  fastify.post('/impersonate', {
    schema: {
      description: 'Get a token to impersonate a business user',
      tags: ['admin'],
      body: {
        type: 'object',
        properties: {
          businessId: { type: 'string' }
        },
        required: ['businessId']
      }
    }
  }, handlers.impersonateBusiness)

  // ── Platform Settings ──────────────────────────────────────────────────
  fastify.get('/settings', {
    schema: {
      description: 'Get all platform settings',
      tags: ['admin', 'settings']
    }
  }, handlers.getPlatformSettings)

  fastify.put('/settings', {
    schema: {
      description: 'Update a platform setting',
      tags: ['admin', 'settings'],
      body: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          value: {}
        },
        required: ['key', 'value']
      }
    }
  }, handlers.updatePlatformSetting)

  // ── Billing ───────────────────────────────────────────────────────────
  fastify.get('/billing/profile', {
    schema: {
      description: 'Get platform billing business profile',
      tags: ['admin', 'billing']
    }
  }, handlers.getBillingProfile)

  fastify.get('/billing/invoices', {
    schema: {
      description: 'List all subscription invoices',
      tags: ['admin', 'billing'],
      querystring: {
        type: 'object',
        properties: {
          businessId: { type: 'string' },
          status: { type: 'string' },
          billingPeriod: { type: 'string', enum: ['monthly', 'yearly'] },
          planId: { type: 'string' },
          search: { type: 'string' },
          dateFrom: { type: 'string', description: 'YYYY-MM-DD' },
          dateTo: { type: 'string', description: 'YYYY-MM-DD' },
          sortBy: { type: 'string', enum: ['createdAt', 'total', 'invoiceNumber'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          limit: { type: 'integer', minimum: 1, maximum: 200 },
          offset: { type: 'integer', minimum: 0 }
        }
      }
    }
  }, handlers.listSubscriptionInvoices)

  fastify.get('/billing/invoices/:id', {
    schema: {
      description: 'Get a single subscription invoice',
      tags: ['admin', 'billing']
    }
  }, handlers.getSubscriptionInvoice)

  // ── Audit Logs ─────────────────────────────────────────────────────────
  fastify.get('/audit-logs', {
    schema: {
      description: 'List audit logs with filters',
      tags: ['admin', 'audit'],
      querystring: {
        type: 'object',
        properties: {
          businessId: { type: 'string' },
          userId: { type: 'string' },
          entityType: { type: 'string' },
          action: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 100 },
          offset: { type: 'integer', minimum: 0 }
        }
      }
    }
  }, handlers.listAuditLogs)
}
