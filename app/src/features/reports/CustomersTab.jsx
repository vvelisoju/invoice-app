import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Calendar, Search, Loader2, Users, FileSpreadsheet, Printer
} from 'lucide-react'
import { reportsApi } from '../../lib/api'
import { saveAs } from '../../lib/nativeFile.js'

const formatCurrency = (v) =>
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0)

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

function exportToCSV(rows, totals) {
  const headers = ['Customer', 'GSTIN', 'Phone', 'State', 'Invoices', 'Taxable Value', 'Tax Collected', 'Total Revenue', 'Paid', 'Outstanding']
  const csvRows = rows.map(r => [
    `"${(r.customerName || '').replace(/"/g, '""')}"`,
    r.gstin || '',
    r.phone || '',
    `"${r.state || ''}"`,
    r.invoiceCount,
    r.taxableValue.toFixed(2),
    r.taxCollected.toFixed(2),
    r.totalRevenue.toFixed(2),
    r.paidAmount.toFixed(2),
    r.outstanding.toFixed(2),
  ])
  csvRows.push(['', '', '', 'TOTAL', totals.invoiceCount, totals.taxableValue.toFixed(2), totals.taxCollected.toFixed(2), totals.totalRevenue.toFixed(2), totals.paidAmount.toFixed(2), totals.outstanding.toFixed(2)])
  const csv = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const d = new Date()
  saveAs(blob, `CustomerSummary_${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}.csv`)
}

export default function CustomersTab() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [activeQuick, setActiveQuick] = useState('')
  const [searchParams, setSearchParams] = useState({})

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'customer-summary', searchParams],
    queryFn: async () => {
      const res = await reportsApi.getCustomerSummary(searchParams)
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
            <p className="text-[10px] font-semibold text-textSecondary uppercase tracking-wider">Customers</p>
            <p className="text-lg font-bold text-textPrimary mt-0.5">{totals.customerCount}</p>
          </div>
          <div className="bg-white border border-border rounded-lg p-3">
            <p className="text-[10px] font-semibold text-textSecondary uppercase tracking-wider">Invoices</p>
            <p className="text-lg font-bold text-textPrimary mt-0.5">{totals.invoiceCount}</p>
          </div>
          <div className="bg-white border border-border rounded-lg p-3">
            <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Revenue</p>
            <p className="text-lg font-bold text-primary mt-0.5">₹{formatCurrency(totals.totalRevenue)}</p>
          </div>
          <div className="bg-white border border-border rounded-lg p-3">
            <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wider">Paid</p>
            <p className="text-lg font-bold text-textPrimary mt-0.5">₹{formatCurrency(totals.paidAmount)}</p>
          </div>
          <div className="bg-white border border-border rounded-lg p-3">
            <p className="text-[10px] font-semibold text-orange-600 uppercase tracking-wider">Outstanding</p>
            <p className="text-lg font-bold text-orange-600 mt-0.5">₹{formatCurrency(totals.outstanding)}</p>
          </div>
        </div>
      )}

      {/* Export bar */}
      {rows.length > 0 && (
        <div className="flex items-center gap-2">
          <button onClick={() => exportToCSV(rows, totals)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50 text-[10px] font-semibold text-textSecondary uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">GSTIN</th>
                <th className="px-4 py-3 text-left">State</th>
                <th className="px-4 py-3 text-center">Invoices</th>
                <th className="px-4 py-3 text-right">Taxable Value</th>
                <th className="px-4 py-3 text-right">Tax Collected</th>
                <th className="px-4 py-3 text-right">Total Revenue</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderLight text-sm">
              {isLoading ? (
                <tr><td colSpan={9} className="px-4 py-16 text-center">
                  <Loader2 className="w-7 h-7 text-primary animate-spin mx-auto" />
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-16 text-center text-textSecondary">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium">No customer data found</p>
                  <p className="text-xs mt-1">Select a date range to view customer summary</p>
                </td></tr>
              ) : rows.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-textPrimary">{r.customerName}</div>
                    {r.phone && <div className="text-[10px] text-textSecondary">{r.phone}</div>}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-textSecondary">{r.gstin || '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-textSecondary">{r.state || '-'}</td>
                  <td className="px-4 py-2.5 text-center">{r.invoiceCount}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-textSecondary">{formatCurrency(r.taxableValue)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-textSecondary">{formatCurrency(r.taxCollected)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium">{formatCurrency(r.totalRevenue)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-green-600">{formatCurrency(r.paidAmount)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium text-orange-600">
                    {r.outstanding > 0 ? formatCurrency(r.outstanding) : <span className="text-textSecondary">0.00</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-border font-semibold text-sm">
                <tr>
                  <td className="px-4 py-3 uppercase tracking-wider text-textPrimary" colSpan={3}>Total ({totals.customerCount} customers)</td>
                  <td className="px-4 py-3 text-center">{totals.invoiceCount}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(totals.taxableValue)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(totals.taxCollected)}</td>
                  <td className="px-4 py-3 text-right font-mono text-primary">{formatCurrency(totals.totalRevenue)}</td>
                  <td className="px-4 py-3 text-right font-mono text-green-600">{formatCurrency(totals.paidAmount)}</td>
                  <td className="px-4 py-3 text-right font-mono text-orange-600">{formatCurrency(totals.outstanding)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
