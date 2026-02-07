import { ZodError } from 'zod'
import * as businessService from './service.js'
import { updateBusinessSchema } from './validation.js'
import { ValidationError } from '../../common/errors.js'
import { uploadFile, deleteFile } from '../../common/storage.js'

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

export async function uploadLogo(request, reply) {
  const file = await request.file()

  if (!file) {
    throw new ValidationError('No file uploaded')
  }

  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  if (!allowedMimes.includes(file.mimetype)) {
    throw new ValidationError(`Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, GIF, WebP, SVG`)
  }

  // Read file into buffer
  const chunks = []
  for await (const chunk of file.file) {
    chunks.push(chunk)
  }
  const fileBuffer = Buffer.concat(chunks)

  // Check size (5MB)
  if (fileBuffer.length > 5 * 1024 * 1024) {
    throw new ValidationError('File size exceeds 5MB limit')
  }

  // Delete old logo if exists
  const currentBusiness = await businessService.getBusinessProfile(request.businessId)
  if (currentBusiness.logoUrl) {
    try {
      await deleteFile(currentBusiness.logoUrl)
    } catch (err) {
      request.log.warn({ err }, 'Failed to delete old logo, continuing...')
    }
  }

  // Upload to GCS
  const logoUrl = await uploadFile(fileBuffer, file.filename, `logos/${request.businessId}`)

  // Update business profile with new logo URL
  const updated = await businessService.updateBusinessProfile(request.businessId, { logoUrl })

  return { data: { logoUrl: updated.logoUrl } }
}
