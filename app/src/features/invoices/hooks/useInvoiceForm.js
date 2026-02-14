import { useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { db, dbHelpers } from '../../../db'
import { useAuthStore } from '../../../store/authStore'
import { productApi } from '../../../lib/api'

const DRAFT_STORAGE_KEY = 'invoice_draft'

const createEmptyLineItem = () => ({
  id: uuidv4(),
  name: '',
  hsnCode: '',
  quantity: 1,
  rate: 0,
  lineTotal: 0,
  productServiceId: null
})

const createEmptyInvoice = (businessId) => ({
  id: uuidv4(),
  businessId,
  customerId: null,
  customerName: '',
  customerPhone: '',
  fromAddress: '',
  billTo: '',
  shipTo: '',
  poNumber: '',
  invoiceNumber: '',
  date: new Date().toISOString().split('T')[0],
  dueDate: null,
  status: 'DRAFT',
  lineItems: [createEmptyLineItem()],
  subtotal: 0,
  discountTotal: 0,
  taxRate: null,
  taxTotal: 0,
  total: 0,
  notes: '',
  terms: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
})

const loadDraftFromSession = (businessId) => {
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY)
    if (raw) {
      const draft = JSON.parse(raw)
      if (draft && draft.businessId === businessId) return draft
    }
  } catch {}
  return null
}

const saveDraftToSession = (invoice) => {
  try {
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(invoice))
  } catch {}
}

const clearDraftFromSession = () => {
  try {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY)
  } catch {}
}

