import { useState, useCallback, useRef } from 'react'
import {
  Search, Calendar, ChevronDown, FileText, FileSpreadsheet, Printer,
  Loader2, FolderArchive, Download, ChevronRight, X
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi, invoiceApi } from '../../lib/api'
import { generatePDF } from '../invoices/utils/pdfGenerator'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

const DOC_TYPE_LABELS = {
  INVOICE: 'Invoice',
  QUOTE: 'Quote',
  RECEIPT: 'Cash Receipt',
  CREDIT_NOTE: 'Credit Note',
  DELIVERY_NOTE: 'Delivery Note',
  PURCHASE_ORDER: 'Purchase Order',
}

const STATUS_OPTIONS = [
  { value: 'all', label: '-- All --' },
  { value: 'PAID', label: 'Paid' },
  { value: 'ISSUED', label: 'Unpaid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'DRAFT', label: 'Draft' },
]

const DOC_TYPE_OPTIONS = [
  { value: 'all', label: '-- All --' },
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'QUOTE', label: 'Quote' },
  { value: 'RECEIPT', label: 'Cash Receipt' },
  { value: 'CREDIT_NOTE', label: 'Credit Note' },
]

const QUICK_FILTERS = [
  { key: 'all', label: 'All Documents' },
  { key: 'lastMonth', label: 'Last Month' },
  { key: 'lastQuarter', label: 'Last Quarter' },
]

function getLastMonthRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const to = new Date(now.getFullYear(), now.getMonth(), 0)
  return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] }
}

function getLastQuarterRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  const to = new Date(now.getFullYear(), now.getMonth(), 0)
  return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] }
}

// ── Helpers ──────────────────────────────────────────────

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0)

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const getExportFilename = (prefix, ext) => {
  const d = new Date()
  const ts = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
  return `${prefix}_${ts}.${ext}`
}

// ── Export: CSV / Excel ──────────────────────────────────

function exportToCSV(documents, totals) {
  const headers = ['Customer', 'GSTIN', 'Document', 'Number', 'Date', 'Subtotal', 'Tax', 'Paid Amount', 'Total']
  const rows = documents.map(doc => [
    `"${(doc.customerName || '').replace(/"/g, '""')}"`,
    `"${doc.customerGstin || ''}"`,
    DOC_TYPE_LABELS[doc.documentType] || doc.documentType,
    doc.invoiceNumber || '',
    formatDate(doc.date),
    (doc.subtotal || 0).toFixed(2),
    (doc.tax || 0).toFixed(2),
    (doc.paidAmount || 0).toFixed(2),
    (doc.total || 0).toFixed(2),
  ])
  // Totals row
  rows.push(['', '', '', '', 'TOTAL', (totals.subtotal||0).toFixed(2), (totals.tax||0).toFixed(2), (totals.paidAmount||0).toFixed(2), (totals.total||0).toFixed(2)])

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, getExportFilename('report', 'csv'))
}

// ── Export: Print ────────────────────────────────────────

