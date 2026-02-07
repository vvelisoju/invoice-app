import { config } from '../../common/config.js'
import { generateToken } from '../../common/auth.js'
import { ValidationError, UnauthorizedError, RateLimitError } from '../../common/errors.js'
import springedge from 'springedge'

const isProduction = () => config.nodeEnv === 'production' && !!config.sms.springEdgeApiKey

const generateOTP = () => {
  if (!isProduction()) {
    return '222222' // Default OTP for development
  }

  const length = config.otp.length
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)]
  }
  return otp
}

const sendOTP = async (phone, otp) => {
  if (!isProduction()) {
    console.log(`[OTP] Phone: ${phone}, OTP: ${otp}`)
    return true
  }

  // Production: use SpringEdge SMS gateway
  return new Promise((resolve, reject) => {
    const params = {
      sender: config.sms.springEdgeSender || 'CODVEL',
      apikey: config.sms.springEdgeApiKey,
      to: [`91${phone}`],
      message: `Your OTP for logging into Lokalhunt is ${otp}. Do not share this with anyone.`,
      format: 'json'
    }

    springedge.messages.send(params, 5000, (err, response) => {
      if (err) {
        console.error('[SpringEdge] SMS send error:', err)
        reject(new Error('Failed to send OTP via SMS'))
        return
      }
      console.log('[SpringEdge] SMS response:', JSON.stringify(response))
      resolve(true)
    })
  })
}

export const requestOTP = async (prisma, phone) => {
  // Validate phone format (India: 10 digits)
  const phoneRegex = /^[6-9]\d{9}$/
  if (!phoneRegex.test(phone)) {
    throw new ValidationError('Invalid phone number. Must be 10 digits starting with 6-9')
  }

  // Check rate limiting: max 3 OTP requests per phone per 15 minutes
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
  const recentRequests = await prisma.otpRequest.count({
    where: {
      phone,
      createdAt: { gte: fifteenMinutesAgo }
    }
  })

  if (recentRequests >= 3) {
    throw new RateLimitError('Too many OTP requests. Please try again later')
  }

  // Find or create user
  let user = await prisma.user.findUnique({ where: { phone } })
  if (!user) {
    user = await prisma.user.create({
      data: { phone }
    })
  }

  // Generate OTP
  const otp = generateOTP()
  const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000)

  // Save OTP request
  await prisma.otpRequest.create({
    data: {
      userId: user.id,
      phone,
      otp,
      expiresAt
    }
  })

  // Send OTP
  await sendOTP(phone, otp)

  return {
    message: 'OTP sent successfully',
    expiresIn: config.otp.expiryMinutes * 60
  }
}

export const verifyOTP = async (prisma, phone, otp) => {
  // Validate inputs
  if (!phone || !otp) {
    throw new ValidationError('Phone and OTP are required')
  }

  // Find the most recent OTP request
  const otpRequest = await prisma.otpRequest.findFirst({
    where: {
      phone,
      verified: false,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' },
    include: { user: true }
  })

  if (!otpRequest) {
    throw new UnauthorizedError('Invalid or expired OTP')
  }

  // Check attempts
  if (otpRequest.attempts >= 3) {
    throw new UnauthorizedError('Too many failed attempts. Please request a new OTP')
  }

  // Verify OTP
  if (otpRequest.otp !== otp) {
    // Increment attempts
    await prisma.otpRequest.update({
      where: { id: otpRequest.id },
      data: { attempts: { increment: 1 } }
    })
    throw new UnauthorizedError('Invalid OTP')
  }

  // Mark OTP as verified
  await prisma.otpRequest.update({
    where: { id: otpRequest.id },
    data: { verified: true }
  })

  // Update user verification status
  const user = await prisma.user.update({
    where: { id: otpRequest.userId },
    data: { otpVerifiedAt: new Date() }
  })

  // Check if user has a business, if not create one
  let business = await prisma.business.findFirst({
    where: { ownerUserId: user.id }
  })

  if (!business) {
    // Auto-create business workspace
    business = await prisma.business.create({
      data: {
        ownerUserId: user.id,
        name: `Business ${phone.slice(-4)}` // Temporary name
      }
    })
  }

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    phone: user.phone,
    businessId: business.id
  })

  return {
    token,
    user: {
      id: user.id,
      phone: user.phone,
      otpVerifiedAt: user.otpVerifiedAt
    },
    business: {
      id: business.id,
      name: business.name
    }
  }
}

export const getCurrentUser = async (prisma, userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      businesses: {
        include: {
          plan: true
        }
      }
    }
  })

  if (!user) {
    throw new UnauthorizedError('User not found')
  }

  return user
}
