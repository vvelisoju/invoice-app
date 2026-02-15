import { ZodError } from 'zod'
import * as businessService from './service.js'
import {
  updateBusinessSchema,
  updateBusinessInfoSchema,
  updateGstSettingsSchema,
  updateBankSettingsSchema,
  updateInvoiceSettingsSchema
} from './validation.js'
import { ValidationError } from '../../common/errors.js'
import { uploadFile, deleteFile } from '../../common/storage.js'
import { config } from '../../common/config.js'

// Helper: validate with Zod and throw user-friendly ValidationError
function validateBody(schema, body, request) {
  try {
    return schema.parse(body)
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.errors.map(e => {
        const field = e.path.join('.')
        return field ? `${field}: ${e.message}` : e.message
      })
      request.log.warn({ zodErrors: err.errors, body }, 'Validation failed')
      throw new ValidationError(messages.length === 1 ? messages[0] : 'Please fix the following: ' + messages.join(', '), err.errors)
    }
    throw err
  }
}

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
  request.log.info({ validatedKeys: Object.keys(validated) }, 'Business update payload')
  const business = await businessService.updateBusinessProfile(request.businessId, validated)
  return { data: business }
}

// ============================================================================
// Section-specific handlers
// ============================================================================

export async function updateBusinessInfo(request, reply) {
  const validated = validateBody(updateBusinessInfoSchema, request.body, request)
  const business = await businessService.updateBusinessInfo(request.businessId, validated)
  return { data: business, message: 'Business information saved successfully' }
}

export async function updateGstSettings(request, reply) {
  const validated = validateBody(updateGstSettingsSchema, request.body, request)
  const business = await businessService.updateGstSettings(request.businessId, validated)
  return { data: business, message: 'GST settings saved successfully' }
}

export async function updateBankSettings(request, reply) {
  const validated = validateBody(updateBankSettingsSchema, request.body, request)
  const business = await businessService.updateBankSettings(request.businessId, validated)
  return { data: business, message: 'Bank & payment details saved successfully' }
}

export async function updateInvoiceSettings(request, reply) {
  const validated = validateBody(updateInvoiceSettingsSchema, request.body, request)
  const business = await businessService.updateInvoiceSettings(request.businessId, validated)
  return { data: business, message: 'Invoice settings saved successfully' }
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
  let logoUrl
  try {
    logoUrl = await uploadFile(fileBuffer, file.filename, `logos/${request.businessId}`)
  } catch (err) {
    request.log.error({ err }, 'GCS upload failed')
    throw new ValidationError(
      err.message?.includes('Could not load the default credentials')
        ? 'Cloud storage is not configured. Please set GCS_CLIENT_EMAIL and GCS_PRIVATE_KEY.'
        : `Failed to upload logo: ${err.message || 'Unknown error'}`
    )
  }

  // Update business profile with new logo URL
  const updated = await businessService.updateBusinessProfile(request.businessId, { logoUrl })

  return { data: { logoUrl: updated.logoUrl } }
}

export async function uploadSignature(request, reply) {
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

  // Delete old signature if exists
  const currentBusiness = await businessService.getBusinessProfile(request.businessId)
  if (currentBusiness.signatureUrl) {
    try {
      await deleteFile(currentBusiness.signatureUrl)
    } catch (err) {
      request.log.warn({ err }, 'Failed to delete old signature, continuing...')
    }
  }

  // Upload to GCS
  let signatureUrl
  try {
    signatureUrl = await uploadFile(fileBuffer, file.filename, `signatures/${request.businessId}`)
  } catch (err) {
    request.log.error({ err }, 'GCS upload failed')
    throw new ValidationError(
      err.message?.includes('Could not load the default credentials')
        ? 'Cloud storage is not configured. Please set GCS_CLIENT_EMAIL and GCS_PRIVATE_KEY.'
        : `Failed to upload signature: ${err.message || 'Unknown error'}`
    )
  }

  // Update business profile with new signature URL
  const updated = await businessService.updateBusinessProfile(request.businessId, { signatureUrl })

  return { data: { signatureUrl: updated.signatureUrl } }
}

export async function proxyImage(request, reply) {
  const { url } = request.query
  if (!url) {
    throw new ValidationError('Missing url parameter')
  }

  // Only allow proxying GCS URLs from our bucket for security
  const allowedPrefix = `https://storage.googleapis.com/${config.gcs.bucket}/`
  if (!url.startsWith(allowedPrefix)) {
    throw new ValidationError('URL not allowed')
  }

  const response = await fetch(url)
  if (!response.ok) {
    return reply.status(response.status).send({ error: 'Failed to fetch image' })
  }

  const contentType = response.headers.get('content-type') || 'image/png'
  const buffer = Buffer.from(await response.arrayBuffer())

  return reply
    .header('Content-Type', contentType)
    .header('Cache-Control', 'public, max-age=86400')
    .send(buffer)
}
