import { prisma } from '../../common/prisma.js'
import { logger } from '../../common/logger.js'
import { verifyWebhookSignature } from '../../common/razorpay.js'
import { generateSubscriptionInvoice } from '../admin/billingService.js'
import { emit as emitNotification } from '../notifications/service.js'

/**
 * Handle Razorpay webhook events.
 * Razorpay sends webhooks for: payment.captured, payment.failed, order.paid, refund.created, etc.
 *
 * This handler is idempotent — safe to receive the same event multiple times.
 */
export async function handleWebhook(request, reply) {
  const signature = request.headers['x-razorpay-signature']
  const rawBody = request.rawBody || JSON.stringify(request.body)

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    logger.warn('[Webhook] Invalid or missing Razorpay signature')
    reply.status(400)
    return { error: 'Invalid signature' }
  }

  const event = request.body
  const eventType = event.event

  logger.info({ eventType, payloadId: event.payload?.payment?.entity?.id }, '[Webhook] Received Razorpay event')

  try {
    switch (eventType) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload)
        break

      case 'payment.failed':
        await handlePaymentFailed(event.payload)
        break

      case 'refund.created':
        await handleRefundCreated(event.payload)
        break

      default:
        logger.info({ eventType }, '[Webhook] Unhandled event type — ignored')
    }
  } catch (err) {
    logger.error({ eventType, err: err.message }, '[Webhook] Error processing event')
    // Return 200 anyway to prevent Razorpay from retrying indefinitely
    // Errors are logged for manual investigation
  }

  return { status: 'ok' }
}

/**
 * payment.captured — Razorpay has successfully captured the payment.
 * This is the authoritative confirmation that money was collected.
 * Activates the subscription if not already activated by verify-payment.
 */
async function handlePaymentCaptured(payload) {
  const payment = payload.payment?.entity
  if (!payment) return

  const orderId = payment.order_id
  if (!orderId) return

  // Find the subscription by Razorpay order ID
  const subscription = await prisma.subscription.findUnique({
    where: { razorpayOrderId: orderId }
  })

  if (!subscription) {
    logger.warn({ orderId }, '[Webhook] No subscription found for order — may be non-subscription payment')
    return
  }

  // Already activated — idempotent
  if (subscription.status === 'ACTIVE' && subscription.razorpayPaymentId) {
    logger.info({ subscriptionId: subscription.id }, '[Webhook] Subscription already active — skipping')
    return
  }

  const plan = await prisma.plan.findUnique({ where: { id: subscription.planId } })
  const storedPeriod = subscription.billingPeriod
  const isYearly = storedPeriod
    ? storedPeriod === 'yearly'
    : (plan && Number(subscription.amount) === Number(plan.priceYearly))

  const now = new Date()
  const renewAt = new Date(now)
  if (isYearly) {
    renewAt.setFullYear(renewAt.getFullYear() + 1)
  } else {
    renewAt.setMonth(renewAt.getMonth() + 1)
  }

  const businessId = subscription.businessId

  // Cancel any previous active subscription for this business
  if (businessId) {
    const previousSub = await prisma.subscription.findFirst({
      where: {
        businessId,
        status: 'ACTIVE',
        id: { not: subscription.id }
      }
    })

    const txOps = [
      prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          razorpayPaymentId: payment.id,
          billingPeriod: isYearly ? 'yearly' : 'monthly',
          autoRenew: true,
          startDate: now,
          renewAt
        }
      }),
      prisma.business.update({
        where: { id: businessId },
        data: {
          planId: subscription.planId,
          subscriptionId: subscription.id
        }
      })
    ]

    if (previousSub) {
      txOps.push(
        prisma.subscription.update({
          where: { id: previousSub.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: now,
            cancelledReason: 'plan_changed',
            autoRenew: false
          }
        })
      )
    }

    await prisma.$transaction(txOps)

    // Generate subscription invoice (fire-and-forget)
    try {
      const planName = plan?.displayName || plan?.name || 'Plan'
      await generateSubscriptionInvoice({
        businessId,
        subscriptionId: subscription.id,
        planId: subscription.planId,
        planName,
        billingPeriod: isYearly ? 'yearly' : 'monthly',
        amount: subscription.amount,
        razorpayOrderId: orderId,
        razorpayPaymentId: payment.id,
        periodStart: now,
        periodEnd: renewAt,
      })
    } catch (err) {
      logger.error({ err: err.message, subscriptionId: subscription.id }, '[Webhook] Failed to generate invoice')
    }

    // Emit notifications (fire-and-forget)
    try {
      const planName = plan?.displayName || plan?.name || 'Plan'
      // Find the business owner for notification targeting
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { ownerUserId: true }
      })
      if (business) {
        emitNotification('payment_success', {
          userId: business.ownerUserId,
          businessId,
          variables: {
            amount: Number(subscription.amount || 0).toLocaleString('en-IN'),
            planName,
            invoiceNumber: '',
          },
          data: { action: 'navigate', route: '/plans', entityType: 'subscription', entityId: subscription.id },
        })
      }
    } catch (err) {
      logger.error({ err: err.message }, '[Webhook] Failed to emit notification')
    }
  }

  logger.info({ subscriptionId: subscription.id, paymentId: payment.id }, '[Webhook] Subscription activated via webhook')
}

/**
 * payment.failed — Payment attempt failed.
 * Log it and optionally notify the user.
 */
async function handlePaymentFailed(payload) {
  const payment = payload.payment?.entity
  if (!payment) return

  const orderId = payment.order_id
  if (!orderId) return

  const subscription = await prisma.subscription.findUnique({
    where: { razorpayOrderId: orderId }
  })

  if (!subscription) return

  logger.warn({
    subscriptionId: subscription.id,
    orderId,
    errorCode: payment.error_code,
    errorDescription: payment.error_description,
    errorReason: payment.error_reason
  }, '[Webhook] Payment failed')

  // Notify user about failed payment
  if (subscription.businessId) {
    try {
      const business = await prisma.business.findUnique({
        where: { id: subscription.businessId },
        select: { ownerUserId: true }
      })
      if (business) {
        emitNotification('payment_failed', {
          userId: business.ownerUserId,
          businessId: subscription.businessId,
          variables: {
            reason: payment.error_description || 'Payment could not be processed',
          },
          data: { action: 'navigate', route: '/plans', entityType: 'subscription' },
        })
      }
    } catch (err) {
      logger.error({ err: err.message }, '[Webhook] Failed to emit payment_failed notification')
    }
  }
}

/**
 * refund.created — A refund was issued for a payment.
 * Mark the subscription invoice as refunded if applicable.
 */
async function handleRefundCreated(payload) {
  const refund = payload.refund?.entity
  if (!refund) return

  const paymentId = refund.payment_id
  if (!paymentId) return

  // Find subscription invoice by payment ID
  const invoice = await prisma.subscriptionInvoice.findFirst({
    where: { razorpayPaymentId: paymentId }
  })

  if (invoice) {
    await prisma.subscriptionInvoice.update({
      where: { id: invoice.id },
      data: { status: 'REFUNDED' }
    })
    logger.info({ invoiceId: invoice.id, paymentId }, '[Webhook] Subscription invoice marked as refunded')
  }
}
