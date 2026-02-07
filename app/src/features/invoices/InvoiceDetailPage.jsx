import { useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import {
  FileText,
  Share2,
  CheckCircle,
  XCircle,
  Pencil,
  Trash2,
  MoreVertical,
  Loader2
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoiceApi } from '../../lib/api'
import { PageHeader } from '../../components/layout'

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ISSUED: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  VOID: 'bg-gray-200 text-gray-700'
}

const STATUS_LABELS = {
  DRAFT: 'Draft',
  ISSUED: 'Issued',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
  VOID: 'Void'
}

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const history = useHistory()
  const queryClient = useQueryClient()
  const [showActions, setShowActions] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showStatusConfirm, setShowStatusConfirm] = useState(false)
  const [pendingStatus, setPendingStatus] = useState(null)

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const response = await invoiceApi.get(id)
      return response.data
    }
  })

  const statusMutation = useMutation({
    mutationFn: ({ status }) => invoiceApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoice', id])
      queryClient.invalidateQueries(['invoices'])
      setShowStatusConfirm(false)
      setPendingStatus(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: () => invoiceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices'])
      history.replace('/invoices')
    }
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 text-center py-20">
        <h2 className="text-xl font-semibold text-textPrimary mb-4">Invoice not found</h2>
        <button
          onClick={() => history.push('/invoices')}
          className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium"
        >
          Back to Invoices
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <PageHeader
        title={`Invoice #${invoice.invoiceNumber}`}
        backTo="/invoices"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => history.push(`/invoices/${id}/pdf`)}
              className="px-4 py-2 text-sm font-medium text-textSecondary hover:bg-bgPrimary rounded-lg border border-border transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              View PDF
            </button>
            <button
              onClick={() => history.push(`/invoices/${id}/pdf`)}
              className="px-4 py-2 text-sm font-medium text-textSecondary hover:bg-bgPrimary rounded-lg border border-border transition-colors flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="w-9 h-9 flex items-center justify-center text-textSecondary hover:bg-bgPrimary rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showActions && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-bgSecondary border border-border rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                    {invoice.status === 'DRAFT' && (
                      <>
                        <button
                          onClick={() => { setShowActions(false); history.push(`/invoices/${id}/edit`) }}
                          className="w-full px-4 py-2.5 text-sm text-left text-textPrimary hover:bg-bgPrimary flex items-center gap-2"
                        >
                          <Pencil className="w-4 h-4" /> Edit Invoice
                        </button>
                        <button
                          onClick={() => { setShowActions(false); setShowDeleteConfirm(true) }}
                          className="w-full px-4 py-2.5 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </>
                    )}
                    {invoice.status === 'ISSUED' && (
                      <>
                        <button
                          onClick={() => { setShowActions(false); setPendingStatus('PAID'); setShowStatusConfirm(true) }}
                          className="w-full px-4 py-2.5 text-sm text-left text-green-600 hover:bg-green-50 flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" /> Mark as Paid
                        </button>
                        <button
                          onClick={() => { setShowActions(false); setPendingStatus('CANCELLED'); setShowStatusConfirm(true) }}
                          className="w-full px-4 py-2.5 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" /> Cancel Invoice
                        </button>
                      </>
                    )}
                    {invoice.status === 'PAID' && (
                      <button
                        onClick={() => { setShowActions(false); setPendingStatus('ISSUED'); setShowStatusConfirm(true) }}
                        className="w-full px-4 py-2.5 text-sm text-left text-textPrimary hover:bg-bgPrimary flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" /> Mark as Unpaid
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Amount */}
          <div className="bg-bgSecondary rounded-xl border border-border shadow-card p-6 text-center">
            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-3 ${STATUS_COLORS[invoice.status]}`}>
              {STATUS_LABELS[invoice.status]}
            </span>
            <div className="text-3xl font-bold text-primary">{formatCurrency(invoice.total)}</div>
            <p className="text-sm text-textSecondary mt-1">{formatDate(invoice.date)}</p>
          </div>

          {/* Line Items */}
          <div className="bg-bgSecondary rounded-xl border border-border shadow-card overflow-hidden">
            <div className="px-6 py-3 border-b border-border bg-bgPrimary/50">
              <h3 className="text-xs font-bold text-textSecondary uppercase tracking-wider">
                Items ({invoice.lineItems?.length || 0})
              </h3>
            </div>
            {invoice.lineItems?.map((item, index) => (
              <div key={index} className="px-6 py-4 border-b border-border last:border-b-0 flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium text-textPrimary">{item.name}</div>
                  <div className="text-xs text-textSecondary">{item.quantity} × {formatCurrency(item.rate)}</div>
                </div>
                <span className="text-sm font-semibold text-textPrimary">{formatCurrency(item.lineTotal)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="bg-bgSecondary rounded-xl border border-border shadow-card p-6">
            <div className="max-w-xs ml-auto space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-textSecondary">Subtotal</span>
                <span className="text-textPrimary">{formatCurrency(invoice.subtotal)}</span>
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
                  <span className="text-textPrimary">{formatCurrency(invoice.taxTotal)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-dashed border-border">
                <strong className="text-textPrimary">Total</strong>
                <strong className="text-primary">{formatCurrency(invoice.total)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-bgSecondary rounded-xl border border-border shadow-card p-6">
            <h3 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-3">Customer</h3>
            <div className="text-sm font-semibold text-textPrimary">{invoice.customer?.name || 'No customer'}</div>
            {invoice.customer?.phone && <p className="text-sm text-textSecondary mt-1">{invoice.customer.phone}</p>}
            {invoice.customer?.address && <p className="text-sm text-textSecondary mt-1">{invoice.customer.address}</p>}
          </div>

          {/* Notes & Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="bg-bgSecondary rounded-xl border border-border shadow-card p-6 space-y-4">
              {invoice.notes && (
                <div>
                  <h4 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-1">Notes</h4>
                  <p className="text-sm text-textPrimary">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <h4 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-1">Terms</h4>
                  <p className="text-sm text-textPrimary">{invoice.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-bgSecondary rounded-2xl shadow-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-2">Delete Invoice</h3>
            <p className="text-sm text-textSecondary mb-6">Are you sure you want to delete this draft invoice? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-sm font-medium text-textSecondary hover:bg-bgPrimary rounded-lg">Cancel</button>
              <button onClick={() => deleteMutation.mutate()} className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      {showStatusConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-bgSecondary rounded-2xl shadow-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-2">Change Status</h3>
            <p className="text-sm text-textSecondary mb-6">Are you sure you want to mark this invoice as {STATUS_LABELS[pendingStatus]}?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowStatusConfirm(false); setPendingStatus(null) }} className="px-4 py-2 text-sm font-medium text-textSecondary hover:bg-bgPrimary rounded-lg">Cancel</button>
              <button onClick={() => statusMutation.mutate({ status: pendingStatus })} className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primaryHover rounded-lg">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
