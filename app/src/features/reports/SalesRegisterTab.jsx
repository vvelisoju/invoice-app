import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Calendar, Search, Loader2, FileText, FileSpreadsheet, Printer, Download, ChevronDown
} from 'lucide-react'
import { reportsApi } from '../../lib/api'
import { saveAs } from 'file-saver'

const DOC_TYPE_LABELS = {
  invoice: 'Invoice', tax_invoice: 'Tax Invoice', proforma: 'Proforma',
  receipt: 'Receipt', sales_receipt: 'Sales Receipt', cash_receipt: 'Cash Receipt',
  quote: 'Quote', estimate: 'Estimate', credit_memo: 'Credit Memo',
  credit_note: 'Credit Note', purchase_order: 'Purchase Order', delivery_note: 'Delivery Note',
}

const STATUS_COLORS = {
  PAID: 'bg-green-100 text-green-700',
  ISSUED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
  VOID: 'bg-gray-100 text-gray-500',
  DRAFT: 'bg-yellow-100 text-yellow-700',
}

const formatCurrency = (v) =>
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0)

const formatDate = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getThisMonthRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  return { from: from.toISOString().split('T')[0], to: now.toISOString().split('T')[0] }
}

function getLastMonthRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const to = new Date(now.getFullYear(), now.getMonth(), 0)
  return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] }
}

function getThisQuarterRange() {
  const now = new Date()
  const qStart = Math.floor(now.getMonth() / 3) * 3
  const from = new Date(now.getFullYear(), qStart, 1)
  return { from: from.toISOString().split('T')[0], to: now.toISOString().split('T')[0] }
}

function getFYRange() {
  const now = new Date()
  const fyStart = now.getMonth() >= 3
    ? new Date(now.getFullYear(), 3, 1)
    : new Date(now.getFullYear() - 1, 3, 1)
  return { from: fyStart.toISOString().split('T')[0], to: now.toISOString().split('T')[0] }
}

const QUICK_RANGES = [
  { key: 'thisMonth', label: 'This Month', fn: getThisMonthRange },
  { key: 'lastMonth', label: 'Last Month', fn: getLastMonthRange },
  { key: 'thisQuarter', label: 'This Quarter', fn: getThisQuarterRange },
  { key: 'thisFY', label: 'This FY', fn: getFYRange },
]

// ── Export helpers ────────────────────────────────────

function exportToCSV(rows, totals) {
  const headers = ['Date', 'Invoice #', 'Type', 'Customer', 'GSTIN', 'Place of Supply', 'Taxable Value', 'Rate %', 'CGST', 'SGST', 'IGST', 'Total', 'Status']
  const csvRows = rows.map(r => [
    formatDate(r.date),
    r.invoiceNumber,
    DOC_TYPE_LABELS[r.documentType] || r.documentType,
    `"${(r.customerName || '').replace(/"/g, '""')}"`,
    r.customerGstin || '',
    `"${r.placeOfSupply || ''}"`,
    r.taxableValue.toFixed(2),
    r.taxRate,
    r.cgst.toFixed(2),
    r.sgst.toFixed(2),
    r.igst.toFixed(2),
    r.totalInvoiceValue.toFixed(2),
    r.status,
  ])
  csvRows.push(['', '', '', '', '', 'TOTAL', totals.taxableValue.toFixed(2), '', totals.cgst.toFixed(2), totals.sgst.toFixed(2), totals.igst.toFixed(2), totals.totalInvoiceValue.toFixed(2), ''])
  const csv = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const d = new Date()
  saveAs(blob, `SalesRegister_${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}.csv`)
}

