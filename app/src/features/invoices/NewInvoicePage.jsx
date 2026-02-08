import { useState, useEffect, useRef } from 'react'
import { useHistory, useLocation, useParams } from 'react-router-dom'
import { Save, Loader2, ChevronDown } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useInvoiceForm } from './hooks/useInvoiceForm'
import { useAuthStore } from '../../store/authStore'
import { invoiceApi, businessApi } from '../../lib/api'
import { InvoiceFormToolbar, InvoiceHeaderSection, InvoiceLineItems, InvoiceTotalsFooter } from '../../components/invoice-form'
import CreateCustomerModal from '../../components/customers/CreateCustomerModal'
import ProductAddEditModal from '../products/ProductAddEditModal'
import PlanLimitModal from '../../components/PlanLimitModal'
import { ALL_INVOICE_TYPES } from '../../components/layout/navigationConfig'
import BusinessSettingsModal from '../../components/settings/BusinessSettingsModal'
import ImageUploadModal from '../../components/settings/ImageUploadModal'

const FORM_MODE_KEY = 'invoice_form_mode'

export default function NewInvoicePage() {
  const history = useHistory()
  const location = useLocation()
  const { id: editId } = useParams()
  const queryClient = useQueryClient()
  const business = useAuthStore((state) => state.business)
  const isEditMode = !!editId
  const cloneData = location.state?.clone || null
  const [error, setError] = useState('')
  const [editLoaded, setEditLoaded] = useState(false)
  const [formMode, setFormMode] = useState(() => {
    try { return localStorage.getItem(FORM_MODE_KEY) || 'basic' } catch { return 'basic' }
  })
  const [showCreateCustomer, setShowCreateCustomer] = useState(false)
  const [createCustomerName, setCreateCustomerName] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCreateProduct, setShowCreateProduct] = useState(false)
  const [createProductName, setCreateProductName] = useState('')
  const [createProductLineIndex, setCreateProductLineIndex] = useState(null)
  const [invoiceTitle, setInvoiceTitle] = useState('Invoice')
  const [showTitleDropdown, setShowTitleDropdown] = useState(false)
  const [showPlanLimit, setShowPlanLimit] = useState(false)
  const [planLimitData, setPlanLimitData] = useState(null)
  const [showBusinessSettings, setShowBusinessSettings] = useState(false)
  const [showLogoUpload, setShowLogoUpload] = useState(false)
  const [showSignatureUpload, setShowSignatureUpload] = useState(false)
  const termsDebounceRef = useRef(null)
  const defaultsAppliedRef = useRef(false)

  // Persist form mode selection
  const handleFormModeChange = (mode) => {
    setFormMode(mode)
    try { localStorage.setItem(FORM_MODE_KEY, mode) } catch {}
  }

  // Read ?type= query param and set invoice title on mount / URL change
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const typeKey = params.get('type')
    if (typeKey) {
      const found = ALL_INVOICE_TYPES.find(t => t.key === typeKey)
      if (found) setInvoiceTitle(found.label)
    }
  }, [location.search])

  // Fetch business profile — always fresh so invoice number + terms are current
  const { data: businessProfile } = useQuery({
    queryKey: ['business'],
    queryFn: async () => {
      const response = await businessApi.getProfile()
      return response.data?.data || response.data
    },
    staleTime: 0,
    refetchOnMount: 'always'
  })

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
    enabled: isEditMode
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
    setEditLoaded(true)
    defaultsAppliedRef.current = true
  }, [isEditMode, existingInvoice, editLoaded])

  // Populate form with clone data
  useEffect(() => {
    if (!cloneData || isEditMode) return
    setInvoiceData({
      customerId: cloneData.customerId,
      customerName: cloneData.customerName || '',
      customerPhone: cloneData.customerPhone || '',
      customerStateCode: cloneData.customerStateCode || null,
      shipTo: cloneData.shipTo || '',
      lineItems: (cloneData.lineItems || []).map(item => ({
        id: uuidv4(),
        name: item.name,
        quantity: item.quantity,
        rate: item.rate,
        lineTotal: (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0),
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
          productServiceId: item.productServiceId || null
        }))

      if (validLineItems.length === 0) {
        throw new Error('Please add at least one item with a name and rate')
      }

      const payload = {
        customerId: invoice.customerId || null,
        date: invoice.date,
        dueDate: invoice.dueDate || null,
        lineItems: validLineItems,
        discountTotal: parseFloat(invoice.discountTotal) || 0,
        taxRate: invoice.taxRate ? parseFloat(invoice.taxRate) : null,
        customerStateCode: invoice.customerStateCode || null,
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
        // Navigate to the created invoice
        history.push(`/invoices/${data.id}`)
      }
    },
    onError: (err) => {
      const errorData = err.response?.data?.error
      if (errorData?.code === 'PLAN_LIMIT_REACHED' || errorData?.details?.code === 'PLAN_LIMIT_REACHED') {
        setPlanLimitData(errorData.details?.usage || errorData.usage)
        setShowPlanLimit(true)
        return
      }
      setError(errorData?.message || err.message || (isEditMode ? 'Failed to update invoice' : 'Failed to create invoice'))
    }
  })

  const handleSave = () => {
    setError('')
    const validItems = invoice.lineItems.filter(item => item.name && item.rate > 0)
    if (validItems.length === 0) {
      setError('Please add at least one item with a name and rate')
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
  useEffect(() => {
    if (isEditMode) return
    if (!businessProfile) return
    if (businessProfile.invoicePrefix != null && businessProfile.nextInvoiceNumber != null) {
      const nextNum = String(businessProfile.nextInvoiceNumber).padStart(4, '0')
      updateField('invoiceNumber', `${businessProfile.invoicePrefix}${nextNum}`)
    }
  }, [businessProfile, isEditMode])

  // Apply default terms only once on initial load (not on refetches from debounced save)
  useEffect(() => {
    if (!businessProfile || defaultsAppliedRef.current) return
    if (businessProfile.defaultTerms != null && !invoice.terms) {
      updateField('terms', businessProfile.defaultTerms)
    }
    defaultsAppliedRef.current = true
  }, [businessProfile])

  // Build full FROM address from business profile
  const fromAddress = (() => {
    const bp = businessProfile
    if (!bp) return business?.name || ''
    const parts = [bp.name]
    if (bp.address) parts.push(bp.address)
    const contactParts = []
    if (bp.phone) contactParts.push(bp.phone)
    if (bp.email) contactParts.push(bp.email)
    if (contactParts.length) parts.push(contactParts.join(' | '))
    if (bp.website) parts.push(bp.website)
    if (bp.gstEnabled && bp.gstin) parts.push(`GSTIN: ${bp.gstin}`)
    return parts.join('\n')
  })()

  return (
    <div className="p-2 md:p-6 relative">
      {/* Document Container */}
      <div className="max-w-5xl mx-auto bg-bgSecondary rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.04)] min-h-[600px] md:min-h-[800px] flex flex-col relative">
        {/* Toolbar: Basic/Advanced toggle + Invoice Title + Save */}
        <InvoiceFormToolbar
          formMode={formMode}
          onFormModeChange={handleFormModeChange}
          onSave={handleSave}
          isSaving={saveMutation.isPending}
          invoiceTitle={invoiceTitle}
          onInvoiceTitleChange={setInvoiceTitle}
          showTitleDropdown={showTitleDropdown}
          onToggleTitleDropdown={() => setShowTitleDropdown(!showTitleDropdown)}
          onCloseTitleDropdown={() => setShowTitleDropdown(false)}
        />

        {/* Error */}
        {error && (
          <div className="mx-3 md:mx-8 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Invoice Form Content */}
        <div className="p-3 md:p-10 flex-1">
          {/* Header Section: From, Bill To, Ship To, Logo, Meta */}
          <InvoiceHeaderSection
            formMode={formMode}
            fromAddress={fromAddress}
            onFromAddressChange={() => {}}
            businessProfile={businessProfile}
            billTo={invoice.customerName || ''}
            onBillToChange={(val) => updateField('customerName', val)}
            selectedCustomer={selectedCustomer}
            onCustomerSelect={(customer) => {
              setSelectedCustomer(customer)
              setCustomer(customer)
            }}
            onCreateNewCustomer={(name) => {
              setCreateCustomerName(name || '')
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
            onEditSettings={() => setShowBusinessSettings(true)}
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
            onCreateProduct={(index, name) => {
              setCreateProductLineIndex(index)
              setCreateProductName(name || '')
              setShowCreateProduct(true)
            }}
          />

          {/* Totals Footer: Terms, Subtotal, Total, Signature */}
          <InvoiceTotalsFooter
            subtotal={invoice.subtotal}
            discountTotal={invoice.discountTotal}
            taxRate={invoice.taxRate}
            taxTotal={invoice.taxTotal}
            total={invoice.total}
            terms={invoice.terms || ''}
            onTermsChange={(val) => {
              updateField('terms', val)
              // Debounced sync to business defaultTerms
              if (termsDebounceRef.current) clearTimeout(termsDebounceRef.current)
              termsDebounceRef.current = setTimeout(() => {
                businessApi.updateProfile({ defaultTerms: val }).then(() => {
                  queryClient.invalidateQueries({ queryKey: ['business'] })
                }).catch(() => {})
              }, 1500)
            }}
            lineItems={invoice.lineItems}
            formatCurrency={formatCurrency}
            signatureUrl={businessProfile?.signatureUrl}
            signatureName={businessProfile?.signatureName || businessProfile?.name}
            onSignatureClick={() => setShowSignatureUpload(true)}
          />
        </div>

        {/* Bottom Action Bar */}
        <div
          onClick={handleSave}
          className="bg-primary text-white p-4 rounded-b-xl flex justify-center items-center shadow-lg active:bg-primaryHover md:hover:bg-primaryHover transition-colors cursor-pointer mt-auto safe-bottom"
        >
          <button className="font-semibold text-sm flex items-center gap-2" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEditMode ? 'Update Invoice' : 'Save Invoice'}
          </button>
        </div>
      </div>

      {/* Footer — hidden on mobile */}
      <div className="hidden md:block text-center mt-4 md:mt-6 mb-4">
        <p className="text-xs text-textSecondary">© 2026 Invoice Baba. All rights reserved.</p>
      </div>

      {/* Create Customer Modal */}
      <CreateCustomerModal
        isOpen={showCreateCustomer}
        onClose={() => setShowCreateCustomer(false)}
        initialName={createCustomerName}
        onCreated={(customer) => {
          setSelectedCustomer(customer)
          setCustomer(customer)
        }}
      />

      {/* Create Product Modal */}
      <ProductAddEditModal
        isOpen={showCreateProduct}
        onClose={() => setShowCreateProduct(false)}
        initialName={createProductName}
        onCreated={(product) => {
          if (createProductLineIndex !== null) {
            setProductForLineItem(createProductLineIndex, product)
          }
        }}
      />

      {/* Plan Limit Modal */}
      <PlanLimitModal
        isOpen={showPlanLimit}
        onClose={() => setShowPlanLimit(false)}
        usage={planLimitData?.usage || planLimitData}
        plan={planLimitData?.plan || planLimitData}
      />

      {/* Business Settings Modal */}
      <BusinessSettingsModal
        isOpen={showBusinessSettings}
        onClose={() => {
          setShowBusinessSettings(false)
          // Re-read business settings so terms, invoice number, etc. update
          queryClient.invalidateQueries({ queryKey: ['business'] })
        }}
      />

      {/* Logo Upload Modal */}
      <ImageUploadModal
        isOpen={showLogoUpload}
        onClose={() => setShowLogoUpload(false)}
        title="Business Logo"
        subtitle="Upload or change your business logo"
        currentUrl={businessProfile?.logoUrl}
        onUploaded={() => {
          queryClient.invalidateQueries({ queryKey: ['business'] })
        }}
        onRemove={async () => {
          await businessApi.updateProfile({ logoUrl: null })
          queryClient.invalidateQueries({ queryKey: ['business'] })
        }}
        uploadFn={async (file) => {
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
        currentUrl={businessProfile?.signatureUrl}
        onUploaded={(url) => {
          queryClient.invalidateQueries({ queryKey: ['business'] })
        }}
        onRemove={() => {
          businessApi.updateProfile({ signatureUrl: null })
          queryClient.invalidateQueries({ queryKey: ['business'] })
        }}
        uploadFn={async (file) => {
          const response = await businessApi.uploadSignature(file)
          return response.data?.data?.signatureUrl || response.data?.signatureUrl
        }}
      />
    </div>
  )
}
