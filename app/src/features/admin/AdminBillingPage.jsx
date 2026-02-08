import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../lib/api'
import {
  Search, Loader2, Receipt, IndianRupee,
  CheckCircle2, Clock, XCircle, AlertTriangle, Eye, X
} from 'lucide-react'
import Portal from '../../components/Portal'

const STATUS_CONFIG = {
  PAID: { label: 'Paid', icon: CheckCircle2, bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  PENDING: { label: 'Pending', icon: Clock, bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  FAILED: { label: 'Failed', icon: XCircle, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  REFUNDED: { label: 'Refunded', icon: AlertTriangle, bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return '₹0.00'
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

// ── Invoice Detail Modal ───────────────────────────────────────────
function InvoiceDetailModal({ invoice, onClose }) {
  if (!invoice) return null
  const taxBreakup = invoice.taxBreakup || {}

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-5 md:p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Subscription Invoice</h2>
                <p className="text-sm text-gray-500 font-mono mt-0.5">{invoice.invoiceNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={invoice.status} />
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-400" /></button>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 mb-0.5">Invoice Date</p>
                <p className="font-semibold text-gray-900">{formatDate(invoice.createdAt)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 mb-0.5">Billing Period</p>
                <p className="font-semibold text-gray-900 capitalize">{invoice.billingPeriod || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 mb-0.5">Period Start</p>
                <p className="font-semibold text-gray-900">{formatDate(invoice.periodStart)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 mb-0.5">Period End</p>
                <p className="font-semibold text-gray-900">{formatDate(invoice.periodEnd)}</p>
              </div>
            </div>

            {/* Seller / Buyer */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">From (Seller)</p>
                <p className="font-semibold text-gray-900">{invoice.sellerName}</p>
                {invoice.sellerGstin && <p className="text-gray-500">GSTIN: {invoice.sellerGstin}</p>}
                {invoice.sellerAddress && <p className="text-gray-500 mt-0.5">{invoice.sellerAddress}</p>}
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">To (Buyer)</p>
                <p className="font-semibold text-gray-900">{invoice.buyerName}</p>
                {invoice.buyerGstin && <p className="text-gray-500">GSTIN: {invoice.buyerGstin}</p>}
                {invoice.buyerAddress && <p className="text-gray-500 mt-0.5">{invoice.buyerAddress}</p>}
                {invoice.buyerEmail && <p className="text-gray-500">{invoice.buyerEmail}</p>}
              </div>
            </div>

            {/* Amounts */}
            <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {taxBreakup.cgstAmount != null && (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">CGST ({taxBreakup.cgstRate}%)</span>
                    <span className="text-gray-700">{formatCurrency(taxBreakup.cgstAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">SGST ({taxBreakup.sgstRate}%)</span>
                    <span className="text-gray-700">{formatCurrency(taxBreakup.sgstAmount)}</span>
                  </div>
                </>
              )}
              {taxBreakup.igstAmount != null && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">IGST ({taxBreakup.igstRate}%)</span>
                  <span className="text-gray-700">{formatCurrency(taxBreakup.igstAmount)}</span>
                </div>
              )}
              {Number(invoice.taxTotal) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax Total</span>
                  <span className="font-medium text-gray-900">{formatCurrency(invoice.taxTotal)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-gray-900 text-base">{formatCurrency(invoice.total)}</span>
              </div>
            </div>

            {/* Payment Reference */}
            {(invoice.razorpayPaymentId || invoice.razorpayOrderId) && (
              <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
                <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Payment Reference</p>
                {invoice.razorpayPaymentId && (
                  <p className="text-gray-600"><span className="text-gray-400">Payment ID:</span> {invoice.razorpayPaymentId}</p>
                )}
                {invoice.razorpayOrderId && (
                  <p className="text-gray-600"><span className="text-gray-400">Order ID:</span> {invoice.razorpayOrderId}</p>
                )}
                {invoice.paidAt && (
                  <p className="text-gray-600"><span className="text-gray-400">Paid:</span> {formatDate(invoice.paidAt)}</p>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}

// ── Main Page ──────────────────────────────────────────────────────
export default function AdminBillingPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'billing', 'invoices', statusFilter],
    queryFn: () => adminApi.listSubscriptionInvoices({
      ...(statusFilter && { status: statusFilter }),
      limit: 100,
    }).then(r => r.data.data)
  })

  const invoices = data?.invoices || []

  // Client-side search filter
  const filtered = search
    ? invoices.filter(inv =>
        inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
        inv.buyerName?.toLowerCase().includes(search.toLowerCase()) ||
        inv.business?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : invoices

  // Summary stats
  const totalRevenue = invoices
    .filter(i => i.status === 'PAID')
    .reduce((sum, i) => sum + Number(i.total || 0), 0)
  const paidCount = invoices.filter(i => i.status === 'PAID').length
  const pendingCount = invoices.filter(i => i.status === 'PENDING').length

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
          </div>
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Billing & Invoices</h1>
        <p className="text-sm text-gray-500 mt-1">Subscription invoices generated for plan payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">Total Invoices</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{invoices.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500">Total Revenue</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500">Paid</span>
          </div>
          <p className="text-xl font-bold text-green-600">{paidCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-gray-500">Pending</span>
          </div>
          <p className="text-xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number, business name..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Invoice Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {search ? 'No invoices match your search' : 'No subscription invoices yet'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Invoices are automatically generated when users make plan payments
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Invoice #</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Business</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Period</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-xs">{inv.buyerName || inv.business?.name}</p>
                      {inv.buyerGstin && <p className="text-[10px] text-gray-400">{inv.buyerGstin}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 capitalize">{inv.billingPeriod || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 text-xs">{formatCurrency(inv.total)}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(inv.createdAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {filtered.map(inv => (
              <button
                key={inv.id}
                onClick={() => setSelectedInvoice(inv)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <p className="text-xs font-mono font-medium text-gray-900 truncate">{inv.invoiceNumber}</p>
                    <p className="text-[11px] text-gray-500 truncate">{inv.buyerName || inv.business?.name}</p>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{formatDate(inv.createdAt)} · <span className="capitalize">{inv.billingPeriod}</span></span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(inv.total)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  )
}
