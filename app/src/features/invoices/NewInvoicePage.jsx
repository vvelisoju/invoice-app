import { useState, useEffect } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { Save, Loader2, ChevronDown } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useInvoiceForm } from './hooks/useInvoiceForm'
import { useAuthStore } from '../../store/authStore'
import { invoiceApi, businessApi } from '../../lib/api'
import { InvoiceFormToolbar, InvoiceHeaderSection, InvoiceLineItems, InvoiceTotalsFooter } from '../../components/invoice-form'
import CreateCustomerModal from '../../components/customers/CreateCustomerModal'
import ProductAddEditModal from '../products/ProductAddEditModal'
import { ALL_INVOICE_TYPES } from '../../components/layout/navigationConfig'

export default function NewInvoicePage() {
  const history = useHistory()
  const location = useLocation()
  const business = useAuthStore((state) => state.business)
  const [error, setError] = useState('')
  const [formMode, setFormMode] = useState('basic')
  const [showCreateCustomer, setShowCreateCustomer] = useState(false)
  const [createCustomerName, setCreateCustomerName] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCreateProduct, setShowCreateProduct] = useState(false)
  const [createProductName, setCreateProductName] = useState('')
  const [createProductLineIndex, setCreateProductLineIndex] = useState(null)
  const [invoiceTitle, setInvoiceTitle] = useState('Invoice')
  const [showTitleDropdown, setShowTitleDropdown] = useState(false)
  const [termsLoaded, setTermsLoaded] = useState(false)

  // Read ?type= query param and set invoice title on mount / URL change
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const typeKey = params.get('type')
    if (typeKey) {
      const found = ALL_INVOICE_TYPES.find(t => t.key === typeKey)
      if (found) setInvoiceTitle(found.label)
    }
  }, [location.search])

  // Fetch business profile for default terms
  const { data: businessProfile } = useQuery({
    queryKey: ['business'],
    queryFn: async () => {
      const response = await businessApi.getProfile()
      return response.data?.data || response.data
    }
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
    resetForm
  } = useInvoiceForm()

  const createMutation = useMutation({
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

      const response = await invoiceApi.create({
        customerId: invoice.customerId || null,
        date: invoice.date,
        dueDate: invoice.dueDate || null,
        lineItems: validLineItems,
        discountTotal: parseFloat(invoice.discountTotal) || 0,
        taxRate: invoice.taxRate ? parseFloat(invoice.taxRate) : null,
        customerStateCode: invoice.customerStateCode || null,
        notes: invoice.notes || null,
        terms: invoice.terms || null
      })
      return response.data
    },
    onSuccess: (data) => {
      history.push(`/invoices/${data.id}`)
    },
    onError: (err) => {
      setError(err.response?.data?.error?.message || err.message || 'Failed to create invoice')
    }
  })

  const handleSave = () => {
    setError('')
    const validItems = invoice.lineItems.filter(item => item.name && item.rate > 0)
    if (validItems.length === 0) {
      setError('Please add at least one item with a name and rate')
      return
    }
    createMutation.mutate()
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0)
  }

  // Pre-populate terms and invoice number from business defaults (once)
  useEffect(() => {
    if (businessProfile && !termsLoaded) {
      if (businessProfile.defaultTerms && !invoice.terms) {
        updateField('terms', businessProfile.defaultTerms)
      }
      if (!invoice.invoiceNumber && businessProfile.invoicePrefix != null && businessProfile.nextInvoiceNumber != null) {
        const nextNum = String(businessProfile.nextInvoiceNumber).padStart(4, '0')
        updateField('invoiceNumber', `${businessProfile.invoicePrefix}${nextNum}`)
      }
      setTermsLoaded(true)
    }
  }, [businessProfile, termsLoaded, invoice.terms, invoice.invoiceNumber, updateField])

  const fromAddress = business?.name || ''

  return (
    <div className="p-2 md:p-6 relative">
      {/* Document Container */}
      <div className={`${formMode === 'advanced' ? 'max-w-5xl' : 'max-w-4xl'} mx-auto bg-bgSecondary rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.04)] min-h-[600px] md:min-h-[800px] flex flex-col relative`}>
        {/* Toolbar: Basic/Advanced toggle + Preview + Save */}
        <InvoiceFormToolbar
          formMode={formMode}
          onFormModeChange={setFormMode}
          onSave={handleSave}
          isSaving={createMutation.isPending}
        />

        {/* Error */}
        {error && (
          <div className="mx-3 md:mx-8 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Invoice Form Content */}
        <div className="p-3 md:p-10 flex-1">
          {/* Invoice Title Selector */}
          <div className="mb-6 flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowTitleDropdown(!showTitleDropdown)}
                onBlur={() => setTimeout(() => setShowTitleDropdown(false), 150)}
                className="text-2xl md:text-3xl font-bold text-textPrimary tracking-tight flex items-center gap-2 hover:text-primary transition-colors group"
              >
                {invoiceTitle}
                <ChevronDown className="w-5 h-5 text-textSecondary/40 group-hover:text-primary transition-colors" />
              </button>
              {showTitleDropdown && (
                <div className="absolute top-full left-0 z-50 mt-1 bg-white border border-border rounded-xl shadow-lg overflow-hidden min-w-[200px]">
                  {ALL_INVOICE_TYPES.map((type) => (
                    <button
                      key={type.key}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setInvoiceTitle(type.label); setShowTitleDropdown(false) }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors border-b border-border/30 last:border-b-0 ${
                        invoiceTitle === type.label
                          ? 'bg-blue-50 text-primary font-semibold'
                          : 'text-textPrimary hover:bg-gray-50 font-medium'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Header Section: From, Bill To, Ship To, Logo, Meta */}
          <InvoiceHeaderSection
            formMode={formMode}
            fromAddress={fromAddress}
            onFromAddressChange={() => {}}
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
            shipTo=""
            onShipToChange={() => {}}
            invoiceNumber={invoice.invoiceNumber || ''}
            onInvoiceNumberChange={(val) => updateField('invoiceNumber', val)}
            invoiceDate={invoice.date || new Date().toISOString().split('T')[0]}
            onInvoiceDateChange={(val) => updateField('date', val)}
            poNumber=""
            onPoNumberChange={() => {}}
            dueDate={invoice.dueDate || ''}
            onDueDateChange={(val) => updateField('dueDate', val)}
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
            onTermsChange={(val) => updateField('terms', val)}
            lineItems={invoice.lineItems}
            formatCurrency={formatCurrency}
          />
        </div>

        {/* Bottom Action Bar */}
        <div
          onClick={handleSave}
          className="bg-primary text-white p-4 rounded-b-xl flex justify-center items-center shadow-lg active:bg-primaryHover md:hover:bg-primaryHover transition-colors cursor-pointer mt-auto safe-bottom"
        >
          <button className="font-semibold text-sm flex items-center gap-2" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Invoice
          </button>
        </div>
      </div>

      {/* Footer — hidden on mobile */}
      <div className="hidden md:block text-center mt-4 md:mt-6 mb-4">
        <p className="text-xs text-textSecondary">© 2026 InvoiceApp. All rights reserved.</p>
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
    </div>
  )
}
