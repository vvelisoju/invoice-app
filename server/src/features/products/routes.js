import { handleSearchProducts, handleCreateProduct, handleGetProduct, handleUpdateProduct } from './handlers.js'
import { authMiddleware } from '../../common/auth.js'

export const productRoutes = async (fastify) => {
  fastify.addHook('preHandler', authMiddleware)

  fastify.get('/products', handleSearchProducts)

  fastify.post('/products', handleCreateProduct)

  fastify.get('/products/:id', handleGetProduct)

  fastify.patch('/products/:id', handleUpdateProduct)
}
