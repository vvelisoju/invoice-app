import dotenv from 'dotenv'

dotenv.config()

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  database: {
    url: process.env.DATABASE_URL
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '180d'
  },
  sms: {
    apiKey: process.env.SMS_PROVIDER_API_KEY,
    url: process.env.SMS_PROVIDER_URL,
    provider: process.env.SMS_PROVIDER || 'console',
    apiSecret: process.env.SMS_API_SECRET,
    springEdgeApiKey: process.env.SPRING_EDGE_API_KEY_ID,
    springEdgeSender: process.env.SPRING_EDGE_SENDER || 'CODVEL'
  },
  storage: {
    bucket: process.env.PDF_STORAGE_BUCKET,
    region: process.env.PDF_STORAGE_REGION,
    accessKey: process.env.PDF_STORAGE_ACCESS_KEY,
    secretKey: process.env.PDF_STORAGE_SECRET_KEY
  },
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
    length: parseInt(process.env.OTP_LENGTH || '6', 10)
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET
  },
  gcs: (() => {
    let clientEmail = process.env.GCS_CLIENT_EMAIL
    let privateKey = process.env.GCS_PRIVATE_KEY
    let projectId = process.env.GOOGLE_PROJECT_ID || 'invoice-app'

    // Parse full service-account JSON key if provided (takes priority)
    if (process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY) {
      try {
        const sa = JSON.parse(process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY)
        clientEmail = sa.client_email || clientEmail
        privateKey = sa.private_key || privateKey
        projectId = sa.project_id || projectId
      } catch (e) {
        process.stderr.write(`[config] Failed to parse GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY: ${e.message}\n`)
      }
    }

    return {
      clientEmail,
      privateKey,
      projectId,
      bucket: process.env.GCS_BUCKET || 'invoice-app-uploads'
    }
  })(),
  firebase: (() => {
    let serviceAccount = null
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      } catch (e) {
        process.stderr.write(`[config] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ${e.message}\n`)
      }
    }
    return { serviceAccount }
  })(),
  logLevel: process.env.LOG_LEVEL || 'info'
}

// --- Environment validation ---
const isProduction = config.nodeEnv === 'production'

// Always required
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET']
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

// JWT secret must be at least 32 characters in production
if (isProduction && config.jwt.secret && config.jwt.secret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production')
}

// CORS_ORIGIN must be explicitly set in production (not the dev default)
if (isProduction && config.corsOrigin === 'http://localhost:5173') {
  throw new Error('CORS_ORIGIN must be explicitly set in production (not localhost)')
}

// Warn about missing production services (non-fatal — allows graceful degradation)
if (isProduction) {
  const warnings = []
  if (!config.sms.springEdgeApiKey) warnings.push('SPRING_EDGE_API_KEY_ID (SMS will be disabled)')
  if (!config.gcs.clientEmail) warnings.push('GCS credentials (logo/signature uploads will fail)')
  if (warnings.length > 0) {
    process.stderr.write(`[config] Production warnings — missing: ${warnings.join(', ')}\n`)
  }
}
