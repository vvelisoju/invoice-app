import * as taxRateService from './service.js'
import { createTaxRateSchema, updateTaxRateSchema } from './validation.js'

export async function handleListTaxRates(request, reply) {
  const businessId = request.user.businessId
  const taxRates = await taxRateService.listTaxRates(businessId)
  return { data: taxRates }
}

export async function handleCreateTaxRate(request, reply) {
  const businessId = request.user.businessId
  const validated = createTaxRateSchema.parse(request.body)
  const taxRate = await taxRateService.createTaxRate(businessId, validated)
  return reply.status(201).send({ data: taxRate })
}

export async function handleUpdateTaxRate(request, reply) {
  const businessId = request.user.businessId
  const { id } = request.params
  const validated = updateTaxRateSchema.parse(request.body)
  const taxRate = await taxRateService.updateTaxRate(businessId, id, validated)
  return { data: taxRate }
}

export async function handleDeleteTaxRate(request, reply) {
  const businessId = request.user.businessId
  const { id } = request.params
  try {
    await taxRateService.deleteTaxRate(businessId, id)
    return { success: true }
  } catch (err) {
    if (err.statusCode === 409) {
      return reply.status(409).send({ error: { message: err.message } })
    }
    throw err
  }
}
