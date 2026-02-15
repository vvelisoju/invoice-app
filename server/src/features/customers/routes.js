import { handleSearchCustomers, handleListCustomers, handleCreateCustomer, handleGetCustomer, handleUpdateCustomer, handleDeleteCustomer, handleRestoreCustomer, handleListDeletedCustomers } from './handlers.js'
import { authMiddleware } from '../../common/auth.js'

export const customerRoutes = async (fastify) => {
  fastify.addHook('preHandler', authMiddleware)

  // List customers (paginated) — when limit/offset params present
  fastify.get('/customers/list', handleListCustomers)

  // Search customers (typeahead) — legacy flat array
  fastify.get('/customers', handleSearchCustomers)

  fastify.post('/customers', handleCreateCustomer)

  // Static routes must come before parameterized routes
  fastify.get('/customers/deleted', handleListDeletedCustomers)

  fastify.get('/customers/:id', handleGetCustomer)

  fastify.patch('/customers/:id/restore', handleRestoreCustomer)

  fastify.patch('/customers/:id', handleUpdateCustomer)

  fastify.delete('/customers/:id', handleDeleteCustomer)
}
