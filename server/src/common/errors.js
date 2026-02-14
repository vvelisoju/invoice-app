export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR')
    this.details = details
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details = null) {
    super(message, 403, 'FORBIDDEN')
    this.details = details
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT')
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
  }
}

export const errorHandler = (error, request, reply) => {
  const isProduction = process.env.NODE_ENV === 'production'

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
        ...(!isProduction && { requestId: request.id }),
      }
    })
  }

  if (error.validation) {
    return reply.status(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error.validation
      }
    })
  }

  // Handle Prisma errors with concise logging (Railway truncates large objects)
  const isPrismaError = error.constructor?.name?.startsWith('PrismaClient')
  if (isPrismaError) {
    request.log.error({
      prismaErrorName: error.constructor.name,
      prismaCode: error.code || 'N/A',
      prismaTarget: error.meta?.target || error.meta?.modelName || 'N/A',
      prismaCause: error.meta?.cause || 'N/A',
      message: error.message?.slice(0, 300),
      method: request.method,
      url: request.url,
      requestId: request.id,
    }, 'Prisma error')
  }

  // Log full error context for unexpected errors
  request.log.error({
    errName: error.constructor?.name || error.name,
    errMessage: error.message?.slice(0, 500),
    method: request.method,
    url: request.url,
    requestId: request.id,
  }, 'Unhandled server error')

  return reply.status(500).send({
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction
        ? 'An unexpected error occurred'
        : error.message || 'An unexpected error occurred',
      ...(!isProduction && { stack: error.stack }),
      requestId: request.id,
    }
  })
}
