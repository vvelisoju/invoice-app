import { useState, useCallback, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../lib/api'
import {
  Search, Loader2, Receipt, IndianRupee, Calendar,
  CheckCircle2, Clock, XCircle, AlertTriangle, Eye, X,
  Download, ChevronDown, FileSpreadsheet, FileText, Printer,
  FolderArchive, Filter, ChevronLeft, ChevronRight
} from 'lucide-react'
import Portal from '../../components/Portal'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

// ── Constants ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PAID: { label: 'Paid', icon: CheckCircle2, bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  PENDING: { label: 'Pending', icon: Clock, bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  FAILED: { label: 'Failed', icon: XCircle, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  REFUNDED: { label: 'Refunded', icon: AlertTriangle, bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const PERIOD_OPTIONS = [
  { value: '', label: 'All Periods' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

function getMonthRange(offset = 0) {
  const d = new Date()
  const from = new Date(d.getFullYear(), d.getMonth() + offset, 1)
  const to = new Date(d.getFullYear(), d.getMonth() + offset + 1, 0)
  return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] }
}

function getQuarterRange() {
  const d = new Date()
  const qStart = Math.floor(d.getMonth() / 3) * 3
  const from = new Date(d.getFullYear(), qStart, 1)
  const to = new Date(d.getFullYear(), qStart + 3, 0)
  return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] }
}

function getLastQuarterRange() {
  const d = new Date()
  const qStart = Math.floor(d.getMonth() / 3) * 3 - 3
  const from = new Date(d.getFullYear(), qStart, 1)
  const to = new Date(d.getFullYear(), qStart + 3, 0)
  return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] }
}

function getYearRange() {
  const y = new Date().getFullYear()
  return { from: `${y}-01-01`, to: `${y}-12-31` }
}

const QUICK_FILTERS = [
  { key: 'all', label: 'All Time' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
  { key: 'thisQuarter', label: 'This Quarter' },
  { key: 'lastQuarter', label: 'Last Quarter' },
  { key: 'thisYear', label: 'This Year' },
]

// ── Helpers ────────────────────────────────────────────────────────
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
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getExportFilename(prefix, ext) {
  const d = new Date()
  const ts = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
  return `${prefix}_${ts}.${ext}`
}

// ── Export: CSV ────────────────────────────────────────────────────
function exportToCSV(invoices, totals) {
  const headers = ['Invoice #', 'Business', 'GSTIN', 'Period', 'Subtotal', 'Tax', 'Total', 'Status', 'Date', 'Payment ID']
  const rows = invoices.map(inv => [
    inv.invoiceNumber || '',
    `"${(inv.buyerName || inv.business?.name || '').replace(/"/g, '""')}"`,
    `"${inv.buyerGstin || ''}"`,
    inv.billingPeriod || '',
    (Number(inv.subtotal) || 0).toFixed(2),
    (Number(inv.taxTotal) || 0).toFixed(2),
    (Number(inv.total) || 0).toFixed(2),
    inv.status || '',
    inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('en-IN') : '',
    inv.razorpayPaymentId || '',
  ])
  rows.push(['', '', '', 'TOTAL', (totals.subtotal || 0).toFixed(2), (totals.taxTotal || 0).toFixed(2), (totals.total || 0).toFixed(2), '', '', ''])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, getExportFilename('billing_invoices', 'csv'))
}

