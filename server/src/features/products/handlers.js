import { listUnits, searchProducts, listProducts, createProduct, getProduct, updateProduct, deleteProduct } from './service.js'
import { checkCanCreateProduct } from '../plans/service.js'

export const handleListUnits = async (request, reply) => {
  const businessId = request.user.businessId
  const units = await listUnits(request.server.prisma, businessId)
  return reply.status(200).send({ data: units })
}

export const handleSearchProducts = async (request, reply) => {
  const businessId = request.user.businessId
  const { search } = request.query
  const products = await searchProducts(request.server.prisma, businessId, search)
  return reply.status(200).send(products)
}

export const handleListProducts = async (request, reply) => {
  const businessId = request.user.businessId
  const result = await listProducts(request.server.prisma, businessId, request.query)
  return reply.status(200).send(result)
}

export const handleCreateProduct = async (request, reply) => {
  const businessId = request.user.businessId
  await checkCanCreateProduct(businessId)
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
  return reply.status(200).send(product)
}

export const handleDeleteProduct = async (request, reply) => {
  const { id } = request.params
  const businessId = request.user.businessId
  const result = await deleteProduct(request.server.prisma, id, businessId)
  return reply.status(200).send(result)
}