function printReport(rows, totals) {
  const tableRows = rows.map(r => `
    <tr>
      <td>${formatDate(r.date)}</td>
      <td>${r.invoiceNumber}</td>
      <td>${DOC_TYPE_LABELS[r.documentType] || r.documentType}</td>
      <td>${r.customerName || '-'}${r.customerGstin ? '<br/><small>' + r.customerGstin + '</small>' : ''}</td>
      <td>${r.placeOfSupply || ''}</td>
      <td style="text-align:right">${formatCurrency(r.taxableValue)}</td>
      <td style="text-align:center">${r.taxRate}%</td>
      <td style="text-align:right">${formatCurrency(r.cgst)}</td>
      <td style="text-align:right">${formatCurrency(r.sgst)}</td>
      <td style="text-align:right">${formatCurrency(r.igst)}</td>
      <td style="text-align:right;font-weight:600">${formatCurrency(r.totalInvoiceValue)}</td>
      <td>${r.status}</td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html><html><head><title>Sales Register</title>
    <style>
      body{font-family:system-ui,-apple-system,sans-serif;padding:24px;color:#1f2937;font-size:12px}
      h2{margin:0 0 4px;font-size:18px} p.sub{color:#6b7280;font-size:11px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse}
      th{background:#f9fafb;text-align:left;padding:6px 8px;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;border-bottom:2px solid #e5e7eb}
      td{padding:6px 8px;border-bottom:1px solid #f3f4f6;font-size:11px}
      tfoot td{font-weight:700;border-top:2px solid #e5e7eb;background:#f9fafb}
      @media print{body{padding:0}}
    </style></head><body>
    <h2>Sales Register</h2>
    <p class="sub">Generated on ${new Date().toLocaleDateString('en-IN', { day:'2-digit',month:'long',year:'numeric' })} &bull; ${rows.length} entries</p>
    <table>
      <thead><tr><th>Date</th><th>Invoice #</th><th>Type</th><th>Customer</th><th>Place of Supply</th><th style="text-align:right">Taxable</th><th style="text-align:center">Rate</th><th style="text-align:right">CGST</th><th style="text-align:right">SGST</th><th style="text-align:right">IGST</th><th style="text-align:right">Total</th><th>Status</th></tr></thead>
      <tbody>${tableRows}</tbody>
      <tfoot><tr><td colspan="5">Total</td><td style="text-align:right">${formatCurrency(totals.taxableValue)}</td><td></td><td style="text-align:right">${formatCurrency(totals.cgst)}</td><td style="text-align:right">${formatCurrency(totals.sgst)}</td><td style="text-align:right">${formatCurrency(totals.igst)}</td><td style="text-align:right">${formatCurrency(totals.totalInvoiceValue)}</td><td></td></tr></tfoot>
    </table></body></html>`

  const w = window.open('', '_blank', 'width=1100,height=700')
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => { w.print() }, 400)
}

// ── Main Component ────────────────────────────────────

