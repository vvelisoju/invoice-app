import { z } from 'zod'

export const requestOTPSchema = z.object({
  phone: z.string()
    .regex(/^[6-9]\d{9}$/, 'Invalid phone number. Must be 10 digits starting with 6-9')
})

export const verifyOTPSchema = z.object({
  phone: z.string()
    .regex(/^[6-9]\d{9}$/, 'Invalid phone number. Must be 10 digits starting with 6-9'),
  otp: z.string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits')
})
