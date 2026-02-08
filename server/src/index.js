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

const fastify = Fastify({
  logger: logger
})

await fastify.register(helmet, {
  contentSecurityPolicy: false
})

await fastify.register(cors, {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute'
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

fastify.get('/health', async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    }
  } catch (error) {
    return { 
      status: 'degraded', 
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    }
  }
})

const start = async () => {
  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' })
    fastify.log.info(`Server listening on port ${config.port}`)
  } catch (err) {
    fastify.log.error(err)
    await prisma.$disconnect()
    process.exit(1)
  }
}

const gracefulShutdown = async (signal) => {
  fastify.log.info(`Received ${signal}, closing server...`)
  await fastify.close()
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

start()
