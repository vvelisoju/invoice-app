import crypto from 'crypto'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import multipart from '@fastify/multipart'
import { config } from './common/config.js'
import { logger } from './common/logger.js'
import { prisma } from './common/prisma.js'
import { errorHandler } from './common/errors.js'
import { authRoutes } from './features/auth/routes.js'
import { invoiceRoutes } from './features/invoices/routes.js'
import { customerRoutes } from './features/customers/routes.js'
import { productRoutes } from './features/products/routes.js'
import businessRoutes from './features/business/routes.js'
import reportsRoutes from './features/reports/routes.js'
import templateRoutes from './features/templates/routes.js'
import syncRoutes from './features/sync/routes.js'
import planRoutes from './features/plans/routes.js'
import taxRateRoutes from './features/tax-rates/routes.js'
import adminRoutes from './features/admin/routes.js'

const isProduction = config.nodeEnv === 'production'

const fastify = Fastify({
  logger: logger,
  trustProxy: isProduction,
  requestTimeout: 30000,
  bodyLimit: 1048576,
  caseSensitive: true,
  disableRequestLogging: false,
  genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID(),
})

await fastify.register(helmet, {
  contentSecurityPolicy: isProduction ? undefined : false,
  crossOriginEmbedderPolicy: false,
})

await fastify.register(cors, {
  origin: isProduction ? config.corsOrigin.split(',').map(s => s.trim()) : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  maxAge: 86400,
})

await fastify.register(rateLimit, {
  max: isProduction ? 100 : 1000,
  timeWindow: '1 minute',
  allowList: ['127.0.0.1'],
})

await fastify.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1
  }
})

fastify.decorate('prisma', prisma)

fastify.setErrorHandler(errorHandler)

// Register routes
await fastify.register(authRoutes)
await fastify.register(invoiceRoutes)
await fastify.register(customerRoutes)
await fastify.register(productRoutes)
await fastify.register(businessRoutes, { prefix: '/business' })
await fastify.register(reportsRoutes, { prefix: '/reports' })
await fastify.register(templateRoutes, { prefix: '/templates' })
await fastify.register(syncRoutes, { prefix: '/sync' })
await fastify.register(planRoutes, { prefix: '/plans' })
await fastify.register(taxRateRoutes, { prefix: '/tax-rates' })
await fastify.register(adminRoutes, { prefix: '/admin' })

fastify.get('/health', async (request, reply) => {
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - dbStart
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      dbLatencyMs: dbLatency,
      uptime: Math.floor(process.uptime()),
    }
  } catch (error) {
    reply.status(503)
    return { 
      status: 'degraded', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      uptime: Math.floor(process.uptime()),
    }
  }
})

// Cleanup stale data on startup (expired OTPs, idempotency keys)
async function cleanupStaleData() {
  try {
    const [otpResult, idempResult] = await Promise.all([
      prisma.otpRequest.deleteMany({
        where: { expiresAt: { lt: new Date() } }
      }),
      prisma.idempotencyKey.deleteMany({
        where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      }).catch(() => ({ count: 0 })),
    ])
    if (otpResult.count > 0 || idempResult.count > 0) {
      logger.info({ expiredOtps: otpResult.count, expiredKeys: idempResult.count }, 'Cleaned up stale data on startup')
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Stale data cleanup failed (non-fatal)')
  }
}

const start = async () => {
  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' })
    fastify.log.info({ port: config.port, env: config.nodeEnv }, 'Server started')
    await cleanupStaleData()
  } catch (err) {
    fastify.log.error(err)
    await prisma.$disconnect()
    process.exit(1)
  }
}

let isShuttingDown = false
const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return
  isShuttingDown = true
  fastify.log.info({ signal }, 'Graceful shutdown initiated')

  // Force exit after 10 seconds if graceful shutdown stalls
  const forceTimer = setTimeout(() => {
    fastify.log.error('Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
  forceTimer.unref()

  try {
    await fastify.close()
    await prisma.$disconnect()
    fastify.log.info('Shutdown complete')
    process.exit(0)
  } catch (err) {
    fastify.log.error({ err }, 'Error during shutdown')
    process.exit(1)
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason: reason?.message || reason }, 'Unhandled promise rejection')
})

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error.message, stack: error.stack }, 'Uncaught exception — shutting down')
  process.exit(1)
})

start()
