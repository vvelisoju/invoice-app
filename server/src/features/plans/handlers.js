import * as planService from './service.js'

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
  return { data: result }
}
