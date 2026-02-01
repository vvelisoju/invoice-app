import { handleRequestOTP, handleVerifyOTP, handleGetCurrentUser, handleLogout } from './handlers.js'
import { authMiddleware } from '../../common/auth.js'

export const authRoutes = async (fastify) => {
  // Request OTP
  fastify.post('/auth/request-otp', {
    schema: {
      body: {
        type: 'object',
        required: ['phone'],
        properties: {
          phone: { type: 'string', pattern: '^[6-9]\\d{9}$' }
        }
      }
    }
  }, handleRequestOTP)

  // Verify OTP
  fastify.post('/auth/verify-otp', {
    schema: {
      body: {
        type: 'object',
        required: ['phone', 'otp'],
        properties: {
          phone: { type: 'string', pattern: '^[6-9]\\d{9}$' },
          otp: { type: 'string', pattern: '^\\d{6}$' }
        }
      }
    }
  }, handleVerifyOTP)

  // Get current user (protected)
  fastify.get('/auth/me', {
    preHandler: authMiddleware
  }, handleGetCurrentUser)

  // Logout (protected)
  fastify.post('/auth/logout', {
    preHandler: authMiddleware
  }, handleLogout)
}
