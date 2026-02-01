import { searchProducts, createProduct, getProduct, updateProduct } from './service.js'

export const handleSearchProducts = async (request, reply) => {
  const businessId = request.user.businessId
  const { search } = request.query
  const products = await searchProducts(request.server.prisma, businessId, search)
  return reply.status(200).send(products)
}

export const handleCreateProduct = async (request, reply) => {
  const businessId = request.user.businessId
  const product = await createProduct(request.server.prisma, businessId, request.body)
  return reply.status(201).send(product)
}

export const handleGetProduct = async (request, reply) => {
  const { id } = request.params
  const businessId = request.user.businessId
  const product = await getProduct(request.server.prisma, id, businessId)
  return reply.status(200).send(product)
}

export const handleUpdateProduct = async (request, reply) => {
  const { id } = request.params
  const businessId = request.user.businessId
  const product = await updateProduct(request.server.prisma, id, businessId, request.body)
  return reply.status(200).send(customer)
}
