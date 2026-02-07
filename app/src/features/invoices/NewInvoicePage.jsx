import { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { Plus, Trash2, FileText, Save, Loader2, ChevronDown } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useInvoiceForm } from './hooks/useInvoiceForm'
import CustomerTypeahead from './components/CustomerTypeahead'
import { invoiceApi } from '../../lib/api'
import { PageHeader } from '../../components/layout'

export default function NewInvoicePage() {
  const history = useHistory()
  const [error, setError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

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

  const handleGeneratePDF = () => {
    setError('')
    if (!invoice.customerName && !invoice.customerId) {
      setError('Please add a customer')
      return
    }
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="New Invoice"
        subtitle={isSaving ? 'Saving...' : lastSaved ? 'Saved' : undefined}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={saveToLocal}
              disabled={!isDirty || isSaving}
              className="px-4 py-2 text-sm text-textSecondary hover:bg-bgPrimary rounded-lg transition-all font-medium border border-border disabled:opacity-50"
            >
              <Save className="w-4 h-4 inline mr-1.5" />
              Save Draft
            </button>
            <button
              onClick={handleGeneratePDF}
              disabled={issueMutation.isPending}
              className="px-5 py-2 bg-primary hover:bg-primaryHover text-white rounded-lg transition-all font-medium text-sm shadow-sm flex items-center gap-2 disabled:opacity-60"
            >
              {issueMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Generate PDF
            </button>
          </div>
        }
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-bgSecondary rounded-xl shadow-card border border-border">
        <div className="p-6 md:p-8">
          {/* Invoice Meta */}
          <div className="flex items-center gap-6 mb-8 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <div>
              <span className="text-[11px] font-bold text-textSecondary uppercase tracking-wider">Invoice #</span>
              <div className="text-sm font-semibold text-textPrimary">{invoice.invoiceNumber || 'Auto-generated'}</div>
            </div>
            <div>
              <span className="text-[11px] font-bold text-textSecondary uppercase tracking-wider">Date</span>
              <div className="text-sm font-semibold text-textPrimary">{formatDate(invoice.date)}</div>
            </div>
          </div>

          {/* Customer */}
          <div className="mb-8">
            <CustomerTypeahead
              value={invoice.customerName}
              onChange={(value) => updateField('customerName', value)}
              onSelect={setCustomer}
            />
          </div>

          {/* Line Items */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-textPrimary">Items</h3>
              <button
                onClick={addLineItem}
                className="text-sm text-primary hover:text-primaryHover font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {/* Header */}
            <div className="grid grid-cols-12 gap-3 px-3 py-2 border-b border-border mb-2">
              <div className="col-span-5 text-[11px] font-bold text-textSecondary uppercase tracking-wider">Item</div>
              <div className="col-span-2 text-[11px] font-bold text-textSecondary uppercase tracking-wider">Qty</div>
              <div className="col-span-2 text-[11px] font-bold text-textSecondary uppercase tracking-wider">Rate</div>
              <div className="col-span-2 text-[11px] font-bold text-textSecondary uppercase tracking-wider text-right">Total</div>
              <div className="col-span-1"></div>
            </div>

            {/* Rows */}
            <div className="space-y-2">
              {invoice.lineItems.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-3 items-center p-3 bg-bgPrimary/30 hover:bg-bgPrimary/50 rounded-lg transition-colors group">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateLineItem(index, 'name', e.target.value)}
                      placeholder="Item name"
                      className="w-full bg-transparent text-sm text-textPrimary placeholder-textSecondary/40 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                      placeholder="1"
                      className="w-full bg-white px-2 py-1.5 rounded border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm text-right transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => updateLineItem(index, 'rate', e.target.value)}
                      placeholder="0"
                      className="w-full bg-white px-2 py-1.5 rounded border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm text-right transition-all"
                    />
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-semibold text-textPrimary">{formatCurrency(item.lineTotal)}</span>
                  </div>
                  <div className="col-span-1 text-right">
                    {invoice.lineItems.length > 1 && (
                      <button
                        onClick={() => removeLineItem(index)}
                        className="w-7 h-7 flex items-center justify-center text-textSecondary hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-border pt-6 mb-6">
            <div className="max-w-xs ml-auto space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-textSecondary">Subtotal</span>
                <span className="font-semibold text-textPrimary">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discountTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-textSecondary">Discount</span>
                  <span className="text-red-500">-{formatCurrency(invoice.discountTotal)}</span>
                </div>
              )}
              {invoice.taxTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-textSecondary">Tax ({invoice.taxRate}%)</span>
                  <span className="font-semibold text-textPrimary">{formatCurrency(invoice.taxTotal)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-dashed border-border">
                <span className="text-lg font-bold text-textPrimary">Total</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* Advanced Details */}
          <div className="border-t border-border pt-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-textSecondary hover:text-textPrimary transition-colors mb-4"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              Additional Details
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block">Discount (₹)</label>
                  <input
                    type="number"
                    value={invoice.discountTotal || ''}
                    onChange={(e) => updateField('discountTotal', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-bgPrimary border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={invoice.taxRate || ''}
                    onChange={(e) => updateField('taxRate', parseFloat(e.target.value) || null)}
                    placeholder="e.g., 18"
                    className="w-full px-3 py-2 bg-bgPrimary border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block">Due Date</label>
                  <input
                    type="date"
                    value={invoice.dueDate || ''}
                    onChange={(e) => updateField('dueDate', e.target.value)}
                    className="w-full px-3 py-2 bg-bgPrimary border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block">Notes</label>
                  <textarea
                    value={invoice.notes || ''}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder="Add notes for the customer"
                    rows={3}
                    className="w-full px-3 py-2 bg-bgPrimary border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block">Terms & Conditions</label>
                  <textarea
                    value={invoice.terms || ''}
                    onChange={(e) => updateField('terms', e.target.value)}
                    placeholder="Payment terms, etc."
                    rows={3}
                    className="w-full px-3 py-2 bg-bgPrimary border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