function printReport(documents, totals) {
  const tableRows = documents.map(doc => `
    <tr>
      <td>${doc.customerName || '-'}${doc.customerGstin ? '<br/><small>' + doc.customerGstin + '</small>' : ''}</td>
      <td>${DOC_TYPE_LABELS[doc.documentType] || doc.documentType}</td>
      <td>${doc.invoiceNumber || ''}</td>
      <td style="text-align:center">${formatDate(doc.date)}</td>
      <td style="text-align:right">${formatCurrency(doc.subtotal)}</td>
      <td style="text-align:right">${formatCurrency(doc.tax)}</td>
      <td style="text-align:right">${formatCurrency(doc.paidAmount)}</td>
      <td style="text-align:right;font-weight:600">${formatCurrency(doc.total)}</td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html><html><head><title>Report</title>
    <style>
      body{font-family:system-ui,-apple-system,sans-serif;padding:24px;color:#1f2937;font-size:13px}
      h2{margin:0 0 4px;font-size:18px} p.sub{color:#6b7280;font-size:12px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse}
      th{background:#f9fafb;text-align:left;padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;border-bottom:2px solid #e5e7eb}
      td{padding:8px 12px;border-bottom:1px solid #f3f4f6}
      tfoot td{font-weight:700;border-top:2px solid #e5e7eb;background:#f9fafb}
      @media print{body{padding:0}}
    </style></head><body>
    <h2>Document Report</h2>
    <p class="sub">Generated on ${new Date().toLocaleDateString('en-IN', { day:'2-digit',month:'long',year:'numeric' })} &bull; ${documents.length} documents</p>
    <table>
      <thead><tr><th>Customer</th><th>Document</th><th>Number</th><th style="text-align:center">Date</th><th style="text-align:right">Subtotal</th><th style="text-align:right">Tax</th><th style="text-align:right">Paid</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${tableRows}</tbody>
      <tfoot><tr><td colspan="4">Total INR</td><td style="text-align:right">${formatCurrency(totals.subtotal)}</td><td style="text-align:right">${formatCurrency(totals.tax)}</td><td style="text-align:right">${formatCurrency(totals.paidAmount)}</td><td style="text-align:right">${formatCurrency(totals.total)}</td></tr></tfoot>
    </table></body></html>`

  const w = window.open('', '_blank', 'width=900,height=700')
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => { w.print(); w.close() }, 400)
}

// ── Export: Summary PDF (HTML → print‑to‑PDF) ────────────

function exportSummaryPDF(documents, totals) {
  const tableRows = documents.map(doc => `
    <tr>
      <td>${doc.customerName || '-'}${doc.customerGstin ? '<br/><small style="color:#6b7280">' + doc.customerGstin + '</small>' : ''}</td>
      <td>${DOC_TYPE_LABELS[doc.documentType] || doc.documentType}</td>
      <td>${doc.invoiceNumber || ''}</td>
      <td style="text-align:center">${formatDate(doc.date)}</td>
      <td style="text-align:right">${formatCurrency(doc.subtotal)}</td>
      <td style="text-align:right">${formatCurrency(doc.tax)}</td>
      <td style="text-align:right">${formatCurrency(doc.paidAmount)}</td>
      <td style="text-align:right;font-weight:600">${formatCurrency(doc.total)}</td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html><html><head><title>Report PDF</title>
    <style>
      body{font-family:system-ui,-apple-system,sans-serif;padding:32px;color:#1f2937;font-size:12px}
      h2{margin:0 0 4px;font-size:18px} p.sub{color:#6b7280;font-size:11px;margin:0 0 20px}
      table{width:100%;border-collapse:collapse}
      th{background:#f0f4ff;text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#4b5563;border-bottom:2px solid #d1d5db}
      td{padding:7px 10px;border-bottom:1px solid #f3f4f6;font-size:11px}
      tfoot td{font-weight:700;border-top:2px solid #d1d5db;background:#f9fafb;font-size:12px}
      @page{size:A4 landscape;margin:15mm}
    </style></head><body>
    <h2>Document Report</h2>
    <p class="sub">Generated on ${new Date().toLocaleDateString('en-IN', { day:'2-digit',month:'long',year:'numeric' })} &bull; ${documents.length} documents</p>
    <table>
      <thead><tr><th>Customer</th><th>Document</th><th>Number</th><th style="text-align:center">Date</th><th style="text-align:right">Subtotal</th><th style="text-align:right">Tax</th><th style="text-align:right">Paid</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${tableRows}</tbody>
      <tfoot><tr><td colspan="4">Total INR</td><td style="text-align:right">${formatCurrency(totals.subtotal)}</td><td style="text-align:right">${formatCurrency(totals.tax)}</td><td style="text-align:right">${formatCurrency(totals.paidAmount)}</td><td style="text-align:right">${formatCurrency(totals.total)}</td></tr></tfoot>
    </table></body></html>`

  const w = window.open('', '_blank', 'width=1100,height=700')
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => { w.print() }, 400)
}

