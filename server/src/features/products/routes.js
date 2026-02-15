import { handleListUnits, handleSearchProducts, handleListProducts, handleCreateProduct, handleGetProduct, handleUpdateProduct, handleDeleteProduct, handleRestoreProduct, handleListDeletedProducts } from './handlers.js'
import { authMiddleware } from '../../common/auth.js'

export const productRoutes = async (fastify) => {
  fastify.addHook('preHandler', authMiddleware)

  fastify.get('/products/units', handleListUnits)

  fastify.get('/products/list', handleListProducts)

  fastify.get('/products', handleSearchProducts)

  fastify.post('/products', handleCreateProduct)

  // Static routes must come before parameterized routes
  fastify.get('/products/deleted', handleListDeletedProducts)

  fastify.get('/products/:id', handleGetProduct)

  fastify.patch('/products/:id/restore', handleRestoreProduct)

  fastify.patch('/products/:id', handleUpdateProduct)

  fastify.delete('/products/:id', handleDeleteProduct)
}
