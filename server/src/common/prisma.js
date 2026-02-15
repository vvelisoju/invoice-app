import { PrismaClient } from '@prisma/client'
import { config } from './config.js'
import { logger } from './logger.js'

const isProduction = config.nodeEnv === 'production'

const prisma = new PrismaClient({
  log: isProduction
    ? [
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ]
    : [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
})

if (!isProduction) {
  prisma.$on('query', (e) => {
    logger.debug({ query: e.query, duration: e.duration }, 'Prisma query')
  })
}

prisma.$on('error', (e) => {
  logger.error({ message: e.message, target: e.target }, 'Prisma error')
})

prisma.$on('warn', (e) => {
  logger.warn({ message: e.message, target: e.target }, 'Prisma warning')
})

export { prisma }