export default function SalesRegisterTab() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [activeQuick, setActiveQuick] = useState('')
  const [searchParams, setSearchParams] = useState({})

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'sales-register', searchParams],
    queryFn: async () => {
      const res = await reportsApi.getSalesRegister(searchParams)
      return res.data.data || res.data
    }
  })

  const rows = data?.rows || []
  const totals = data?.totals || {}

  const handleSearch = () => {
    const params = {}
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo
    setActiveQuick('')
    setSearchParams(params)
  }

  const handleQuickRange = (key, fn) => {
    const range = fn()
    setDateFrom(range.from)
    setDateTo(range.to)
    setActiveQuick(key)
    setSearchParams({ dateFrom: range.from, dateTo: range.to })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Filters */}
      <div className="bg-white border border-border rounded-xl px-4 py-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[130px]">
            <label className="block text-xs font-medium text-textSecondary mb-1 ml-0.5">From</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="w-full pl-8 pr-2 py-2 text-sm border border-border rounded-lg focus:ring-primary focus:border-primary" />
            </div>
          </div>
          <div className="flex-1 min-w-[130px]">
            <label className="block text-xs font-medium text-textSecondary mb-1 ml-0.5">To</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="w-full pl-8 pr-2 py-2 text-sm border border-border rounded-lg focus:ring-primary focus:border-primary" />
            </div>
          </div>
          <button onClick={handleSearch}
            className="px-4 py-2 bg-primary hover:bg-primaryHover text-white text-sm font-medium rounded-lg flex items-center gap-1.5 transition-colors">
            <Search className="w-3.5 h-3.5" /> Search
          </button>
        </div>

        {/* Quick ranges */}
        <div className="flex flex-wrap gap-2 mt-3">
          {QUICK_RANGES.map(q => (
            <button key={q.key} onClick={() => handleQuickRange(q.key, q.fn)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                activeQuick === q.key
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-gray-50 border-border text-textSecondary hover:bg-gray-100'
              }`}>
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          <div className="bg-white border border-border rounded-lg p-3">
            <p className="text-[10px] font-semibold text-textSecondary uppercase tracking-wider">Invoices</p>
            <p className="text-lg font-bold text-textPrimary mt-0.5">{totals.count}</p>
          </div>
          <div className="bg-white border border-border rounded-lg p-3">
            <p className="text-[10px] font-semibold text-textSecondary uppercase tracking-wider">Taxable Value</p>
            <p className="text-lg font-bold text-textPrimary mt-0.5">₹{formatCurrency(totals.taxableValue)}</p>
          </div>
          <div className="bg-white border border-border rounded-lg p-3">
            <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wider">CGST + SGST</p>
            <p className="text-lg font-bold text-textPrimary mt-0.5">₹{formatCurrency((totals.cgst || 0) + (totals.sgst || 0))}</p>
          </div>
          <div className="bg-white border border-border rounded-lg p-3">
            <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider">IGST</p>
            <p className="text-lg font-bold text-textPrimary mt-0.5">₹{formatCurrency(totals.igst)}</p>
          </div>
          <div className="bg-white border border-border rounded-lg p-3">
            <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Total</p>
            <p className="text-lg font-bold text-primary mt-0.5">₹{formatCurrency(totals.totalInvoiceValue)}</p>
          </div>
        </div>
      )}

      {/* Export bar */}
      {rows.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button onClick={() => exportToCSV(rows, totals)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={() => printReport(rows, totals)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50 text-[10px] font-semibold text-textSecondary uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Invoice #</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Place of Supply</th>
                <th className="px-4 py-3 text-right">Taxable</th>
                <th className="px-4 py-3 text-center">Rate</th>
                <th className="px-4 py-3 text-right">CGST</th>
                <th className="px-4 py-3 text-right">SGST</th>
                <th className="px-4 py-3 text-right">IGST</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderLight text-sm">
              {isLoading ? (
                <tr><td colSpan={12} className="px-4 py-16 text-center">
                  <Loader2 className="w-7 h-7 text-primary animate-spin mx-auto" />
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={12} className="px-4 py-16 text-center text-textSecondary">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium">No records found</p>
                  <p className="text-xs mt-1">Select a date range to view the sales register</p>
                </td></tr>
              ) : rows.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-2.5 text-textSecondary whitespace-nowrap">{formatDate(r.date)}</td>
                  <td className="px-4 py-2.5 font-medium">{r.invoiceNumber}</td>
                  <td className="px-4 py-2.5 text-textSecondary">{DOC_TYPE_LABELS[r.documentType] || r.documentType}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-textPrimary">{r.customerName || '-'}</div>
                    {r.customerGstin && <div className="text-[10px] text-textSecondary">{r.customerGstin}</div>}
                  </td>
                  <td className="px-4 py-2.5 text-textSecondary text-xs">{r.placeOfSupply || '-'}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-textSecondary">{formatCurrency(r.taxableValue)}</td>
                  <td className="px-4 py-2.5 text-center text-textSecondary">{r.taxRate}%</td>
                  <td className="px-4 py-2.5 text-right font-mono text-textSecondary">{formatCurrency(r.cgst)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-textSecondary">{formatCurrency(r.sgst)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-textSecondary">{formatCurrency(r.igst)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium">{formatCurrency(r.totalInvoiceValue)}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-600'}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-border font-semibold text-sm">
                <tr>
                  <td className="px-4 py-3 uppercase tracking-wider text-textPrimary" colSpan={5}>Total</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(totals.taxableValue)}</td>
                  <td></td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(totals.cgst)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(totals.sgst)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(totals.igst)}</td>
                  <td className="px-4 py-3 text-right font-mono text-primary">{formatCurrency(totals.totalInvoiceValue)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
