import { searchCustomers, listCustomers, createCustomer, getCustomer, updateCustomer, deleteCustomer } from './service.js'

export const handleSearchCustomers = async (request, reply) => {
  const businessId = request.user.businessId
  const { search } = request.query
  const customers = await searchCustomers(request.server.prisma, businessId, search)
  return reply.status(200).send(customers)
}

export const handleListCustomers = async (request, reply) => {
  const businessId = request.user.businessId
  const result = await listCustomers(request.server.prisma, businessId, request.query)
  return reply.status(200).send(result)
}

export const handleCreateCustomer = async (request, reply) => {
  const businessId = request.user.businessId
  const customer = await createCustomer(request.server.prisma, businessId, request.body)
  return reply.status(201).send(customer)
}

export const handleGetCustomer = async (request, reply) => {
  const { id } = request.params
  const businessId = request.user.businessId
  const customer = await getCustomer(request.server.prisma, id, businessId)
  return reply.status(200).send(customer)
}

export const handleUpdateCustomer = async (request, reply) => {
  const { id } = request.params
  const businessId = request.user.businessId
  const customer = await updateCustomer(request.server.prisma, id, businessId, request.body)
  return reply.status(200).send(customer)
}

export const handleDeleteCustomer = async (request, reply) => {
  const { id } = request.params
  const businessId = request.user.businessId
  const result = await deleteCustomer(request.server.prisma, id, businessId)
  return reply.status(200).send(result)
}
