/**
 * Demo-mode localStorage helpers.
 * Stores customers, products, logo, and signature as base64 so the full
 * invoice experience works without any backend calls.
 *
 * After signup the VerifyOTPPage reads these and creates real DB records.
 */
import { v4 as uuidv4 } from 'uuid'

const KEYS = {
  customers: 'demo_customers',
  products: 'demo_products',
  logo: 'demo_logo',
  signature: 'demo_signature',
}

// ── Customers ────────────────────────────────────────────────
export function getDemoCustomers() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.customers) || '[]')
  } catch { return [] }
}

export function addDemoCustomer(data) {
  const customer = {
    id: `demo_${uuidv4()}`,
    name: data.name?.trim() || '',
    phone: data.phone?.trim() || '',
    email: data.email?.trim() || '',
    gstin: data.gstin?.trim().toUpperCase() || '',
    stateCode: data.stateCode?.trim() || '',
    address: data.address?.trim() || '',
    _demo: true,
  }
  const list = getDemoCustomers()
  list.push(customer)
  localStorage.setItem(KEYS.customers, JSON.stringify(list))
  return customer
}

export function searchDemoCustomers(term) {
  if (!term) return []
  const lower = term.toLowerCase()
  return getDemoCustomers().filter(c =>
    c.name.toLowerCase().includes(lower) ||
    c.phone?.includes(term) ||
    c.email?.toLowerCase().includes(lower)
  )
}

// ── Products ─────────────────────────────────────────────────
export function getDemoProducts() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.products) || '[]')
  } catch { return [] }
}

export function addDemoProduct(data) {
  const product = {
    id: `demo_${uuidv4()}`,
    name: data.name?.trim() || '',
    defaultRate: data.defaultRate != null ? Number(data.defaultRate) : null,
    unit: data.unit || null,
    taxRate: data.taxRate != null ? Number(data.taxRate) : null,
    _demo: true,
  }
  const list = getDemoProducts()
  list.push(product)
  localStorage.setItem(KEYS.products, JSON.stringify(list))
  return product
}

export function searchDemoProducts(term) {
  if (!term) return []
  const lower = term.toLowerCase()
  return getDemoProducts().filter(p =>
    p.name.toLowerCase().includes(lower)
  )
}

// ── Logo / Signature (base64 data-URLs) ──────────────────────
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function getDemoLogo() {
  return localStorage.getItem(KEYS.logo) || null
}
export async function setDemoLogo(file) {
  const dataUrl = await fileToDataUrl(file)
  localStorage.setItem(KEYS.logo, dataUrl)
  return dataUrl
}
export function removeDemoLogo() {
  localStorage.removeItem(KEYS.logo)
}

export function getDemoSignature() {
  return localStorage.getItem(KEYS.signature) || null
}
export async function setDemoSignature(file) {
  const dataUrl = await fileToDataUrl(file)
  localStorage.setItem(KEYS.signature, dataUrl)
  return dataUrl
}
export function removeDemoSignature() {
  localStorage.removeItem(KEYS.signature)
}

// ── Cleanup (called after real DB records are created) ───────
export function clearAllDemoData() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k))
}
