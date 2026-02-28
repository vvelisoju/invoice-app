import { useState, useEffect, useRef } from 'react'
import { useHistory, useLocation, useParams } from 'react-router-dom'
import { Save, Loader2, ChevronDown } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useInvoiceForm } from './hooks/useInvoiceForm'
import { useAuthStore } from '../../store/authStore'
import { invoiceApi, businessApi, customerApi } from '../../lib/api'
import { InvoiceFormToolbar, InvoiceHeaderSection, InvoiceLineItems, InvoiceTotalsFooter } from '../../components/invoice-form'
import CreateCustomerModal from '../../components/customers/CreateCustomerModal'
import ProductAddEditModal from '../products/ProductAddEditModal'
import PlanLimitModal from '../../components/PlanLimitModal'
import usePlanLimitCheck from '../../hooks/usePlanLimitCheck'
import { ALL_INVOICE_TYPES } from '../../components/layout/navigationConfig'
import { DOCUMENT_TYPE_DEFAULTS, getDocTypeConfig } from '../../config/documentTypeDefaults'
import { trackInvoiceCreated } from '../../lib/appReview'
import BusinessSettingsModal from '../../components/settings/BusinessSettingsModal'
import ImageUploadModal from '../../components/settings/ImageUploadModal'
import {
  addDemoCustomer, searchDemoCustomers, getDemoCustomers,
  addDemoProduct, searchDemoProducts, getDemoProducts,
  getDemoLogo, setDemoLogo, removeDemoLogo,
  getDemoSignature, setDemoSignature, removeDemoSignature,
} from '../../lib/demoStorage'

const FORM_MODE_KEY = 'invoice_form_mode'
export const DEMO_INVOICE_KEY = 'demo_invoice_draft'

