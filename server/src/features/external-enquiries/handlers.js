import * as service from './service.js'
import { createEnquirySchema, updateEnquirySchema, listEnquiriesSchema } from './validation.js'
import { ValidationError, NotFoundError } from '../../common/errors.js'

// ── Public endpoint (no auth) ──────────────────────────────────────────────

export async function handleCreateEnquiry(request, reply) {
  const parsed = createEnquirySchema.safeParse(request.body)
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0]?.message || 'Invalid data')
  }

  const enquiry = await service.createEnquiry(parsed.data)
  reply.status(201)
  return { data: enquiry }
}

// ── Admin endpoints (SUPER_ADMIN only) ─────────────────────────────────────

export async function handleListEnquiries(request, reply) {
  const parsed = listEnquiriesSchema.safeParse(request.query)
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0]?.message || 'Invalid filters')
  }

  const result = await service.listEnquiries(parsed.data)
  return result
}

export async function handleGetEnquiry(request, reply) {
  const { id } = request.params
  const enquiry = await service.getEnquiryById(id)
  if (!enquiry) throw new NotFoundError('Enquiry not found')
  return { data: enquiry }
}

export async function handleUpdateEnquiry(request, reply) {
  const { id } = request.params
  const parsed = updateEnquirySchema.safeParse(request.body)
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0]?.message || 'Invalid data')
  }

  const existing = await service.getEnquiryById(id)
  if (!existing) throw new NotFoundError('Enquiry not found')

  const enquiry = await service.updateEnquiry(id, parsed.data)
  return { data: enquiry }
}

export async function handleGetEnquiryStats(request, reply) {
  const stats = await service.getEnquiryStats()
  return { data: stats }
}
