import {
  createInvoice,
  updateInvoice,
  getInvoice,
  listInvoices,
  deleteInvoice,
  issueInvoice,
  updateInvoiceStatus
} from './service.js'

export const handleCreateInvoice = async (request, reply) => {
  const businessId = request.user.businessId
  const invoice = await createInvoice(request.server.prisma, businessId, request.body)
  return reply.status(201).send(invoice)
}

export const handleUpdateInvoice = async (request, reply) => {
  const { id } = request.params
  const businessId = request.user.businessId
  const invoice = await updateInvoice(request.server.prisma, id, businessId, request.body)
  return reply.status(200).send(invoice)
}

export const handleGetInvoice = async (request, reply) => {
  const { id } = request.params
  const businessId = request.user.businessId
  const invoice = await getInvoice(request.server.prisma, id, businessId)
  return reply.status(200).send(invoice)
}

export const handleListInvoices = async (request, reply) => {
  const businessId = request.user.businessId
  const result = await listInvoices(request.server.prisma, businessId, request.query)
  return reply.status(200).send(result)
}

export const handleDeleteInvoice = async (request, reply) => {
  const { id } = request.params
  const businessId = request.user.businessId
  const result = await deleteInvoice(request.server.prisma, id, businessId)
  return reply.status(200).send(result)
}

export const handleIssueInvoice = async (request, reply) => {
  const { id } = request.params
  const businessId = request.user.businessId
  const invoice = await issueInvoice(request.server.prisma, id, businessId, request.body)
  return reply.status(200).send(invoice)
}

export const handleUpdateStatus = async (request, reply) => {
  const { id } = request.params
  const businessId = request.user.businessId
  const { status } = request.body
  const invoice = await updateInvoiceStatus(request.server.prisma, id, businessId, status)
  return reply.status(200).send(invoice)
}
