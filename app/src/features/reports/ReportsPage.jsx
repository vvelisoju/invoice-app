import { useState, useMemo } from 'react'
import { Search, Calendar, ChevronDown, FileText, FileSpreadsheet, Printer, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../lib/api'

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

function getFirstDayOfMonth() {
  const date = new Date()
  date.setDate(1)
  return date.toISOString().split('T')[0]
}

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

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [docTypeFilter, setDocTypeFilter] = useState('all')
  const [quickFilter, setQuickFilter] = useState('all')
  const [searchParams, setSearchParams] = useState({})

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', 'documents', searchParams],
    queryFn: async () => {
      const response = await reportsApi.getDocuments(searchParams)
      return response.data.data || response.data
    }
  })

  const documents = reportData?.documents || []
  const totals = reportData?.totals || {}

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

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

          <div className="w-px h-6 bg-border mx-1" />

          <button className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-200 font-medium text-xs px-4 py-2 rounded shadow-sm flex items-center gap-2 transition-colors">
            <FileText className="w-3.5 h-3.5 text-red-600" />
            Export to PDF
          </button>
          <button className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-200 font-medium text-xs px-4 py-2 rounded shadow-sm flex items-center gap-2 transition-colors">
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
            Export to Excel
          </button>
          <button className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-200 font-medium text-xs px-4 py-2 rounded shadow-sm flex items-center gap-2 transition-colors">
            <Printer className="w-3.5 h-3.5 text-gray-600" />
            Print
          </button>
        </div>

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
    </div>
  )
}
