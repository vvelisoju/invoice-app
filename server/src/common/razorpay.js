import Razorpay from 'razorpay'
import crypto from 'crypto'
import { config } from './config.js'

let razorpayInstance = null

export function getRazorpay() {
  if (!config.razorpay.keyId || !config.razorpay.keySecret) {
    throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env')
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret
    })
  }

  return razorpayInstance
}

export function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const body = orderId + '|' + paymentId
  const expectedSignature = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(body)
    .digest('hex')

  return expectedSignature === signature
}
