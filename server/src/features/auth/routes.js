import { handleRequestOTP, handleVerifyOTP, handleGetCurrentUser, handleUpdateProfile, handleInitiatePhoneChange, handleConfirmPhoneChange, handleLogout, handleDeleteAccount } from './handlers.js'
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

  // Update user profile (protected)
  fastify.patch('/auth/profile', {
    preHandler: authMiddleware,
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' }
        }
      }
    }
  }, handleUpdateProfile)

  // Initiate phone number change — sends OTP to new phone (protected)
  fastify.post('/auth/change-phone', {
    preHandler: authMiddleware,
    schema: {
      body: {
        type: 'object',
        required: ['newPhone'],
        properties: {
          newPhone: { type: 'string', pattern: '^[6-9]\\d{9}$' }
        }
      }
    }
  }, handleInitiatePhoneChange)

  // Confirm phone number change with OTP (protected)
  fastify.post('/auth/confirm-phone-change', {
    preHandler: authMiddleware,
    schema: {
      body: {
        type: 'object',
        required: ['newPhone', 'otp'],
        properties: {
          newPhone: { type: 'string', pattern: '^[6-9]\\d{9}$' },
          otp: { type: 'string', pattern: '^\\d{6}$' }
        }
      }
    }
  }, handleConfirmPhoneChange)

  // Logout (protected)
  fastify.post('/auth/logout', {
    preHandler: authMiddleware
  }, handleLogout)

  // Delete account permanently (protected)
  fastify.delete('/auth/account', {
    preHandler: authMiddleware
  }, handleDeleteAccount)
}
