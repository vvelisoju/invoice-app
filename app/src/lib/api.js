import axios from 'axios'

const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const API_BASE_URL = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Guard to prevent multiple 401 redirects firing at once
let isRedirectingTo401 = false

// Navigation callback for 401 redirect — set by App.jsx via setApiNavigate().
// Uses React Router instead of window.location.href so Capacitor WebView
// doesn't do a full page reload (which would restart the entire app).
let _navigateTo = null
export function setApiNavigate(fn) { _navigateTo = fn }

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network errors (no response from server)
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.message = 'Request timed out. Please check your connection and try again.'
      } else if (!navigator.onLine) {
        error.message = 'You are offline. Please check your internet connection.'
      } else {
        error.message = 'Unable to reach the server. Please try again later.'
      }
      return Promise.reject(error)
    }

    if (error.response?.status === 401) {
      // Don't logout on 401 from auth endpoints that intentionally return 401
      // (e.g. wrong OTP during phone change, invalid OTP during verify)
      const url = error.config?.url || ''
      const authSafeEndpoints = ['/auth/confirm-phone-change', '/auth/change-phone', '/auth/verify-otp', '/auth/request-otp']
      const isSafeEndpoint = authSafeEndpoints.some(ep => url.includes(ep))
      const isOnDemoPage = window.location.pathname === '/demo'
      if (!isSafeEndpoint && !isRedirectingTo401 && !isOnDemoPage) {
        isRedirectingTo401 = true
        // Clear all browser storage to prevent stale data leaking between sessions
        localStorage.clear()
        sessionStorage.clear()
        if (_navigateTo) {
          _navigateTo('/auth/phone')
        } else {
          window.location.href = '/auth/phone'
        }
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  requestOTP: (phone) => api.post('/auth/request-otp', { phone }),
  verifyOTP: (phone, otp) => api.post('/auth/verify-otp', { phone, otp }),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
  initiatePhoneChange: (newPhone) => api.post('/auth/change-phone', { newPhone }),
  confirmPhoneChange: (newPhone, otp) => api.post('/auth/confirm-phone-change', { newPhone, otp }),
  logout: () => api.post('/auth/logout')
}

// Invoice API
export const invoiceApi = {
  list: (params) => api.get('/invoices', { params }),
  get: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.patch(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  bulkDelete: (invoiceIds) => api.post('/invoices/bulk-delete', { invoiceIds }),
  issue: (id, templateData) => api.post(`/invoices/${id}/issue`, templateData),
  updateStatus: (id, status) => api.patch(`/invoices/${id}/status`, { status })
}

// Customer API
export const customerApi = {
  list: (params) => api.get('/customers/list', { params }),
  search: (query) => api.get('/customers', { params: { search: query } }),
  get: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.patch(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`)
}

// Product API
export const productApi = {
  list: (params) => api.get('/products/list', { params }),
  search: (query) => api.get('/products', { params: { search: query } }),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.patch(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  listUnits: () => api.get('/products/units')
}

// Business API
export const businessApi = {
  getProfile: () => api.get('/business'),
  updateProfile: (data) => api.patch('/business', data),
  getStats: () => api.get('/business/stats'),
  uploadLogo: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/business/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
  },
  uploadSignature: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/business/signature', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
  }
}

// Reports API
export const reportsApi = {
  getSummary: (params) => api.get('/reports/summary', { params }),
  getGSTSummary: (params) => api.get('/reports/gst', { params }),
  getDocuments: (params) => api.get('/reports/documents', { params }),
  getMonthlyTrend: (months) => api.get('/reports/trend', { params: { months } }),
  getGSTR3B: (month) => api.get('/reports/gstr3b', { params: { month } }),
  getGSTR1B2B: (month) => api.get('/reports/gstr1/b2b', { params: { month } }),
  getGSTR1B2CLarge: (month) => api.get('/reports/gstr1/b2c-large', { params: { month } }),
  getGSTR1B2CSmall: (month) => api.get('/reports/gstr1/b2c-small', { params: { month } }),
  getGSTR1NilExempt: (month) => api.get('/reports/gstr1/nil-exempt', { params: { month } }),
  getGSTR1CreditNotes: (month) => api.get('/reports/gstr1/credit-notes', { params: { month } }),
  getGSTR1DocSummary: (month) => api.get('/reports/gstr1/doc-summary', { params: { month } }),
  getSalesRegister: (params) => api.get('/reports/sales-register', { params }),
  getCustomerSummary: (params) => api.get('/reports/customer-summary', { params }),
  getTaxRateReport: (params) => api.get('/reports/tax-rate-report', { params }),
  getReceivablesAging: (params) => api.get('/reports/receivables', { params }),
  getCustomerLedger: (customerId, params) => api.get(`/reports/customer-ledger/${customerId}`, { params }),
  getAnnualSummary: (fy) => api.get('/reports/annual-summary', { params: { fy } }),
  getGSTR9Data: (fy) => api.get('/reports/gstr9', { params: { fy } }),
  getGSTR1HSNSummary: (month) => api.get('/reports/gstr1/hsn-summary', { params: { month } }),
  getCAPackage: (month) => api.get('/reports/ca-package', { params: { month } }),
}

// Template API
export const templateApi = {
  listBase: () => api.get('/templates/base'),
  getBase: (id) => api.get(`/templates/base/${id}`),
  getConfig: () => api.get('/templates/config'),
  updateConfig: (data) => api.put('/templates/config', data),
  getSnapshot: () => api.get('/templates/snapshot')
}

// Sync API
export const syncApi = {
  getDelta: (lastSyncAt) => api.get('/sync/delta', { params: { lastSyncAt } }),
  getFullSync: () => api.get('/sync/full'),
  processBatch: (mutations) => api.post('/sync/batch', { mutations })
}

// Plans API
export const plansApi = {
  list: () => api.get('/plans'),
  getUsage: () => api.get('/plans/usage'),
  createOrder: (data) => api.post('/plans/create-order', data),
  verifyPayment: (data) => api.post('/plans/verify-payment', data),
  getBillingHistory: () => api.get('/plans/billing-history'),
}

// Tax Rates API
export const taxRateApi = {
  list: () => api.get('/tax-rates'),
  create: (data) => api.post('/tax-rates', data),
  update: (id, data) => api.patch(`/tax-rates/${id}`, data),
  delete: (id) => api.delete(`/tax-rates/${id}`)
}

// Notification API (User)
export const notificationApi = {
  list: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
  registerDeviceToken: (data) => api.post('/notifications/device-token', data),
  removeDeviceToken: (data) => api.delete('/notifications/device-token', { data }),
}

// Admin API (Super Admin only)
export const adminApi = {
  // Dashboard
  getDashboardStats: (params) => api.get('/admin/dashboard', { params }),

  // Business Management
  listBusinesses: (params) => api.get('/admin/businesses', { params }),
  getBusinessDetails: (id) => api.get(`/admin/businesses/${id}`),
  updateBusinessDetails: (id, data) => api.patch(`/admin/businesses/${id}`, data),
  updateBusinessStatus: (id, status) => api.patch(`/admin/businesses/${id}/status`, { status }),
  updateBusinessPlan: (id, planId) => api.patch(`/admin/businesses/${id}/plan`, { planId }),

  // User Management
  listUsers: (params) => api.get('/admin/users', { params }),
  getUserDetails: (id) => api.get(`/admin/users/${id}`),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  updateUserStatus: (id, status) => api.patch(`/admin/users/${id}/status`, { status }),

  // Impersonation
  impersonateBusiness: (businessId) => api.post('/admin/impersonate', { businessId }),

  // Platform Settings
  getPlatformSettings: () => api.get('/admin/settings'),
  updatePlatformSetting: (key, value) => api.put('/admin/settings', { key, value }),

  // Audit Logs
  listAuditLogs: (params) => api.get('/admin/audit-logs', { params }),

  // Plans (admin operations from existing plans routes)
  listPlans: () => api.get('/plans/admin'),
  createPlan: (data) => api.post('/plans/admin', data),
  updatePlan: (id, data) => api.patch(`/plans/admin/${id}`, data),
  deletePlan: (id) => api.delete(`/plans/admin/${id}`),
  assignPlan: (businessId, planId) => api.post('/plans/admin/assign', { businessId, planId }),

  // Billing
  getBillingProfile: () => api.get('/admin/billing/profile'),
  listSubscriptionInvoices: (params) => api.get('/admin/billing/invoices', { params }),
  getSubscriptionInvoice: (id) => api.get(`/admin/billing/invoices/${id}`),

  // Notifications
  listNotifications: (params) => api.get('/notifications/admin', { params }),
  getNotification: (id) => api.get(`/notifications/admin/${id}`),
  sendNotification: (data) => api.post('/notifications/admin', data),
  getNotificationTemplates: () => api.get('/notifications/admin/templates'),
}
