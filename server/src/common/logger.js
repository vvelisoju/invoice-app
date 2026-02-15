import pino from 'pino'
import { config } from './config.js'

const isProduction = config.nodeEnv === 'production'

export const logger = pino({
  level: config.logLevel,
  // Redact sensitive fields from all log output
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'otp',
      'token',
      'password',
      'secret',
      'apikey',
      'privateKey',
    ],
    censor: '[REDACTED]',
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  // Pretty print in development, structured JSON in production
  transport: !isProduction ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname'
    }
  } : undefined,
  // In production, include timestamp in ISO format
  ...(isProduction && { timestamp: pino.stdTimeFunctions.isoTime }),
})
