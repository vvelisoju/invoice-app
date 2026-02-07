import { ZodError } from 'zod'
import * as businessService from './service.js'
import { updateBusinessSchema } from './validation.js'
import { ValidationError } from '../../common/errors.js'

export async function getProfile(request, reply) {
  const business = await businessService.getBusinessProfile(request.businessId)
  return { data: business }
}

export async function updateProfile(request, reply) {
  let validated
  try {
    validated = updateBusinessSchema.parse(request.body)
  } catch (err) {
    if (err instanceof ZodError) {
      request.log.error({ zodErrors: err.errors, body: request.body }, 'Zod validation failed')
      throw new ValidationError('Validation failed', err.errors)
    }
    throw err
  }
  const business = await businessService.updateBusinessProfile(request.businessId, validated)
  return { data: business }
}

export async function getStats(request, reply) {
  const stats = await businessService.getBusinessStats(request.businessId)
  return { data: stats }
}
