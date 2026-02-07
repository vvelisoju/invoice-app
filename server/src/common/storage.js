import { Storage } from '@google-cloud/storage'
import { config } from './config.js'
import { v4 as uuidv4 } from 'uuid'

let storage = null
let bucket = null

function getStorage() {
  if (!storage) {
    const opts = { projectId: config.gcs.projectId }

    // Service-account credentials via env vars (recommended)
    if (config.gcs.clientEmail && config.gcs.privateKey) {
      opts.credentials = {
        client_email: config.gcs.clientEmail,
        private_key: config.gcs.privateKey.replace(/\\n/g, '\n'),
      }
    }
    // Otherwise falls back to GOOGLE_APPLICATION_CREDENTIALS (key-file path)
    // or Application Default Credentials (ADC) on GCP-hosted environments

    storage = new Storage(opts)
    bucket = storage.bucket(config.gcs.bucket)
  }
  return { storage, bucket }
}

/**
 * Upload a buffer to Google Cloud Storage.
 * @param {Buffer} fileBuffer - The file data
 * @param {string} originalName - Original filename for extension extraction
 * @param {string} folder - Folder prefix in the bucket (e.g., 'logos')
 * @returns {Promise<string>} Public URL of the uploaded file
 */
export async function uploadFile(fileBuffer, originalName, folder = 'logos') {
  const { bucket } = getStorage()

  const ext = originalName.split('.').pop()?.toLowerCase() || 'png'
  const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  if (!allowedExts.includes(ext)) {
    throw new Error(`File type .${ext} is not allowed. Allowed: ${allowedExts.join(', ')}`)
  }

  const fileName = `${folder}/${uuidv4()}.${ext}`
  const file = bucket.file(fileName)

  const contentTypeMap = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  }

  await file.save(fileBuffer, {
    metadata: {
      contentType: contentTypeMap[ext] || 'application/octet-stream',
      cacheControl: 'public, max-age=31536000',
    },
    public: true,
  })

  return `https://storage.googleapis.com/${config.gcs.bucket}/${fileName}`
}

/**
 * Delete a file from Google Cloud Storage by its public URL.
 * @param {string} publicUrl - The public URL of the file
 */
export async function deleteFile(publicUrl) {
  if (!publicUrl) return

  const { bucket } = getStorage()
  const bucketPrefix = `https://storage.googleapis.com/${config.gcs.bucket}/`

  if (!publicUrl.startsWith(bucketPrefix)) return

  const fileName = publicUrl.replace(bucketPrefix, '')
  try {
    await bucket.file(fileName).delete()
  } catch (err) {
    // Ignore 404 errors — file may already be deleted
    if (err.code !== 404) throw err
  }
}
