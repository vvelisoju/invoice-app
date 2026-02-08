import jwt from 'jsonwebtoken'
import { config } from './config.js'
import { UnauthorizedError, ForbiddenError } from './errors.js'

export const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  })
}

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret)
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token')
  }
}

export const authMiddleware = async (request, reply) => {
  try {
    const authHeader = request.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header')
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    request.user = decoded
    request.businessId = decoded.businessId

    // Block suspended/banned users
    if (decoded.status === 'SUSPENDED' || decoded.status === 'BANNED') {
      throw new ForbiddenError('Your account has been suspended')
    }
  } catch (error) {
    if (error instanceof ForbiddenError) throw error
    throw new UnauthorizedError(error.message)
  }
}

export const authenticate = authMiddleware

export const authenticateAdmin = async (request, reply) => {
  await authMiddleware(request, reply)
  
  if (request.user?.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Super admin access required')
  }
}
