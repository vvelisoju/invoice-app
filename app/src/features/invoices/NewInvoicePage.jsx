import { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { Save, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useInvoiceForm } from './hooks/useInvoiceForm'
import { useAuthStore } from '../../store/authStore'
import { invoiceApi } from '../../lib/api'
import { InvoiceFormToolbar, InvoiceHeaderSection, InvoiceLineItems, InvoiceTotalsFooter } from '../../components/invoice-form'

export default function NewInvoicePage() {
  const history = useHistory()
  const business = useAuthStore((state) => state.business)
  const [error, setError] = useState('')
  const [formMode, setFormMode] = useState('basic')

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

  const issueMutation = useMutation({
    mutationFn: async () => {
      const response = await invoiceApi.create({
        id: invoice.id,
        customerId: invoice.customerId,
        date: invoice.date,
        dueDate: invoice.dueDate,
        lineItems: invoice.lineItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          rate: item.rate,
          productServiceId: item.productServiceId
        })),
        discountTotal: invoice.discountTotal,
        taxRate: invoice.taxRate,
        customerStateCode: invoice.customerStateCode,
        notes: invoice.notes,
        terms: invoice.terms
      })
      const issued = await invoiceApi.issue(response.data.id, {
        templateBaseId: null,
        templateConfigSnapshot: null,
        templateVersion: null
      })
      return issued.data
    },
    onSuccess: (data) => {
      history.push(`/invoices/${data.id}/pdf`)
    },
    onError: (err) => {
      setError(err.response?.data?.error?.message || 'Failed to issue invoice')
    }
  })

  const handleSave = () => {
    setError('')
    const validItems = invoice.lineItems.filter(item => item.name && item.rate > 0)
    if (validItems.length === 0) {
      setError('Please add at least one item with a name and rate')
      return
    }
    issueMutation.mutate()
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0)
  }

  const fromAddress = business?.name || ''

  return (
    <div className="p-4 md:p-8 relative">
      {/* Document Container */}
      <div className={`${formMode === 'advanced' ? 'max-w-5xl' : 'max-w-4xl'} mx-auto bg-bgSecondary rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.04)] min-h-[800px] flex flex-col relative`}>
        {/* Toolbar: Basic/Advanced toggle + Preview + Save */}
        <InvoiceFormToolbar
          formMode={formMode}
          onFormModeChange={setFormMode}
          onSave={handleSave}
          isSaving={issueMutation.isPending}
        />

        {/* Error */}
        {error && (
          <div className="mx-8 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Invoice Form Content */}
        <div className="p-8 md:p-12 flex-1">
          {/* Header Section: From, Bill To, Ship To, Logo, Meta */}
          <InvoiceHeaderSection
            formMode={formMode}
            fromAddress={fromAddress}
            onFromAddressChange={() => {}}
            billTo={invoice.customerName || ''}
            onBillToChange={(val) => updateField('customerName', val)}
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
            formatCurrency={formatCurrency}
          />
        </div>

        {/* Bottom Action Bar */}
        <div
          onClick={handleSave}
          className="bg-primary text-white p-4 rounded-b-xl flex justify-center items-center shadow-lg hover:bg-primaryHover transition-colors cursor-pointer mt-auto"
        >
          <button className="font-semibold text-sm flex items-center gap-2" disabled={issueMutation.isPending}>
            {issueMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Invoice
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 mb-4">
        <p className="text-xs text-textSecondary">© 2026 InvoiceApp. All rights reserved.</p>
      </div>
    </div>
  )
}
