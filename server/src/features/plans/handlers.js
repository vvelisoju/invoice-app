import { logger } from '../../common/logger.js'
import * as planService from './service.js'
import { generateSubscriptionInvoice, getBusinessSubscriptionInvoices } from '../admin/billingService.js'
import { emit as emitNotification } from '../notifications/service.js'

// User endpoints
export async function getUsage(request, reply) {
  const usage = await planService.getBusinessPlanUsage(request.businessId)
  return { data: usage }
}

// Admin endpoints
export async function listPlans(request, reply) {
  const plans = await planService.listPlans()
  return { data: plans }
}

export async function createPlan(request, reply) {
  const plan = await planService.createPlan(request.body)
  return { data: plan }
}

export async function updatePlan(request, reply) {
  const { id } = request.params
  const plan = await planService.updatePlan(id, request.body)
  return { data: plan }
}

export async function adminListPlans(request, reply) {
  const plans = await planService.adminListPlans()
  return { data: plans }
}

export async function deletePlan(request, reply) {
  const { id } = request.params
  const plan = await planService.deletePlan(id)
  return { data: plan }
}

export async function listBusinesses(request, reply) {
  const result = await planService.listBusinesses(request.query)
  return { data: result }
}

export async function getBusinessDetails(request, reply) {
  const { id } = request.params
  const business = await planService.getBusinessDetails(id)
  return { data: business }
}

export async function assignPlan(request, reply) {
  const { businessId, planId } = request.body
  const business = await planService.assignPlanToBusiness(businessId, planId)
  return { data: business }
}

// Razorpay payment flow
export async function createOrder(request, reply) {
  const { planId, billingPeriod } = request.body
  const order = await planService.createSubscriptionOrder(request.businessId, planId, billingPeriod || 'yearly')
  return { data: order }
}

export async function verifyPayment(request, reply) {
  const result = await planService.verifySubscriptionPayment(request.businessId, request.body)

  // Generate subscription invoice after successful payment
  let subInvoiceNumber = null
  try {
    const plan = await planService.getPlanById(request.body.planId)
    const isYearly = result.renewAt && (new Date(result.renewAt).getTime() - new Date(result.startDate).getTime()) > 180 * 86400000
    const subInvoice = await generateSubscriptionInvoice({
      businessId: request.businessId,
      subscriptionId: result.id,
      planId: request.body.planId,
      planName: plan?.displayName || plan?.name || 'Plan',
      billingPeriod: isYearly ? 'yearly' : 'monthly',
      amount: result.amount,
      razorpayOrderId: result.razorpayOrderId,
      razorpayPaymentId: result.razorpayPaymentId,
      periodStart: result.startDate,
      periodEnd: result.renewAt,
    })
    subInvoiceNumber = subInvoice?.invoiceNumber

    // Emit plan_activated + payment_success notifications
    const planName = plan?.displayName || plan?.name || 'Plan'
    emitNotification('plan_activated', {
      userId: request.user.userId,
      businessId: request.businessId,
      variables: { planName },
      data: { action: 'navigate', route: '/plans', entityType: 'plan', entityId: request.body.planId },
    })
    emitNotification('payment_success', {
      userId: request.user.userId,
      businessId: request.businessId,
      variables: {
        amount: Number(result.amount || 0).toLocaleString('en-IN'),
        planName,
        invoiceNumber: subInvoiceNumber || '',
      },
      data: { action: 'navigate', route: '/plans', entityType: 'subscription', entityId: result.id },
    })
  } catch (err) {
    // Don't fail the payment verification if invoice generation fails
    logger.error({ err: err.message, businessId: request.businessId }, '[Billing] Failed to generate subscription invoice')
  }

  return { data: result }
}

export async function getBillingHistory(request, reply) {
  const invoices = await getBusinessSubscriptionInvoices(request.businessId)
  return { data: invoices }
}
