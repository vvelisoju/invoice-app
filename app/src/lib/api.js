import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/auth/phone'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  requestOTP: (phone) => api.post('/auth/request-otp', { phone }),
  verifyOTP: (phone, otp) => api.post('/auth/verify-otp', { phone, otp }),
  getCurrentUser: () => api.get('/auth/me'),
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
  search: (query) => api.get('/customers', { params: { search: query } }),
  get: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.patch(`/customers/${id}`, data)
}

// Product API
export const productApi = {
  search: (query) => api.get('/products', { params: { search: query } }),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.patch(`/products/${id}`, data)
}

// Business API
export const businessApi = {
  getProfile: () => api.get('/business'),
  updateProfile: (data) => api.patch('/business', data),
  getStats: () => api.get('/business/stats')
}

// Reports API
export const reportsApi = {
  getSummary: (params) => api.get('/reports/summary', { params }),
  getGSTSummary: (params) => api.get('/reports/gst', { params }),
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
  getUsage: () => api.get('/plans/usage')
}