// ── Export: Print ──────────────────────────────────────────────────
function printReport(invoices, totals) {
  const tableRows = invoices.map(inv => `
    <tr>
      <td>${inv.invoiceNumber || ''}</td>
      <td>${inv.buyerName || inv.business?.name || ''}${inv.buyerGstin ? '<br/><small>' + inv.buyerGstin + '</small>' : ''}</td>
      <td style="text-align:center">${inv.billingPeriod || ''}</td>
      <td style="text-align:right">${formatCurrency(inv.subtotal)}</td>
      <td style="text-align:right">${formatCurrency(inv.taxTotal)}</td>
      <td style="text-align:right;font-weight:600">${formatCurrency(inv.total)}</td>
      <td style="text-align:center">${inv.status}</td>
      <td>${formatDate(inv.createdAt)}</td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html><html><head><title>Billing Report</title>
    <style>
      body{font-family:system-ui,-apple-system,sans-serif;padding:24px;color:#1f2937;font-size:13px}
      h2{margin:0 0 4px;font-size:18px} p.sub{color:#6b7280;font-size:12px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse}
      th{background:#f9fafb;text-align:left;padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;border-bottom:2px solid #e5e7eb}
      td{padding:8px 12px;border-bottom:1px solid #f3f4f6}
      tfoot td{font-weight:700;border-top:2px solid #e5e7eb;background:#f9fafb}
      @media print{body{padding:0}}
    </style></head><body>
    <h2>Subscription Billing Report</h2>
    <p class="sub">Generated on ${new Date().toLocaleDateString('en-IN', { day:'2-digit',month:'long',year:'numeric' })} &bull; ${invoices.length} invoices</p>
    <table>
      <thead><tr><th>Invoice #</th><th>Business</th><th style="text-align:center">Period</th><th style="text-align:right">Subtotal</th><th style="text-align:right">Tax</th><th style="text-align:right">Total</th><th style="text-align:center">Status</th><th>Date</th></tr></thead>
      <tbody>${tableRows}</tbody>
      <tfoot><tr><td colspan="3">Total INR</td><td style="text-align:right">${formatCurrency(totals.subtotal)}</td><td style="text-align:right">${formatCurrency(totals.taxTotal)}</td><td style="text-align:right">${formatCurrency(totals.total)}</td><td colspan="2"></td></tr></tfoot>
    </table></body></html>`

  const w = window.open('', '_blank', 'width=900,height=700')
  w.document.write(html); w.document.close(); w.focus()
  setTimeout(() => { w.print(); w.close() }, 400)
}

// ── Export: Summary PDF ────────────────────────────────────────────
function exportSummaryPDF(invoices, totals) {
  const tableRows = invoices.map(inv => `
    <tr>
      <td>${inv.invoiceNumber || ''}</td>
      <td>${inv.buyerName || inv.business?.name || ''}${inv.buyerGstin ? '<br/><small style="color:#6b7280">' + inv.buyerGstin + '</small>' : ''}</td>
      <td style="text-align:center">${inv.billingPeriod || ''}</td>
      <td style="text-align:right">${formatCurrency(inv.subtotal)}</td>
      <td style="text-align:right">${formatCurrency(inv.taxTotal)}</td>
      <td style="text-align:right;font-weight:600">${formatCurrency(inv.total)}</td>
      <td style="text-align:center">${inv.status}</td>
      <td>${formatDate(inv.createdAt)}</td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html><html><head><title>Billing Report PDF</title>
    <style>
      body{font-family:system-ui,-apple-system,sans-serif;padding:32px;color:#1f2937;font-size:12px}
      h2{margin:0 0 4px;font-size:18px} p.sub{color:#6b7280;font-size:11px;margin:0 0 20px}
      table{width:100%;border-collapse:collapse}
      th{background:#f0f4ff;text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#4b5563;border-bottom:2px solid #d1d5db}
      td{padding:7px 10px;border-bottom:1px solid #f3f4f6;font-size:11px}
      tfoot td{font-weight:700;border-top:2px solid #d1d5db;background:#f9fafb;font-size:12px}
      @page{size:A4 landscape;margin:15mm}
    </style></head><body>
    <h2>Subscription Billing Report</h2>
    <p class="sub">Generated on ${new Date().toLocaleDateString('en-IN', { day:'2-digit',month:'long',year:'numeric' })} &bull; ${invoices.length} invoices</p>
    <table>
      <thead><tr><th>Invoice #</th><th>Business</th><th style="text-align:center">Period</th><th style="text-align:right">Subtotal</th><th style="text-align:right">Tax</th><th style="text-align:right">Total</th><th style="text-align:center">Status</th><th>Date</th></tr></thead>
      <tbody>${tableRows}</tbody>
      <tfoot><tr><td colspan="3">Total INR</td><td style="text-align:right">${formatCurrency(totals.subtotal)}</td><td style="text-align:right">${formatCurrency(totals.taxTotal)}</td><td style="text-align:right">${formatCurrency(totals.total)}</td><td colspan="2"></td></tr></tfoot>
    </table></body></html>`

  const w = window.open('', '_blank', 'width=1100,height=700')
  w.document.write(html); w.document.close(); w.focus()
  setTimeout(() => { w.print() }, 400)
}

// ── Export Progress Modal ──────────────────────────────────────────
function ExportProgressModal({ isOpen, onClose, title, progress, total, status }) {
  if (!isOpen) return null
  const pct = total > 0 ? Math.round((progress / total) * 100) : 0
  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-xs text-gray-500 mb-4">{status}</p>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-gray-500 text-right">{progress} / {total} ({pct}%)</p>
          {pct >= 100 && (
            <button onClick={onClose} className="mt-4 w-full py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              Done
            </button>
          )}
        </div>
      </div>
    </Portal>
  )
}

// ── Export Menu Dropdown ───────────────────────────────────────────
function ExportMenu({ invoices, totals, onExportZip }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const items = [
    { label: 'Export to CSV (Excel)', icon: FileSpreadsheet, iconColor: 'text-green-600', action: () => exportToCSV(invoices, totals) },
    { label: 'Export Summary PDF', icon: FileText, iconColor: 'text-red-600', action: () => exportSummaryPDF(invoices, totals) },
    { label: 'Print Report', icon: Printer, iconColor: 'text-gray-600', action: () => printReport(invoices, totals) },
    { type: 'divider' },
    { label: 'Download All as ZIP', desc: 'Individual invoice PDFs', icon: FolderArchive, iconColor: 'text-purple-600', action: onExportZip },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        Export
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-[260px]">
            {items.map((item, i) => {
              if (item.type === 'divider') return <div key={i} className="h-px bg-gray-100" />
              return (
                <button
                  key={item.label}
                  onClick={() => { setOpen(false); item.action() }}
                  disabled={invoices.length === 0}
                  className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <item.icon className={`w-4 h-4 ${item.iconColor} shrink-0`} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.label}</div>
                    {item.desc && <div className="text-[10px] text-gray-500">{item.desc}</div>}
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
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
                {invoice.buyerPhone && <p className="text-gray-500">{invoice.buyerPhone}</p>}
              </div>
            </div>

            {/* Line Items (if available) */}
            {invoice.lineItems && Array.isArray(invoice.lineItems) && invoice.lineItems.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">Line Items</p>
                <div className="space-y-1.5">
                  {invoice.lineItems.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-gray-700">{item.description} {item.hsnSac && <span className="text-gray-400">(HSN: {item.hsnSac})</span>}</span>
                      <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            {invoice.notes && (
              <div className="bg-gray-50 rounded-lg p-3 text-xs">
                <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Notes</p>
                <p className="text-gray-600">{invoice.notes}</p>
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
  const [periodFilter, setPeriodFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [quickFilter, setQuickFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [page, setPage] = useState(0)
  const limit = 50

  // ZIP export state
  const [zipExporting, setZipExporting] = useState(false)
  const [zipProgress, setZipProgress] = useState(0)
  const [zipTotal, setZipTotal] = useState(0)
  const [zipStatus, setZipStatus] = useState('')

  const queryParams = {
    search: search || undefined,
    status: statusFilter || undefined,
    billingPeriod: periodFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    limit,
    offset: page * limit
  }

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'billing', 'invoices', queryParams],
    queryFn: () => adminApi.listSubscriptionInvoices(queryParams).then(r => r.data.data),
    keepPreviousData: true
  })

  const invoices = data?.invoices || []
  const total = data?.total || 0
  const totals = data?.totals || { subtotal: 0, taxTotal: 0, total: 0, count: 0 }
  const statusBreakdown = data?.statusBreakdown || []
  const totalPages = Math.ceil(total / limit)

  const paidStats = statusBreakdown.find(s => s.status === 'PAID')
  const pendingStats = statusBreakdown.find(s => s.status === 'PENDING')

  const activeFilterCount = [statusFilter, periodFilter, dateFrom].filter(Boolean).length

  const handleQuickFilter = (key) => {
    setQuickFilter(key)
    setPage(0)
    if (key === 'thisMonth') {
      const r = getMonthRange(0); setDateFrom(r.from); setDateTo(r.to)
    } else if (key === 'lastMonth') {
      const r = getMonthRange(-1); setDateFrom(r.from); setDateTo(r.to)
    } else if (key === 'thisQuarter') {
      const r = getQuarterRange(); setDateFrom(r.from); setDateTo(r.to)
    } else if (key === 'lastQuarter') {
      const r = getLastQuarterRange(); setDateFrom(r.from); setDateTo(r.to)
    } else if (key === 'thisYear') {
      const r = getYearRange(); setDateFrom(r.from); setDateTo(r.to)
    } else {
      setDateFrom(''); setDateTo('')
    }
  }

  const clearFilters = () => {
    setSearch(''); setStatusFilter(''); setPeriodFilter(''); setDateFrom(''); setDateTo('')
    setQuickFilter('all'); setPage(0)
  }

  // ── ZIP export: fetch each invoice detail, generate printable HTML → PDF ──
  const handleExportZip = useCallback(async () => {
    if (invoices.length === 0) return
    setZipExporting(true)
    setZipProgress(0)
    setZipTotal(invoices.length)
    setZipStatus('Preparing...')

    const zip = new JSZip()
    let done = 0

    for (const inv of invoices) {
      try {
        setZipStatus(`Fetching ${inv.invoiceNumber || 'invoice'}...`)
        const res = await adminApi.getSubscriptionInvoice(inv.id)
        const detail = res.data?.data || res.data
        const taxBk = detail.taxBreakup || {}

        // Generate a simple HTML invoice for each
        const html = `<!DOCTYPE html><html><head><title>${detail.invoiceNumber}</title>
          <style>
            body{font-family:system-ui,sans-serif;padding:40px;color:#1f2937;font-size:12px;max-width:800px;margin:0 auto}
            h1{font-size:20px;margin:0 0 4px} .sub{color:#6b7280;font-size:11px;margin:0 0 24px}
            .grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}
            .box{background:#f9fafb;border-radius:8px;padding:12px}
            .label{font-size:10px;color:#9ca3af;text-transform:uppercase;font-weight:600;margin-bottom:4px}
            table{width:100%;border-collapse:collapse;margin-top:16px}
            th{background:#f0f4ff;text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;color:#4b5563;border-bottom:2px solid #d1d5db}
            td{padding:8px 10px;border-bottom:1px solid #f3f4f6}
            .total-row td{font-weight:700;border-top:2px solid #d1d5db;font-size:13px}
            .right{text-align:right}
            @page{size:A4;margin:20mm}
          </style></head><body>
          <h1>Subscription Invoice</h1>
          <p class="sub">${detail.invoiceNumber} · ${formatDate(detail.createdAt)}</p>
          <div class="grid">
            <div class="box"><div class="label">From</div><strong>${detail.sellerName || ''}</strong>${detail.sellerGstin ? '<br/>GSTIN: ' + detail.sellerGstin : ''}${detail.sellerAddress ? '<br/>' + detail.sellerAddress : ''}</div>
            <div class="box"><div class="label">To</div><strong>${detail.buyerName || ''}</strong>${detail.buyerGstin ? '<br/>GSTIN: ' + detail.buyerGstin : ''}${detail.buyerAddress ? '<br/>' + detail.buyerAddress : ''}${detail.buyerEmail ? '<br/>' + detail.buyerEmail : ''}</div>
          </div>
          <div class="grid">
            <div class="box"><div class="label">Period</div>${(detail.billingPeriod || '').charAt(0).toUpperCase() + (detail.billingPeriod || '').slice(1)}: ${formatDate(detail.periodStart)} – ${formatDate(detail.periodEnd)}</div>
            <div class="box"><div class="label">Status</div>${detail.status}${detail.paidAt ? ' · Paid: ' + formatDate(detail.paidAt) : ''}</div>
          </div>
          <table>
            <thead><tr><th>Description</th><th class="right">Amount</th></tr></thead>
            <tbody>
              <tr><td>Subscription – ${detail.billingPeriod || ''} plan</td><td class="right">${formatCurrency(detail.subtotal)}</td></tr>
              ${taxBk.cgstAmount != null ? `<tr><td>CGST (${taxBk.cgstRate}%)</td><td class="right">${formatCurrency(taxBk.cgstAmount)}</td></tr><tr><td>SGST (${taxBk.sgstRate}%)</td><td class="right">${formatCurrency(taxBk.sgstAmount)}</td></tr>` : ''}
              ${taxBk.igstAmount != null ? `<tr><td>IGST (${taxBk.igstRate}%)</td><td class="right">${formatCurrency(taxBk.igstAmount)}</td></tr>` : ''}
            </tbody>
            <tfoot><tr class="total-row"><td>Total</td><td class="right">${formatCurrency(detail.total)}</td></tr></tfoot>
          </table>
          ${detail.razorpayPaymentId ? '<p style="margin-top:20px;color:#6b7280;font-size:10px">Payment ID: ' + detail.razorpayPaymentId + '</p>' : ''}
          </body></html>`

        const filename = `${(detail.invoiceNumber || detail.id).replace(/[^a-zA-Z0-9_-]/g, '_')}.html`
        zip.file(filename, html)
      } catch (err) {
        console.error(`Failed to fetch invoice ${inv.invoiceNumber}:`, err)
      }
      done++
      setZipProgress(done)
    }

    setZipStatus('Creating ZIP file...')
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    saveAs(zipBlob, getExportFilename('billing_invoices', 'zip'))
    setZipStatus('Done!')
  }, [invoices])

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Billing & Invoices</h1>
        <p className="text-sm text-gray-500 mt-0.5">Subscription invoices generated for plan payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">Total Invoices</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{totals.count}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500">Total Revenue</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totals.total)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500">Paid</span>
          </div>
          <p className="text-xl font-bold text-green-600">{paidStats?.count || 0}</p>
          <p className="text-[10px] text-gray-400">{formatCurrency(paidStats?.total || 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-gray-500">Pending</span>
          </div>
          <p className="text-xl font-bold text-yellow-600">{pendingStats?.count || 0}</p>
          <p className="text-[10px] text-gray-400">{formatCurrency(pendingStats?.total || 0)}</p>
        </div>
      </div>

      {/* Quick Filters + Export */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {QUICK_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => handleQuickFilter(f.key)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              quickFilter === f.key
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="flex-1" />
        <ExportMenu invoices={invoices} totals={totals} onExportZip={handleExportZip} />
      </div>

      {/* Search + Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search invoice #, business name, GSTIN..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
            showFilters || activeFilterCount > 0
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-medium mb-1 block">Status</label>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-medium mb-1 block">Billing Period</label>
              <select value={periodFilter} onChange={(e) => { setPeriodFilter(e.target.value); setPage(0) }}
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-medium mb-1 block">Date From</label>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setQuickFilter(''); setPage(0) }}
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-medium mb-1 block">Date To</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setQuickFilter(''); setPage(0) }}
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
              <X className="w-3 h-3" /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Invoice Table */}
      {isLoading && !data ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {search || activeFilterCount > 0 ? 'No invoices match your filters' : 'No subscription invoices yet'}
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
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Period</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Subtotal</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tax</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-xs">{inv.buyerName || inv.business?.name}</p>
                      {inv.buyerGstin && <p className="text-[10px] text-gray-400">{inv.buyerGstin}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 capitalize text-center">{inv.billingPeriod || '—'}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-600 font-mono">{formatCurrency(inv.subtotal)}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-600 font-mono">{formatCurrency(inv.taxTotal)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 text-xs font-mono">{formatCurrency(inv.total)}</td>
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
              {/* Totals Footer */}
              <tfoot className="bg-gray-50 border-t-2 border-gray-200 font-semibold text-sm">
                <tr>
                  <td className="px-4 py-3 text-gray-900 uppercase tracking-wider text-xs" colSpan={3}>Total ({totals.count} invoices)</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{formatCurrency(totals.subtotal)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{formatCurrency(totals.taxTotal)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-blue-600">{formatCurrency(totals.total)}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {invoices.map(inv => (
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
            {/* Mobile totals */}
            <div className="p-4 bg-gray-50">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-500 uppercase">Total ({totals.count})</span>
                <span className="text-blue-600">{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-gray-500">
            Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-500 px-2">Page {page + 1} of {totalPages}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages - 1}
              className="p-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
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

      {/* ZIP Export Progress Modal */}
      <ExportProgressModal
        isOpen={zipExporting}
        onClose={() => setZipExporting(false)}
        title="Exporting Invoice PDFs"
        progress={zipProgress}
        total={zipTotal}
        status={zipStatus}
      />
    </div>
  )
}
