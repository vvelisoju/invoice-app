import { requestOTP, verifyOTP, getCurrentUser, updateUserProfile, initiatePhoneChange, confirmPhoneChange, deleteAccount } from './service.js'

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

export const handleUpdateProfile = async (request, reply) => {
  const result = await updateUserProfile(request.server.prisma, request.user.userId, request.body)
  return reply.status(200).send(result)
}

export const handleInitiatePhoneChange = async (request, reply) => {
  const { newPhone } = request.body
  const result = await initiatePhoneChange(request.server.prisma, request.user.userId, newPhone)
  return reply.status(200).send(result)
}

export const handleConfirmPhoneChange = async (request, reply) => {
  const { newPhone, otp } = request.body
  const result = await confirmPhoneChange(request.server.prisma, request.user.userId, newPhone, otp)
  return reply.status(200).send(result)
}

export const handleLogout = async (request, reply) => {
  // Since we're using JWT, logout is handled client-side by removing the token
  return reply.status(200).send({ message: 'Logged out successfully' })
}

export const handleDeleteAccount = async (request, reply) => {
  const result = await deleteAccount(request.server.prisma, request.user.userId)
  return reply.status(200).send(result)
}
