import { handleListUnits, handleSearchProducts, handleListProducts, handleCreateProduct, handleGetProduct, handleUpdateProduct, handleDeleteProduct } from './handlers.js'
import { authMiddleware } from '../../common/auth.js'

export const productRoutes = async (fastify) => {
  fastify.addHook('preHandler', authMiddleware)

  fastify.get('/products/units', handleListUnits)

  fastify.get('/products/list', handleListProducts)

  fastify.get('/products', handleSearchProducts)

  fastify.post('/products', handleCreateProduct)

  fastify.get('/products/:id', handleGetProduct)

  fastify.patch('/products/:id', handleUpdateProduct)

  fastify.delete('/products/:id', handleDeleteProduct)
}
