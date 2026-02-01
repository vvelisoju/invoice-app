import { requestOTP, verifyOTP, getCurrentUser } from './service.js'

export const handleRequestOTP = async (request, reply) => {
  const { phone } = request.body
  const result = await requestOTP(request.server.prisma, phone)
  return reply.status(200).send(result)
}

export const handleVerifyOTP = async (request, reply) => {
  const { phone, otp } = request.body
  const result = await verifyOTP(request.server.prisma, phone, otp)
  return reply.status(200).send(result)
}

export const handleGetCurrentUser = async (request, reply) => {
  const user = await getCurrentUser(request.server.prisma, request.user.userId)
  return reply.status(200).send(user)
}

export const handleLogout = async (request, reply) => {
  // Since we're using JWT, logout is handled client-side by removing the token
  return reply.status(200).send({ message: 'Logged out successfully' })
}
