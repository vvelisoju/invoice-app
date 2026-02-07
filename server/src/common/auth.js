import jwt from 'jsonwebtoken'
import { config } from './config.js'
import { UnauthorizedError } from './errors.js'

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
  } catch (error) {
    throw new UnauthorizedError(error.message)
  }
}

export const authenticate = authMiddleware

export const authenticateAdmin = async (request, reply) => {
  await authMiddleware(request, reply)
  
  // Check if user is admin (for now, check a simple flag or specific user IDs)
  // In production, this would check a role field or admin table
  if (!request.user?.isAdmin) {
    throw new UnauthorizedError('Admin access required')
  }
}
