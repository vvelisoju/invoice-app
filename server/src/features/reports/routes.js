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

  // Document-level report
  fastify.get('/documents', {
    schema: {
      description: 'Get document-level report with filters',
      tags: ['reports'],
      querystring: {
        type: 'object',
        properties: {
          dateFrom: { type: 'string', format: 'date' },
          dateTo: { type: 'string', format: 'date' },
          status: { type: 'string' },
          documentType: { type: 'string' }
        }
      }
    }
  }, handlers.getDocumentReport)

  // GSTR-3B Summary
  fastify.get('/gstr3b', {
    schema: {
      description: 'Get GSTR-3B summary for a month',
      tags: ['reports'],
      querystring: {
        type: 'object',
        required: ['month'],
        properties: {
          month: { type: 'string', pattern: '^\\d{4}-\\d{2}$' },
          documentType: { type: 'string' }
        }
      }
    }
  }, handlers.getGSTR3BSummary)

  // GSTR-1 B2B Invoices (Table 4A)
  fastify.get('/gstr1/b2b', {
    schema: {
      description: 'Get GSTR-1 B2B invoice details for a month',
      tags: ['reports'],
      querystring: {
        type: 'object',
        required: ['month'],
        properties: {
          month: { type: 'string', pattern: '^\\d{4}-\\d{2}$' },
          documentType: { type: 'string' }
        }
      }
    }
  }, handlers.getGSTR1B2B)

  // Sales Register
  fastify.get('/sales-register', {
    schema: {
      description: 'Get sales register with tax breakup',
      tags: ['reports'],
      querystring: {
        type: 'object',
        properties: {
          dateFrom: { type: 'string', format: 'date' },
          dateTo: { type: 'string', format: 'date' },
          documentType: { type: 'string' }
        }
      }
    }
  }, handlers.getSalesRegister)

  // GSTR-1 B2C Large (Table 5A)
  fastify.get('/gstr1/b2c-large', {
    schema: {
      description: 'Get GSTR-1 B2C Large interstate supplies',
      tags: ['reports'],
      querystring: {
        type: 'object',
        required: ['month'],
        properties: {
          month: { type: 'string', pattern: '^\\d{4}-\\d{2}$' },
          documentType: { type: 'string' }
        }
      }
    }
  }, handlers.getGSTR1B2CLarge)

  // GSTR-1 B2C Small (Table 7)
  fastify.get('/gstr1/b2c-small', {
    schema: {
      description: 'Get GSTR-1 B2C Small summary',
      tags: ['reports'],
      querystring: {
        type: 'object',
        required: ['month'],
        properties: {
          month: { type: 'string', pattern: '^\\d{4}-\\d{2}$' },
          documentType: { type: 'string' }
        }
      }
    }
  }, handlers.getGSTR1B2CSmall)

  // GSTR-1 Nil/Exempt (Table 8)
  fastify.get('/gstr1/nil-exempt', {
    schema: {
      description: 'Get GSTR-1 nil-rated, exempt, non-GST supplies',
      tags: ['reports'],
      querystring: {
        type: 'object',
        required: ['month'],
        properties: {
          month: { type: 'string', pattern: '^\\d{4}-\\d{2}$' },
          documentType: { type: 'string' }
        }
      }
    }
  }, handlers.getGSTR1NilExempt)

  // GSTR-1 Credit/Debit Notes (Table 9B)
  fastify.get('/gstr1/credit-notes', {
    schema: {
      description: 'Get GSTR-1 credit and debit notes',
      tags: ['reports'],
      querystring: {
        type: 'object',
        required: ['month'],
        properties: {
          month: { type: 'string', pattern: '^\\d{4}-\\d{2}$' }
        }
      }
    }
  }, handlers.getGSTR1CreditNotes)

  // GSTR-1 Document Summary (Table 13)
  fastify.get('/gstr1/doc-summary', {
    schema: {
      description: 'Get GSTR-1 document summary with number ranges',
      tags: ['reports'],
      querystring: {
        type: 'object',
        required: ['month'],
        properties: {
          month: { type: 'string', pattern: '^\\d{4}-\\d{2}$' }
        }
      }
    }
  }, handlers.getGSTR1DocSummary)

  // Customer-wise Sales Summary
  fastify.get('/customer-summary', {
    schema: {
      description: 'Get customer-wise sales summary',
      tags: ['reports'],
      querystring: {
        type: 'object',
        properties: {
          dateFrom: { type: 'string', format: 'date' },
          dateTo: { type: 'string', format: 'date' },
          documentType: { type: 'string' }
        }
      }
    }
  }, handlers.getCustomerSummary)

  // Tax Rate Report
  fastify.get('/tax-rate-report', {
    schema: {
      description: 'Get tax collected grouped by rate slab',
      tags: ['reports'],
      querystring: {
        type: 'object',
        properties: {
          dateFrom: { type: 'string', format: 'date' },
          dateTo: { type: 'string', format: 'date' }
        }
      }
    }
  }, handlers.getTaxRateReport)

  // Receivables Aging
  fastify.get('/receivables', {
    schema: {
      description: 'Get receivables aging report',
      tags: ['reports'],
      querystring: {
        type: 'object',
        properties: {
          asOfDate: { type: 'string', format: 'date' }
        }
      }
    }
  }, handlers.getReceivablesAging)

  // Customer Ledger
  fastify.get('/customer-ledger/:customerId', {
    schema: {
      description: 'Get transaction history for a specific customer',
      tags: ['reports'],
      params: {
        type: 'object',
        required: ['customerId'],
        properties: {
          customerId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          dateFrom: { type: 'string', format: 'date' },
          dateTo: { type: 'string', format: 'date' }
        }
      }
    }
  }, handlers.getCustomerLedger)

  // Annual Summary
  fastify.get('/annual-summary', {
    schema: {
      description: 'Get annual sales summary for a financial year',
      tags: ['reports'],
      querystring: {
        type: 'object',
        required: ['fy'],
        properties: {
          fy: { type: 'string', pattern: '^\\d{4}-\\d{2}$' },
          documentType: { type: 'string' }
        }
      }
    }
  }, handlers.getAnnualSummary)

  // GSTR-9 Data
  fastify.get('/gstr9', {
    schema: {
      description: 'Get GSTR-9 annual return data (outward supplies)',
      tags: ['reports'],
      querystring: {
        type: 'object',
        required: ['fy'],
        properties: {
          fy: { type: 'string', pattern: '^\\d{4}-\\d{2}$' },
          documentType: { type: 'string' }
        }
      }
    }
  }, handlers.getGSTR9Data)

  // GSTR-1 HSN Summary (Table 12)
  fastify.get('/gstr1/hsn-summary', {
    schema: {
      description: 'Get GSTR-1 HSN-wise summary of outward supplies',
      tags: ['reports'],
      querystring: {
        type: 'object',
        required: ['month'],
        properties: {
          month: { type: 'string', pattern: '^\\d{4}-\\d{2}$' }
        }
      }
    }
  }, handlers.getGSTR1HSNSummary)

  // CA Package — combined multi-report download
  fastify.get('/ca-package', {
    schema: {
      description: 'Get combined CA package with all GST reports for a month',
      tags: ['reports'],
      querystring: {
        type: 'object',
        required: ['month'],
        properties: {
          month: { type: 'string', pattern: '^\\d{4}-\\d{2}$' }
        }
      }
    }
  }, handlers.getCAPackage)

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