export function useInvoiceForm(invoiceId = null) {
  const business = useAuthStore((state) => state.business)
  const [invoice, setInvoice] = useState(() => {
    // For new invoices, restore draft from sessionStorage if available
    if (!invoiceId && business?.id) {
      const draft = loadDraftFromSession(business.id)
      if (draft) return draft
    }
    return createEmptyInvoice(business?.id)
  })
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const saveTimeoutRef = useRef(null)

  // Load existing invoice for editing
  useEffect(() => {
    if (invoiceId && business?.id) {
      const loadInvoice = async () => {
        const existing = await dbHelpers.getInvoiceWithItems(invoiceId)
        if (existing) {
          setInvoice(existing)
        }
      }
      loadInvoice()
    }
  }, [invoiceId, business?.id])

  // Persist draft to sessionStorage on every change (new invoices only)
  useEffect(() => {
    if (!invoiceId) {
      saveDraftToSession(invoice)
    }
  }, [invoice, invoiceId])

  // Calculate totals
  const calculateTotals = useCallback((lineItems, discountTotal = 0, taxRate = null) => {
    const subtotal = lineItems.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)
    }, 0)

    let taxTotal = 0
    if (taxRate && taxRate > 0) {
      const taxableAmount = subtotal - discountTotal
      taxTotal = (taxableAmount * taxRate) / 100
    }

    const total = subtotal - discountTotal + taxTotal

    return { subtotal, taxTotal, total }
  }, [])

  // Update invoice field
  const updateField = useCallback((field, value) => {
    setInvoice(prev => {
      const updated = { ...prev, [field]: value, updatedAt: new Date().toISOString() }
      
      // Recalculate if relevant fields changed
      if (['lineItems', 'discountTotal', 'taxRate'].includes(field)) {
        const totals = calculateTotals(
          field === 'lineItems' ? value : prev.lineItems,
          field === 'discountTotal' ? value : prev.discountTotal,
          field === 'taxRate' ? value : prev.taxRate
        )
        Object.assign(updated, totals)
      }
      
      return updated
    })
    setIsDirty(true)
  }, [calculateTotals])

  // Update line item
  // Debounced product price/tax sync — silently update the product catalog
  // when the user changes rate or taxRate on a line item linked to a product
  const productSyncTimers = useRef({})

  const syncProductPrice = useCallback((productId, updates) => {
    if (!productId) return
    // Clear previous timer for this product
    if (productSyncTimers.current[productId]) {
      clearTimeout(productSyncTimers.current[productId])
    }
    productSyncTimers.current[productId] = setTimeout(() => {
      productApi.update(productId, updates).catch(() => {})
      delete productSyncTimers.current[productId]
    }, 1500)
  }, [])

  const updateLineItem = useCallback((index, field, value) => {
    setInvoice(prev => {
      const newLineItems = [...prev.lineItems]
      newLineItems[index] = {
        ...newLineItems[index],
        [field]: value
      }
      
      // Calculate line total
      if (field === 'quantity' || field === 'rate') {
        const qty = field === 'quantity' ? value : newLineItems[index].quantity
        const rate = field === 'rate' ? value : newLineItems[index].rate
        newLineItems[index].lineTotal = (parseFloat(qty) || 0) * (parseFloat(rate) || 0)
      }

      // Auto-sync product price/tax when changed on a linked line item
      const item = newLineItems[index]
      if (item.productServiceId) {
        if (field === 'rate' && value !== '' && value != null) {
          syncProductPrice(item.productServiceId, { defaultRate: parseFloat(value) || 0 })
        } else if (field === 'taxRate' && value !== undefined) {
          syncProductPrice(item.productServiceId, { taxRate: value ? Number(value) : null })
        }
      }

      const totals = calculateTotals(newLineItems, prev.discountTotal, prev.taxRate)
      
      return {
        ...prev,
        lineItems: newLineItems,
        ...totals,
        updatedAt: new Date().toISOString()
      }
    })
    setIsDirty(true)
  }, [calculateTotals, syncProductPrice])

  // Add line item
  const addLineItem = useCallback(() => {
    setInvoice(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, createEmptyLineItem()],
      updatedAt: new Date().toISOString()
    }))
    setIsDirty(true)
  }, [])

  // Remove line item
  const removeLineItem = useCallback((index) => {
    setInvoice(prev => {
      if (prev.lineItems.length <= 1) return prev
      
      const newLineItems = prev.lineItems.filter((_, i) => i !== index)
      const totals = calculateTotals(newLineItems, prev.discountTotal, prev.taxRate)
      
      return {
        ...prev,
        lineItems: newLineItems,
        ...totals,
        updatedAt: new Date().toISOString()
      }
    })
    setIsDirty(true)
  }, [calculateTotals])

  // Set customer — also snapshot billTo text from customer details
  const setCustomer = useCallback((customer) => {
    const billToParts = []
    if (customer?.name) billToParts.push(customer.name)
    if (customer?.address) billToParts.push(customer.address)
    if (customer?.phone) billToParts.push(customer.phone)
    if (customer?.email) billToParts.push(customer.email)
    setInvoice(prev => ({
      ...prev,
      customerId: customer?.id || null,
      customerName: customer?.name || '',
      customerPhone: customer?.phone || '',
      customerStateCode: customer?.stateCode || null,
      billTo: billToParts.join('\n'),
      updatedAt: new Date().toISOString()
    }))
    setIsDirty(true)
  }, [])

  // Set product for line item
  const setProductForLineItem = useCallback((index, product) => {
    setInvoice(prev => {
      const newLineItems = [...prev.lineItems]
      newLineItems[index] = {
        ...newLineItems[index],
        name: product?.name || newLineItems[index].name,
        hsnCode: product?.hsnCode || newLineItems[index].hsnCode || '',
        rate: product?.defaultRate || newLineItems[index].rate,
        productServiceId: product?.id || null,
        taxRate: product?.taxRate || null,
        taxRateName: product?.taxRateName || newLineItems[index].taxRateName || null,
        lineTotal: (parseFloat(newLineItems[index].quantity) || 0) * (parseFloat(product?.defaultRate) || 0)
      }

      const totals = calculateTotals(newLineItems, prev.discountTotal, prev.taxRate)
      
      return {
        ...prev,
        lineItems: newLineItems,
        ...totals,
        updatedAt: new Date().toISOString()
      }
    })
    setIsDirty(true)
  }, [calculateTotals])

  // Save to local DB
  const saveToLocal = useCallback(async () => {
    if (!isDirty) return

    setIsSaving(true)
    try {
      const { lineItems, ...invoiceData } = invoice
      await dbHelpers.saveInvoice(invoiceData, lineItems.map(item => ({
        ...item,
        invoiceId: invoice.id
      })))
      setLastSaved(new Date())
      setIsDirty(false)
    } catch (error) {
      console.error('Failed to save invoice:', error)
    } finally {
      setIsSaving(false)
    }
  }, [invoice, isDirty])

  // Auto-save with debounce
  useEffect(() => {
    if (isDirty) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveToLocal()
      }, 2000)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [isDirty, saveToLocal])

  // Set full invoice data (for edit mode / clone)
  const setInvoiceData = useCallback((data) => {
    setInvoice(prev => {
      const updated = {
        ...prev,
        ...data,
        updatedAt: new Date().toISOString()
      }
      // Recalculate totals
      const totals = calculateTotals(
        data.lineItems || prev.lineItems,
        data.discountTotal !== undefined ? data.discountTotal : prev.discountTotal,
        data.taxRate !== undefined ? data.taxRate : prev.taxRate
      )
      Object.assign(updated, totals)
      return updated
    })
    setIsDirty(false)
  }, [calculateTotals])

  // Reset form, clear sessionStorage draft and IndexedDB draft
  const resetForm = useCallback(async () => {
    const oldId = invoice.id
    setInvoice(createEmptyInvoice(business?.id))
    setIsDirty(false)
    setLastSaved(null)
    clearDraftFromSession()
    // Remove old draft from local DB
    if (oldId) {
      try {
        await db.lineItems.where('invoiceId').equals(oldId).delete()
        await db.invoices.delete(oldId)
      } catch {}
    }
  }, [business?.id, invoice.id])

  return {
    invoice,
    isDirty,
    isSaving,
    lastSaved,
    updateField,
    updateLineItem,
    addLineItem,
    removeLineItem,
    setCustomer,
    setProductForLineItem,
    saveToLocal,
    resetForm,
    setInvoiceData
  }
}
