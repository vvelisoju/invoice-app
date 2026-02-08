import * as adminService from './service.js'
import * as billingService from './billingService.js'

// ============================================================================
// DASHBOARD
// ============================================================================

export async function getDashboardStats(request, reply) {
  const { from, to } = request.query || {}
  const stats = await adminService.getDashboardStats({ from, to })
  return { data: stats }
}

// ============================================================================
// BUSINESS MANAGEMENT
// ============================================================================

export async function listBusinesses(request, reply) {
  const result = await adminService.listBusinesses(request.query)
  return { data: result }
}

export async function getBusinessDetails(request, reply) {
  const { id } = request.params
  const business = await adminService.getBusinessDetails(id)
  return { data: business }
}

export async function updateBusinessStatus(request, reply) {
  const { id } = request.params
  const { status } = request.body
  const business = await adminService.updateBusinessStatus(id, status)
  return { data: business }
}

export async function updateBusinessPlan(request, reply) {
  const { id } = request.params
  const { planId } = request.body
  const business = await adminService.updateBusinessPlan(id, planId)
  return { data: business }
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export async function listUsers(request, reply) {
  const result = await adminService.listUsers(request.query)
  return { data: result }
}

export async function getUserDetails(request, reply) {
  const { id } = request.params
  const user = await adminService.getUserDetails(id)
  return { data: user }
}

export async function updateUserRole(request, reply) {
  const { id } = request.params
  const { role } = request.body
  const user = await adminService.updateUserRole(id, role)
  return { data: user }
}

export async function updateUserStatus(request, reply) {
  const { id } = request.params
  const { status } = request.body
  const user = await adminService.updateUserStatus(id, status)
  return { data: user }
}

// ============================================================================
// IMPERSONATION
// ============================================================================

export async function impersonateBusiness(request, reply) {
  const { businessId } = request.body
  const result = await adminService.impersonateBusiness(request.user.userId, businessId)
  return { data: result }
}

// ============================================================================
// PLATFORM SETTINGS
// ============================================================================

export async function getPlatformSettings(request, reply) {
  const settings = await adminService.getPlatformSettings()
  return { data: settings }
}

export async function updatePlatformSetting(request, reply) {
  const { key, value } = request.body
  const setting = await adminService.updatePlatformSetting(key, value, request.user.userId)
  return { data: setting }
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

export async function listAuditLogs(request, reply) {
  const result = await adminService.listAuditLogs(request.query)
  return { data: result }
}

// ============================================================================
// BILLING
// ============================================================================

export async function getBillingProfile(request, reply) {
  const profile = await billingService.getBillingProfile()
  return { data: profile }
}

export async function listSubscriptionInvoices(request, reply) {
  const result = await billingService.listSubscriptionInvoices(request.query)
  return { data: result }
}

export async function getSubscriptionInvoice(request, reply) {
  const { id } = request.params
  const invoice = await billingService.getSubscriptionInvoice(id)
  return { data: invoice }
}
