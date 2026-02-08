import axios from 'axios'

const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const API_BASE_URL = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`

export const api = axios.create({
  baseURL: API_BASE_URL,
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't logout on 401 from auth endpoints that intentionally return 401
      // (e.g. wrong OTP during phone change, invalid OTP during verify)
      const url = error.config?.url || ''
      const authSafeEndpoints = ['/auth/confirm-phone-change', '/auth/change-phone', '/auth/verify-otp', '/auth/request-otp']
      const isSafeEndpoint = authSafeEndpoints.some(ep => url.includes(ep))
      if (!isSafeEndpoint && !isRedirectingTo401) {
        isRedirectingTo401 = true
        // Clear all browser storage to prevent stale data leaking between sessions
        localStorage.clear()
        sessionStorage.clear()
        window.location.href = '/auth/phone'
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  requestOTP: (phone) => {
    console.log('API: Requesting OTP for phone:', phone)
    console.log('API: Base URL:', API_BASE_URL)
    return api.post('/auth/request-otp', { phone })
      .then(response => {
        console.log('API: OTP request successful', response)
        return response
      })
      .catch(error => {
        console.error('API: OTP request failed', error)
        throw error
      })
  },
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
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  uploadSignature: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/business/signature', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

// Reports API
export const reportsApi = {
  getSummary: (params) => api.get('/reports/summary', { params }),
  getGSTSummary: (params) => api.get('/reports/gst', { params }),
  getDocuments: (params) => api.get('/reports/documents', { params }),
  getMonthlyTrend: (months) => api.get('/reports/trend', { params: { months } })
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
  verifyPayment: (data) => api.post('/plans/verify-payment', data)
}

// Tax Rates API
export const taxRateApi = {
  list: () => api.get('/tax-rates'),
  create: (data) => api.post('/tax-rates', data),
  update: (id, data) => api.patch(`/tax-rates/${id}`, data),
  delete: (id) => api.delete(`/tax-rates/${id}`)
}
