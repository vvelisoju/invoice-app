import * as businessService from './service.js'
import { updateBusinessSchema } from './validation.js'

export async function getProfile(request, reply) {
  const business = await businessService.getBusinessProfile(request.businessId)
  return { data: business }
}

export async function updateProfile(request, reply) {
  const validated = updateBusinessSchema.parse(request.body)
  const business = await businessService.updateBusinessProfile(request.businessId, validated)
  return { data: business }
}

export async function getStats(request, reply) {
  const stats = await businessService.getBusinessStats(request.businessId)
  return { data: stats }
}
