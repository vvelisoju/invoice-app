import { handleSearchCustomers, handleCreateCustomer, handleGetCustomer, handleUpdateCustomer } from './handlers.js'
import { authMiddleware } from '../../common/auth.js'

export const customerRoutes = async (fastify) => {
  fastify.addHook('preHandler', authMiddleware)

  fastify.get('/customers', handleSearchCustomers)

  fastify.post('/customers', handleCreateCustomer)

  fastify.get('/customers/:id', handleGetCustomer)

  fastify.patch('/customers/:id', handleUpdateCustomer)
}