// ── Progress Modal ───────────────────────────────────────

function ExportProgressModal({ isOpen, onClose, title, progress, total, status }) {
  if (!isOpen) return null
  const pct = total > 0 ? Math.round((progress / total) * 100) : 0
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h3 className="text-sm font-semibold text-textPrimary mb-1">{title}</h3>
        <p className="text-xs text-textSecondary mb-4">{status}</p>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-textSecondary text-right">{progress} / {total} ({pct}%)</p>
        {pct >= 100 && (
          <button onClick={onClose} className="mt-4 w-full py-2 text-sm font-medium text-primary bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            Done
          </button>
        )}
      </div>
    </div>
  )
}

// ── Export Menu Dropdown ─────────────────────────────────

function ExportMenu({ documents, totals, onExportZip }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const items = [
    { label: 'Export to CSV (Excel)', icon: FileSpreadsheet, iconColor: 'text-green-600', action: () => exportToCSV(documents, totals) },
    { label: 'Export Summary PDF', icon: FileText, iconColor: 'text-red-600', action: () => exportSummaryPDF(documents, totals) },
    { label: 'Print Report', icon: Printer, iconColor: 'text-gray-600', action: () => printReport(documents, totals) },
    { type: 'divider' },
    { label: 'Download All as ZIP', desc: 'Individual PDFs for CA / GST filing', icon: FolderArchive, iconColor: 'text-purple-600', action: onExportZip },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="bg-primary hover:bg-primaryHover text-white font-medium text-xs px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        Export
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-border rounded-xl shadow-lg overflow-hidden min-w-[260px]">
            {items.map((item, i) => {
              if (item.type === 'divider') return <div key={i} className="h-px bg-border" />
              return (
                <button
                  key={item.label}
                  onClick={() => { setOpen(false); item.action() }}
                  disabled={documents.length === 0}
                  className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <item.icon className={`w-4 h-4 ${item.iconColor} shrink-0`} />
                  <div>
                    <div className="text-sm font-medium text-textPrimary">{item.label}</div>
                    {item.desc && <div className="text-[10px] text-textSecondary">{item.desc}</div>}
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

// ── Main Component ───────────────────────────────────────

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [docTypeFilter, setDocTypeFilter] = useState('all')
  const [quickFilter, setQuickFilter] = useState('all')
  const [searchParams, setSearchParams] = useState({})

  // ZIP export progress
  const [zipExporting, setZipExporting] = useState(false)
  const [zipProgress, setZipProgress] = useState(0)
  const [zipTotal, setZipTotal] = useState(0)
  const [zipStatus, setZipStatus] = useState('')

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', 'documents', searchParams],
    queryFn: async () => {
      const response = await reportsApi.getDocuments(searchParams)
      return response.data.data || response.data
    }
  })

  // GST summary query
  const { data: gstData } = useQuery({
    queryKey: ['reports', 'gst', searchParams],
    queryFn: async () => {
      const response = await reportsApi.getGSTSummary(searchParams)
      return response.data.data || response.data
    }
  })

  const documents = reportData?.documents || []
  const totals = reportData?.totals || {}
  const gstSummary = gstData?.summary || null

  const handleSearch = () => {
    const params = {}
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo
    if (statusFilter !== 'all') params.status = statusFilter
    if (docTypeFilter !== 'all') params.documentType = docTypeFilter
    setSearchParams(params)
  }

  const handleQuickFilter = (key) => {
    setQuickFilter(key)
    if (key === 'lastMonth') {
      const range = getLastMonthRange()
      setDateFrom(range.from)
      setDateTo(range.to)
      setSearchParams({ dateFrom: range.from, dateTo: range.to })
    } else if (key === 'lastQuarter') {
      const range = getLastQuarterRange()
      setDateFrom(range.from)
      setDateTo(range.to)
      setSearchParams({ dateFrom: range.from, dateTo: range.to })
    } else {
      setDateFrom('')
      setDateTo('')
      setStatusFilter('all')
      setDocTypeFilter('all')
      setSearchParams({})
    }
  }

  // ── ZIP export: fetch each invoice, generate PDF, bundle ──
  const handleExportZip = useCallback(async () => {
    if (documents.length === 0) return
    setZipExporting(true)
    setZipProgress(0)
    setZipTotal(documents.length)
    setZipStatus('Preparing...')

    const zip = new JSZip()
    let done = 0

    for (const doc of documents) {
      try {
        setZipStatus(`Generating ${doc.invoiceNumber || 'document'}...`)
        const response = await invoiceApi.get(doc.id)
        const invoice = response.data?.data || response.data
        const blob = await generatePDF(invoice)
        const filename = `${(doc.invoiceNumber || doc.id).replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`
        zip.file(filename, blob)
      } catch (err) {
        console.error(`Failed to generate PDF for ${doc.invoiceNumber}:`, err)
      }
      done++
      setZipProgress(done)
    }

    setZipStatus('Creating ZIP file...')
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    saveAs(zipBlob, getExportFilename('invoices', 'zip'))
    setZipStatus('Done!')
  }, [documents])

  return (
    <div className="flex-1 overflow-y-auto bg-bgPrimary p-6">
      <div className="max-w-7xl mx-auto flex flex-col h-full">

        {/* Filter & Search Section (Top Card) */}
        <div className="bg-white border border-border rounded-t-xl px-6 py-6 shadow-sm z-10 relative">
          <div className="grid grid-cols-12 gap-6 items-end">
            {/* Date From */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-textSecondary mb-1.5 ml-1">Date From</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 text-sm border border-border rounded-lg focus:ring-primary focus:border-primary text-textPrimary bg-white"
                />
              </div>
            </div>

            {/* Date To */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-textSecondary mb-1.5 ml-1">Date To</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 text-sm border border-border rounded-lg focus:ring-primary focus:border-primary text-textPrimary bg-white"
                />
              </div>
            </div>

            {/* Status Dropdown */}
            <div className="col-span-3">
              <label className="block text-xs font-medium text-textSecondary mb-1.5 ml-1">Status</label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-sm border border-border rounded-lg focus:ring-primary focus:border-primary text-textPrimary bg-white appearance-none cursor-pointer"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Document Type Dropdown */}
            <div className="col-span-3">
              <label className="block text-xs font-medium text-textSecondary mb-1.5 ml-1">Document</label>
              <div className="relative">
                <select
                  value={docTypeFilter}
                  onChange={(e) => setDocTypeFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-sm border border-border rounded-lg focus:ring-primary focus:border-primary text-textPrimary bg-white appearance-none cursor-pointer"
                >
                  {DOC_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Search Button */}
            <div className="col-span-2">
              <button
                onClick={handleSearch}
                className="w-full bg-blue-800 hover:bg-blue-900 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Search className="w-3.5 h-3.5" />
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="bg-white border-x border-b border-border px-6 py-3 flex items-center gap-3 bg-gray-50/50">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => handleQuickFilter(f.key)}
              className={`font-medium text-xs px-4 py-2 rounded shadow-sm flex items-center gap-2 transition-colors ${
                quickFilter === f.key
                  ? 'bg-white border border-border text-primary font-semibold'
                  : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-200'
              }`}
            >
              {f.label}
              {f.key === 'all' && documents.length > 0 && (
                <span className="bg-primary text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                  {documents.length}
                </span>
              )}
            </button>
          ))}

          <div className="flex-1" />

          <ExportMenu documents={documents} totals={totals} onExportZip={handleExportZip} />
        </div>

        {/* GST Summary Card */}
        {gstSummary && gstSummary.invoiceCount > 0 && (
          <div className="bg-white border-x border-b border-border px-6 py-4">
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Taxable Value</p>
                <p className="text-lg font-bold text-textPrimary mt-1">₹{formatCurrency(gstSummary.totalTaxableValue)}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                <p className="text-[10px] font-semibold text-orange-600 uppercase tracking-wider">Total GST</p>
                <p className="text-lg font-bold text-textPrimary mt-1">₹{formatCurrency(gstSummary.totalGST)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wider">CGST</p>
                <p className="text-lg font-bold text-textPrimary mt-1">₹{formatCurrency(gstSummary.breakdown?.cgst)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wider">SGST</p>
                <p className="text-lg font-bold text-textPrimary mt-1">₹{formatCurrency(gstSummary.breakdown?.sgst)}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider">IGST</p>
                <p className="text-lg font-bold text-textPrimary mt-1">₹{formatCurrency(gstSummary.breakdown?.igst)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white border-x border-b border-border rounded-b-xl flex-1 flex flex-col shadow-sm overflow-hidden">
          <div className="overflow-auto flex-1">
            <table className="w-full min-w-full">
              <thead className="bg-white text-xs font-semibold text-textSecondary uppercase tracking-wider sticky top-0 z-10 shadow-[0_1px_0_0_rgba(229,231,235,1)]">
                <tr>
                  <th className="px-6 py-4 text-left w-1/4">Customer</th>
                  <th className="px-6 py-4 text-left w-1/6">Document</th>
                  <th className="px-6 py-4 text-left w-1/12">Number</th>
                  <th className="px-6 py-4 text-center w-1/6">Date</th>
                  <th className="px-6 py-4 text-right w-1/6">Subtotal</th>
                  <th className="px-6 py-4 text-right w-1/12">Tax</th>
                  <th className="px-6 py-4 text-right w-1/6">Paid Amount</th>
                  <th className="px-6 py-4 text-right w-1/6">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLight text-sm text-textPrimary">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center">
                      <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : documents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center text-textSecondary">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-medium">No documents found</p>
                      <p className="text-xs mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        {doc.customerName ? (
                          <div>
                            <div className="font-medium">{doc.customerName}{doc.customerGstin ? ', GST:' : ''}</div>
                            {doc.customerGstin && (
                              <div className="text-xs text-textSecondary mt-0.5">{doc.customerGstin}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-textSecondary italic">No customer</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-textSecondary">{DOC_TYPE_LABELS[doc.documentType] || doc.documentType}</td>
                      <td className="px-6 py-4 text-textSecondary">{doc.invoiceNumber}</td>
                      <td className="px-6 py-4 text-center text-textSecondary">{formatDate(doc.date)}</td>
                      <td className="px-6 py-4 text-right font-mono text-textSecondary">{formatCurrency(doc.subtotal)}</td>
                      <td className="px-6 py-4 text-right font-mono text-textSecondary">{formatCurrency(doc.tax)}</td>
                      <td className="px-6 py-4 text-right font-mono text-textSecondary">{formatCurrency(doc.paidAmount)}</td>
                      <td className="px-6 py-4 text-right font-mono font-medium">{formatCurrency(doc.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {documents.length > 0 && (
                <tfoot className="bg-gray-50 border-t-2 border-border font-semibold text-sm">
                  <tr>
                    <td className="px-6 py-4 text-textPrimary uppercase tracking-wider" colSpan={4}>Total INR</td>
                    <td className="px-6 py-4 text-right font-mono">{formatCurrency(totals.subtotal)}</td>
                    <td className="px-6 py-4 text-right font-mono">{formatCurrency(totals.tax)}</td>
                    <td className="px-6 py-4 text-right font-mono">{formatCurrency(totals.paidAmount)}</td>
                    <td className="px-6 py-4 text-right font-mono text-primary text-base">{formatCurrency(totals.total)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4 mt-auto">
          <p className="text-xs text-textSecondary">© 2026 InvoiceApp. All rights reserved.</p>
        </div>
      </div>

      {/* ZIP Export Progress Modal */}
      <ExportProgressModal
        isOpen={zipExporting}
        onClose={() => setZipExporting(false)}
        title="Exporting Individual PDFs"
        progress={zipProgress}
        total={zipTotal}
        status={zipStatus}
      />
    </div>
  )
}
