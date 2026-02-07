import { authenticate } from '../../common/auth.js'
import * as handlers from './handlers.js'

export default async function taxRateRoutes(fastify) {
  fastify.addHook('onRequest', authenticate)

  // List all tax rates for business
  fastify.get('/', handlers.handleListTaxRates)

  // Create a new tax rate
  fastify.post('/', handlers.handleCreateTaxRate)

  // Update a tax rate
  fastify.patch('/:id', handlers.handleUpdateTaxRate)

  // Delete a tax rate
  fastify.delete('/:id', handlers.handleDeleteTaxRate)
}
