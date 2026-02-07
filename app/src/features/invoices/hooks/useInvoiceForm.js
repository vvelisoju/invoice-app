import { useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { db, dbHelpers } from '../../../db'
import { useAuthStore } from '../../../store/authStore'

const createEmptyLineItem = () => ({
  id: uuidv4(),
  name: '',
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

export function useInvoiceForm(invoiceId = null) {
  const business = useAuthStore((state) => state.business)
  const [invoice, setInvoice] = useState(() => 
    createEmptyInvoice(business?.id)
  )
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const saveTimeoutRef = useRef(null)

  // Load existing invoice or draft
  useEffect(() => {
    const loadInvoice = async () => {
      if (invoiceId) {
        const existing = await dbHelpers.getInvoiceWithItems(invoiceId)
        if (existing) {
          setInvoice(existing)
        }
      } else {
        // Check for unsaved draft
        const drafts = await db.invoices
          .where('businessId')
          .equals(business?.id)
          .and(inv => inv.status === 'DRAFT')
          .reverse()
          .sortBy('updatedAt')
        
        if (drafts.length > 0) {
          const latestDraft = await dbHelpers.getInvoiceWithItems(drafts[0].id)
          if (latestDraft) {
            setInvoice(latestDraft)
          }
        }
      }
    }

    if (business?.id) {
      loadInvoice()
    }
  }, [invoiceId, business?.id])

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

  // Set customer
  const setCustomer = useCallback((customer) => {
    setInvoice(prev => ({
      ...prev,
      customerId: customer?.id || null,
      customerName: customer?.name || '',
      customerPhone: customer?.phone || '',
      customerStateCode: customer?.stateCode || null,
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
        rate: product?.defaultRate || newLineItems[index].rate,
        productServiceId: product?.id || null,
        taxRate: product?.taxRate || null,
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

  // Reset form
  const resetForm = useCallback(() => {
    setInvoice(createEmptyInvoice(business?.id))
    setIsDirty(false)
    setLastSaved(null)
  }, [business?.id])

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
    resetForm
  }
}
