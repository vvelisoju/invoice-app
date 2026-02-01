import {
  handleCreateInvoice,
  handleUpdateInvoice,
  handleGetInvoice,
  handleListInvoices,
  handleDeleteInvoice,
  handleIssueInvoice,
  handleUpdateStatus
} from './handlers.js'
import { authMiddleware } from '../../common/auth.js'

export const invoiceRoutes = async (fastify) => {
  // All invoice routes require authentication
  fastify.addHook('preHandler', authMiddleware)

  // List invoices
  fastify.get('/invoices', handleListInvoices)

  // Create invoice
  fastify.post('/invoices', handleCreateInvoice)

  // Get invoice
  fastify.get('/invoices/:id', handleGetInvoice)

  // Update invoice
  fastify.patch('/invoices/:id', handleUpdateInvoice)

  // Delete invoice
  fastify.delete('/invoices/:id', handleDeleteInvoice)

  // Issue invoice (mark as issued with template snapshot)
  fastify.post('/invoices/:id/issue', handleIssueInvoice)

  // Update invoice status
  fastify.patch('/invoices/:id/status', handleUpdateStatus)
}