export default function NewInvoicePage({ demoMode: demoProp } = {}) {
  const history = useHistory()
  const location = useLocation()
  const { id: editId } = useParams()
  const queryClient = useQueryClient()
  const token = useAuthStore((state) => state.token)
  const business = useAuthStore((state) => state.business)
  const isDemo = demoProp || false
  const isEditMode = !!editId && !isDemo
  const cloneData = location.state?.clone || null
  const [error, setError] = useState('')
  const [editLoaded, setEditLoaded] = useState(false)
  const [formMode, setFormMode] = useState(() => {
    try { return localStorage.getItem(FORM_MODE_KEY) || 'basic' } catch { return 'basic' }
  })
  const [showCreateCustomer, setShowCreateCustomer] = useState(false)
  const [createCustomerName, setCreateCustomerName] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [editCustomer, setEditCustomer] = useState(null)
  const [showCreateProduct, setShowCreateProduct] = useState(false)
  const [createProductName, setCreateProductName] = useState('')
  const [createProductLineIndex, setCreateProductLineIndex] = useState(null)
  const [editProduct, setEditProduct] = useState(null)
  const [invoiceTitle, setInvoiceTitle] = useState('Invoice')
  const { planLimitData, setPlanLimitData, checkLimit } = usePlanLimitCheck()
  const [showBusinessSettings, setShowBusinessSettings] = useState(false)
  const [showLogoUpload, setShowLogoUpload] = useState(false)
  const [showSignatureUpload, setShowSignatureUpload] = useState(false)
  const termsDebounceRef = useRef(null)
  const defaultsAppliedRef = useRef(false)

  // Demo-mode local state for logo / signature (base64 data-URLs)
  const [demoLogo, setDemoLogoState] = useState(() => isDemo ? getDemoLogo() : null)
  const [demoSignature, setDemoSignatureState] = useState(() => isDemo ? getDemoSignature() : null)

  // Persist form mode selection
  const handleFormModeChange = (mode) => {
    setFormMode(mode)
    try { localStorage.setItem(FORM_MODE_KEY, mode) } catch {}
  }

  // Document type key — from URL param initially, overridden by existing invoice in edit mode
  const [documentTypeKey, setDocumentTypeKey] = useState(() => {
    const params = new URLSearchParams(location.search)
    return params.get('type') || 'invoice'
  })

  // Read ?type= query param and update document type + title on URL change
  useEffect(() => {
    // Skip if in edit mode — document type is locked to existing invoice
    if (isEditMode) return
    
    const params = new URLSearchParams(location.search)
    const typeKey = params.get('type')
    if (typeKey) {
      const found = ALL_INVOICE_TYPES.find(t => t.key === typeKey)
      if (found) {
        setDocumentTypeKey(typeKey)
        setInvoiceTitle(found.label)
      }
    }
  }, [location.search, isEditMode])

  // Pre-populate customer from ?customerId= URL param
  useEffect(() => {
    if (isDemo || isEditMode || cloneData) return
    const params = new URLSearchParams(location.search)
    const custId = params.get('customerId')
    if (custId && !selectedCustomer) {
      customerApi.get(custId).then(res => {
        const customer = res.data?.data || res.data
        if (customer) {
          setSelectedCustomer(customer)
          setCustomer(customer)
        }
      }).catch(() => {})
    }
  }, [location.search])

  // Fetch business profile — always fetch fresh data to get latest nextNumber for each document type
  const { data: businessProfile } = useQuery({
    queryKey: ['business'],
    queryFn: async () => {
      const response = await businessApi.getProfile()
      return response.data?.data || response.data
    },
    enabled: !isDemo,
    staleTime: 0 // Always fetch fresh data to get updated nextNumber after creating documents
  })

  // Compute resolved config (defaults merged with business overrides)
  const docTypeConfig = getDocTypeConfig(documentTypeKey, businessProfile?.documentTypeConfig)

  // Force basic mode when document type config requires simple/basic layout
  const forceBasic = docTypeConfig?.fields?.lineItemsLayout === 'basic' || docTypeConfig?.fields?.lineItemsLayout === 'simple'
  useEffect(() => {
    if (forceBasic && formMode !== 'basic') {
      setFormMode('basic')
    }
  }, [forceBasic])

  const {
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
    updateProductInLineItems,
    saveToLocal,
    resetForm,
    setInvoiceData
  } = useInvoiceForm()

  // Load existing invoice for edit mode
  const { data: existingInvoice, isLoading: isLoadingEdit } = useQuery({
    queryKey: ['invoice', editId],
    queryFn: async () => {
      const response = await invoiceApi.get(editId)
      return response.data
    },
    enabled: isEditMode && !isDemo
  })

  // Populate form with existing invoice data (edit mode)
  useEffect(() => {
    if (!isEditMode || !existingInvoice || editLoaded) return
    const inv = existingInvoice
    setInvoiceData({
      customerId: inv.customerId,
      customerName: inv.customer?.name || '',
      customerPhone: inv.customer?.phone || '',
      customerStateCode: inv.customerStateCode || null,
      fromAddress: inv.fromAddress || '',
      billTo: inv.billTo || '',
      shipTo: inv.shipTo || '',
      invoiceNumber: inv.invoiceNumber || '',
      date: inv.date ? inv.date.split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: inv.dueDate ? inv.dueDate.split('T')[0] : null,
      poNumber: inv.poNumber || '',
      lineItems: (inv.lineItems || []).map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        rate: item.rate,
        lineTotal: (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0),
        hsnCode: item.hsnCode || '',
        taxRate: item.taxRate || null,
        taxRateName: item.taxRateName || null,
        taxComponents: item.taxComponents || null,
        productServiceId: item.productServiceId || null
      })),
      discountTotal: inv.discountTotal || 0,
      taxRate: inv.taxRate || null,
      notes: inv.notes || '',
      terms: inv.terms || ''
    })
    if (inv.customer) {
      setSelectedCustomer(inv.customer)
    }
    // Set document type from existing invoice
    if (inv.documentType) {
      setDocumentTypeKey(inv.documentType)
      const docLabel = (DOCUMENT_TYPE_DEFAULTS[inv.documentType] || DOCUMENT_TYPE_DEFAULTS.invoice).label
      setInvoiceTitle(docLabel)
    }
    setEditLoaded(true)
    defaultsAppliedRef.current = true
  }, [isEditMode, existingInvoice, editLoaded])

  // Restore demo invoice data after signup/login
  useEffect(() => {
    if (isDemo || isEditMode) return
    const params = new URLSearchParams(location.search)
    if (params.get('restore') !== 'demo') return
    try {
      const raw = localStorage.getItem(DEMO_INVOICE_KEY)
      if (!raw) return
      const demoData = JSON.parse(raw)
      const inv = demoData.invoice
      if (inv) {
        setInvoiceData({
          fromAddress: inv.fromAddress || '',
          billTo: inv.billTo || '',
          shipTo: inv.shipTo || '',
          invoiceNumber: inv.invoiceNumber || '',
          date: inv.date || new Date().toISOString().split('T')[0],
          dueDate: inv.dueDate || null,
          poNumber: inv.poNumber || '',
          lineItems: (inv.lineItems || []).map(item => ({
            id: uuidv4(),
            name: item.name,
            quantity: item.quantity,
            rate: item.rate,
            lineTotal: (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0),
            hsnCode: item.hsnCode || '',
            taxRate: item.taxRate || null,
            taxRateName: item.taxRateName || null,
            taxComponents: item.taxComponents || null,
            productServiceId: item.productServiceId || null
          })),
          discountTotal: inv.discountTotal || 0,
          taxRate: inv.taxRate || null,
          notes: inv.notes || '',
          terms: inv.terms || ''
        })
        if (demoData.formMode) handleFormModeChange(demoData.formMode)
        defaultsAppliedRef.current = true
      }
      localStorage.removeItem(DEMO_INVOICE_KEY)
    } catch {}
  }, [location.search])

  // Populate form with clone data
  useEffect(() => {
    if (!cloneData || isEditMode) return
    setInvoiceData({
      customerId: cloneData.customerId,
      customerName: cloneData.customerName || '',
      customerPhone: cloneData.customerPhone || '',
      customerStateCode: cloneData.customerStateCode || null,
      fromAddress: cloneData.fromAddress || '',
      billTo: cloneData.billTo || '',
      shipTo: cloneData.shipTo || '',
      lineItems: (cloneData.lineItems || []).map(item => ({
        id: uuidv4(),
        name: item.name,
        quantity: item.quantity,
        rate: item.rate,
        lineTotal: (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0),
        hsnCode: item.hsnCode || '',
        taxRate: item.taxRate || null,
        taxRateName: item.taxRateName || null,
        taxComponents: item.taxComponents || null,
        productServiceId: item.productServiceId || null
      })),
      discountTotal: cloneData.discountTotal || 0,
      taxRate: cloneData.taxRate || null,
      notes: cloneData.notes || '',
      terms: cloneData.terms || ''
    })
    defaultsAppliedRef.current = true
  }, [cloneData, isEditMode])

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Filter to only valid line items (name + rate > 0)
      const validLineItems = invoice.lineItems
        .filter(item => item.name && item.name.trim() && parseFloat(item.rate) > 0)
        .map(item => ({
          name: item.name.trim(),
          quantity: parseFloat(item.quantity) || 1,
          rate: parseFloat(item.rate),
          hsnCode: item.hsnCode || null,
          taxRate: item.taxRate ? Number(item.taxRate) : null,
          taxRateName: item.taxRateName || null,
          taxComponents: item.taxComponents || null,
          productServiceId: item.productServiceId || null
        }))

      if (validLineItems.length === 0) {
        throw new Error('Please add at least one item with a name and rate')
      }

      const payload = {
        customerId: invoice.customerId || null,
        documentType: documentTypeKey,
        date: invoice.date,
        dueDate: invoice.dueDate || null,
        poNumber: invoice.poNumber || null,
        lineItems: validLineItems,
        discountTotal: parseFloat(invoice.discountTotal) || 0,
        taxRate: invoice.taxRate ? parseFloat(invoice.taxRate) : null,
        customerStateCode: invoice.customerStateCode || null,
        fromAddress: fromAddress || null,
        billTo: invoice.billTo || null,
        shipTo: invoice.shipTo || null,
        notes: invoice.notes || null,
        terms: invoice.terms || null
      }

      if (isEditMode) {
        const response = await invoiceApi.update(editId, payload)
        return response.data
      } else {
        const response = await invoiceApi.create(payload)
        return response.data
      }
    },
    onSuccess: (data) => {
      if (isEditMode) {
        // Invalidate and go back to detail page
        queryClient.invalidateQueries({ queryKey: ['invoice', editId] })
        queryClient.invalidateQueries({ queryKey: ['invoices'] })
        history.push(`/invoices/${editId}`)
      } else {
        // Reset form state for next invoice
        resetForm()
        setSelectedCustomer(null)
        setError('')
        defaultsAppliedRef.current = false
        // Refetch business profile to get updated nextInvoiceNumber
        queryClient.invalidateQueries({ queryKey: ['business'] })
        // Update sidebar plan usage count
        queryClient.invalidateQueries({ queryKey: ['plans', 'usage'] })
        queryClient.invalidateQueries({ queryKey: ['plan-usage'] })
        // Invalidate invoice list so Documents page shows the new record
        queryClient.invalidateQueries({ queryKey: ['invoices'] })
        // Update customer list (invoice counts may have changed)
        queryClient.invalidateQueries({ queryKey: ['customers'] })
        // Track for in-app review prompt
        trackInvoiceCreated()
        // Navigate to the created invoice
        history.push(`/invoices/${data.id}`)
      }
    },
    onError: (err) => {
      const errorData = err.response?.data?.error
      if (errorData?.code === 'PLAN_LIMIT_REACHED' || errorData?.details?.code === 'PLAN_LIMIT_REACHED') {
        const usagePayload = errorData.details?.usage || errorData.usage
        setPlanLimitData({ type: 'invoice', usage: usagePayload })
        return
      }
      setError(errorData?.message || err.message || (isEditMode ? 'Failed to update invoice' : 'Failed to create invoice'))
    }
  })

  const handleSave = async () => {
    setError('')

    // Pre-check invoice plan limit (only for new invoices, not edits)
    if (!isEditMode && !isDemo) {
      const blocked = await checkLimit('invoice')
      if (blocked) return
    }

    // Validate invoice number
    if (!invoice.invoiceNumber || !invoice.invoiceNumber.trim()) {
      setError('Invoice number is required')
      return
    }

    // Validate line items
    const validItems = invoice.lineItems.filter(item => item.name && item.rate > 0)
    if (validItems.length === 0) {
      setError('Please add at least one item with a name and rate')
      return
    }

    // Validate amounts are valid numbers
    for (const item of validItems) {
      if (isNaN(Number(item.rate)) || Number(item.rate) < 0) {
        setError(`Invalid rate for "${item.name}". Please enter a valid positive amount.`)
        return
      }
      if (item.quantity && (isNaN(Number(item.quantity)) || Number(item.quantity) <= 0)) {
        setError(`Invalid quantity for "${item.name}". Please enter a valid positive number.`)
        return
      }
    }

    // Demo mode: save ALL data to localStorage and redirect to signup
    if (isDemo) {
      try {
        const demoData = {
          formMode,
          documentTypeKey,
          invoice: {
            customerId: invoice.customerId,
            customerName: invoice.customerName,
            customerPhone: invoice.customerPhone,
            customerStateCode: invoice.customerStateCode,
            fromAddress: invoice.fromAddress,
            billTo: invoice.billTo,
            shipTo: invoice.shipTo,
            invoiceNumber: invoice.invoiceNumber,
            date: invoice.date,
            dueDate: invoice.dueDate,
            poNumber: invoice.poNumber,
            lineItems: invoice.lineItems,
            discountTotal: invoice.discountTotal,
            taxRate: invoice.taxRate,
            notes: invoice.notes,
            terms: invoice.terms
          },
          customers: getDemoCustomers(),
          products: getDemoProducts(),
          logo: getDemoLogo(),
          signature: getDemoSignature(),
          savedAt: new Date().toISOString()
        }
        localStorage.setItem(DEMO_INVOICE_KEY, JSON.stringify(demoData))
      } catch {}
      history.push('/auth/phone')
      return
    }

    saveMutation.mutate()
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0)
  }

  // Always apply invoice number from server for new invoices (not edit mode)
  // Uses per-document-type prefix/nextNumber from documentTypeConfig, falling back to business defaults
  useEffect(() => {
    if (isEditMode) return
    if (!businessProfile) return

    const docConfig = businessProfile.documentTypeConfig || {}
    const typeConfig = docConfig[documentTypeKey] || {}

    let prefix, nextNum
    if (documentTypeKey === 'invoice' && typeConfig.prefix === undefined && typeConfig.nextNumber === undefined) {
      // Legacy: use business-level invoicePrefix + nextInvoiceNumber for plain invoices
      prefix = businessProfile.invoicePrefix ?? ''
      nextNum = businessProfile.nextInvoiceNumber
    } else {
      prefix = typeConfig.prefix ?? docTypeConfig.prefix ?? businessProfile.invoicePrefix ?? ''
      nextNum = typeConfig.nextNumber || 1
    }

    if (nextNum != null) {
      updateField('invoiceNumber', `${prefix}${String(nextNum).padStart(4, '0')}`)
    }
  }, [businessProfile, isEditMode, documentTypeKey])

  // Build full FROM address from business profile
  const computeFromAddress = (bp) => {
    if (!bp) return ''
    const parts = [bp.name]
    if (bp.address) parts.push(bp.address)
    const contactParts = []
    if (bp.phone) contactParts.push(bp.phone)
    if (bp.email) contactParts.push(bp.email)
    if (contactParts.length) parts.push(contactParts.join(' | '))
    if (bp.website) parts.push(bp.website)
    if (bp.gstEnabled && bp.gstin) parts.push(`GSTIN: ${bp.gstin}`)
    return parts.join('\n')
  }

  // Apply default terms/notes and fromAddress only once on initial load (not on refetches)
  useEffect(() => {
    if (!businessProfile || defaultsAppliedRef.current) return
    // Per-document-type defaults from documentTypeConfig, falling back to business-level legacy fields
    const docConfig = businessProfile.documentTypeConfig || {}
    const typeConf = docConfig[documentTypeKey] || {}
    const defaultTerms = typeConf.defaultTerms || businessProfile.defaultTerms
    const defaultNotes = typeConf.defaultNotes || businessProfile.defaultNotes
    if (defaultTerms != null && !invoice.terms) {
      updateField('terms', defaultTerms)
    }
    if (defaultNotes != null && !invoice.notes) {
      updateField('notes', defaultNotes)
    }
    // Pre-populate fromAddress from business profile for new invoices
    if (!invoice.fromAddress) {
      const computed = computeFromAddress(businessProfile)
      if (computed) updateField('fromAddress', computed)
    }
    defaultsAppliedRef.current = true
  }, [businessProfile])

  // The fromAddress is now always stored at invoice level
  const fromAddress = invoice.fromAddress || ''

  return (
    <div className="p-1.5 md:p-4 relative">
      {/* Document Container */}
      <div className="max-w-5xl mx-auto bg-bgSecondary rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.04)] min-h-[500px] md:min-h-[700px] flex flex-col relative">
        {/* Toolbar: Basic/Advanced toggle + Invoice Title + Save */}
        <InvoiceFormToolbar
          formMode={formMode}
          onFormModeChange={handleFormModeChange}
          onSave={handleSave}
          isSaving={saveMutation.isPending}
          invoiceTitle={invoiceTitle}
          docTypeConfig={docTypeConfig}
        />

        {/* Error */}
        {error && (
          <div className="mx-2.5 md:mx-6 mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Invoice Form Content */}
        <div className="p-2.5 md:p-6 flex-1">
          {/* Header Section: From, Bill To, Ship To, Logo, Meta */}
          <InvoiceHeaderSection
            formMode={formMode}
            fromAddress={fromAddress}
            onFromAddressChange={(val) => updateField('fromAddress', val)}
            businessProfile={businessProfile}
            billTo={invoice.billTo || ''}
            onBillToChange={(val) => updateField('billTo', val)}
            selectedCustomer={selectedCustomer}
            onCustomerSelect={(customer) => {
              setSelectedCustomer(customer)
              setCustomer(customer)
              if (businessProfile?.enablePoNumber && customer?.poNumber) {
                updateField('poNumber', customer.poNumber)
              }
            }}
            onCreateNewCustomer={async (name) => {
              if (!isDemo) {
                const blocked = await checkLimit('customer')
                if (blocked) return
              }
              setCreateCustomerName(name || '')
              setShowCreateCustomer(true)
            }}
            onEditCustomer={(customer) => {
              setEditCustomer(customer)
              setShowCreateCustomer(true)
            }}
            shipTo={invoice.shipTo || ''}
            onShipToChange={(val) => updateField('shipTo', val)}
            invoiceNumber={invoice.invoiceNumber || ''}
            onInvoiceNumberChange={(val) => updateField('invoiceNumber', val)}
            invoiceDate={invoice.date || new Date().toISOString().split('T')[0]}
            onInvoiceDateChange={(val) => updateField('date', val)}
            poNumber={invoice.poNumber || ''}
            onPoNumberChange={(val) => updateField('poNumber', val)}
            dueDate={invoice.dueDate || ''}
            onDueDateChange={(val) => updateField('dueDate', val)}
            onLogoClick={() => setShowLogoUpload(true)}
            onEditSettings={isDemo ? undefined : () => setShowBusinessSettings(true)}
            demoLogoUrl={isDemo ? demoLogo : undefined}
            docTypeConfig={docTypeConfig}
            defaultFromExpanded={isDemo}
          />

          {/* Line Items Section */}
          <InvoiceLineItems
            formMode={formMode}
            lineItems={invoice.lineItems}
            onUpdateItem={updateLineItem}
            onAddItem={addLineItem}
            onRemoveItem={removeLineItem}
            onProductSelect={(index, product) => {
              setProductForLineItem(index, product)
            }}
            onCreateProduct={async (index, name) => {
              if (!isDemo) {
                const blocked = await checkLimit('product')
                if (blocked) return
              }
              setCreateProductLineIndex(index)
              setCreateProductName(name || '')
              setShowCreateProduct(true)
            }}
            onEditProduct={(product) => {
              setEditProduct(product)
              setShowCreateProduct(true)
            }}
            docTypeConfig={docTypeConfig}
            demoMode={isDemo}
          />

          {/* Totals Footer: Terms, Subtotal, Total, Signature */}
          <InvoiceTotalsFooter
            subtotal={invoice.subtotal}
            discountTotal={invoice.discountTotal}
            onDiscountChange={(val) => updateField('discountTotal', val)}
            taxRate={invoice.taxRate}
            taxTotal={invoice.taxTotal}
            total={invoice.total}
            terms={invoice.terms || ''}
            docTypeConfig={docTypeConfig}
            onTermsChange={(val) => {
              updateField('terms', val)
              // Debounced sync to business defaultTerms (skip in demo mode)
              if (!isDemo) {
                if (termsDebounceRef.current) clearTimeout(termsDebounceRef.current)
                termsDebounceRef.current = setTimeout(() => {
                  businessApi.updateProfile({ defaultTerms: val }).then(() => {
                    queryClient.invalidateQueries({ queryKey: ['business'] })
                  }).catch(() => {})
                }, 1500)
              }
            }}
            lineItems={invoice.lineItems}
            formatCurrency={formatCurrency}
            signatureUrl={isDemo ? demoSignature : businessProfile?.signatureUrl}
            signatureName={isDemo ? 'Your Business' : (businessProfile?.signatureName || businessProfile?.name)}
            onSignatureClick={() => setShowSignatureUpload(true)}
          />
        </div>

        {/* Bottom Action Bar */}
        <div className="bg-primary rounded-b-xl mt-auto safe-bottom">
          <button
            type="button"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="bg-primary text-white py-2.5 px-4 flex items-center justify-center gap-2 active:bg-primaryHover md:hover:bg-primaryHover transition-colors cursor-pointer w-full font-semibold text-sm tap-target-auto disabled:opacity-60"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <Save className="w-4 h-4 shrink-0" />
            )}
            {isEditMode ? `Update ${docTypeConfig.label}` : docTypeConfig.labels.saveButton}
          </button>
        </div>
      </div>


      {/* Create / Edit Customer Modal */}
      {isDemo ? (
        <CreateCustomerModal
          isOpen={showCreateCustomer}
          onClose={() => { setShowCreateCustomer(false); setEditCustomer(null) }}
          customer={editCustomer}
          initialName={createCustomerName}
          demoMode
          enablePoNumber={businessProfile?.enablePoNumber || false}
          onCreated={(customer) => {
            setSelectedCustomer(customer)
            setCustomer(customer)
            if (businessProfile?.enablePoNumber && customer?.poNumber) {
              updateField('poNumber', customer.poNumber)
            }
            setEditCustomer(null)
          }}
        />
      ) : (
        <CreateCustomerModal
          isOpen={showCreateCustomer}
          onClose={() => { setShowCreateCustomer(false); setEditCustomer(null) }}
          customer={editCustomer}
          initialName={createCustomerName}
          enablePoNumber={businessProfile?.enablePoNumber || false}
          onCreated={(customer) => {
            setSelectedCustomer(customer)
            setCustomer(customer)
            if (businessProfile?.enablePoNumber && customer?.poNumber) {
              updateField('poNumber', customer.poNumber)
            }
            setEditCustomer(null)
          }}
        />
      )}

      {/* Create / Edit Product Modal */}
      {isDemo ? (
        <ProductAddEditModal
          isOpen={showCreateProduct}
          onClose={() => { setShowCreateProduct(false); setEditProduct(null) }}
          product={editProduct}
          initialName={createProductName}
          demoMode
          onCreated={(product) => {
            if (editProduct) {
              updateProductInLineItems(product)
            } else if (createProductLineIndex !== null) {
              setProductForLineItem(createProductLineIndex, product)
            }
            setEditProduct(null)
          }}
        />
      ) : (
        <ProductAddEditModal
          isOpen={showCreateProduct}
          onClose={() => { setShowCreateProduct(false); setEditProduct(null) }}
          product={editProduct}
          initialName={createProductName}
          onCreated={(product) => {
            if (editProduct) {
              updateProductInLineItems(product)
            } else if (createProductLineIndex !== null) {
              setProductForLineItem(createProductLineIndex, product)
            }
            setEditProduct(null)
          }}
        />
      )}

      {/* Plan Limit Modal */}
      <PlanLimitModal
        isOpen={!!planLimitData}
        onClose={() => setPlanLimitData(null)}
        resourceType={planLimitData?.type || 'invoice'}
        usage={planLimitData?.usage}
      />

      {/* Business Settings Modal */}
      {!isDemo && (
        <BusinessSettingsModal
          isOpen={showBusinessSettings}
          onClose={async () => {
            setShowBusinessSettings(false)
            await queryClient.invalidateQueries({ queryKey: ['business'] })
            const freshBp = queryClient.getQueryData(['business'])
            if (freshBp) {
              const computed = computeFromAddress(freshBp)
              if (computed) updateField('fromAddress', computed)
            }
          }}
        />
      )}

      {/* Logo Upload Modal */}
      <ImageUploadModal
        isOpen={showLogoUpload}
        onClose={() => setShowLogoUpload(false)}
        title="Business Logo"
        subtitle="Upload or change your business logo"
        currentUrl={isDemo ? demoLogo : businessProfile?.logoUrl}
        onUploaded={(url) => {
          if (isDemo) {
            setDemoLogoState(url)
          } else {
            queryClient.invalidateQueries({ queryKey: ['business'] })
          }
        }}
        onRemove={isDemo ? () => { removeDemoLogo(); setDemoLogoState(null) } : async () => {
          await businessApi.updateProfile({ logoUrl: null })
          queryClient.invalidateQueries({ queryKey: ['business'] })
        }}
        uploadFn={isDemo ? async (file) => {
          return await setDemoLogo(file)
        } : async (file) => {
          const response = await businessApi.uploadLogo(file)
          return response.data?.data?.logoUrl || response.data?.logoUrl
        }}
      />

      {/* Signature Upload Modal */}
      <ImageUploadModal
        isOpen={showSignatureUpload}
        onClose={() => setShowSignatureUpload(false)}
        title="Signature"
        subtitle="Upload a signature image for your invoices"
        currentUrl={isDemo ? demoSignature : businessProfile?.signatureUrl}
        onUploaded={(url) => {
          if (isDemo) {
            setDemoSignatureState(url)
          } else {
            queryClient.invalidateQueries({ queryKey: ['business'] })
          }
        }}
        onRemove={isDemo ? () => { removeDemoSignature(); setDemoSignatureState(null) } : () => {
          businessApi.updateProfile({ signatureUrl: null })
          queryClient.invalidateQueries({ queryKey: ['business'] })
        }}
        uploadFn={isDemo ? async (file) => {
          return await setDemoSignature(file)
        } : async (file) => {
          const response = await businessApi.uploadSignature(file)
          return response.data?.data?.signatureUrl || response.data?.signatureUrl
        }}
      />
    </div>
  )
}
