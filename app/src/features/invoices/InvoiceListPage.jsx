import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { Plus, Download, FileText, Loader2, SlidersHorizontal, Search } from 'lucide-react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { invoiceApi } from '../../lib/api'
import {
  DataTable,
  StatusFilterPills,
  CheckboxFilter,
  PageToolbar,
  TableSummary
} from '../../components/data-table'

const DOC_TYPE_BADGE = {
  invoice: { label: 'Invoice', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  tax_invoice: { label: 'Tax Invoice', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  proforma: { label: 'Proforma', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  receipt: { label: 'Receipt', className: 'bg-green-50 text-green-700 border-green-200' },
  sales_receipt: { label: 'Sales Receipt', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cash_receipt: { label: 'Cash Receipt', className: 'bg-teal-50 text-teal-700 border-teal-200' },
  quote: { label: 'Quote', className: 'bg-gray-50 text-gray-700 border-gray-200' },
  estimate: { label: 'Estimate', className: 'bg-slate-50 text-slate-700 border-slate-200' },
  credit_memo: { label: 'Credit Memo', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  credit_note: { label: 'Credit Note', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  purchase_order: { label: 'Purchase Order', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  delivery_note: { label: 'Delivery Note', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
}

const STATUS_FILTERS = [
  { key: 'all', label: 'All Documents' },
  { key: 'ISSUED', label: 'Unpaid', badgeColor: 'bg-accentOrange' },
  { key: 'PAID', label: 'Paid', badgeColor: 'bg-green-600' },
  { key: 'DRAFT', label: 'Draft', badgeColor: 'bg-gray-400' },
]

const DOC_TYPE_OPTIONS = [
  { key: 'invoice', label: 'Invoice' },
  { key: 'tax_invoice', label: 'Tax Invoice' },
  { key: 'proforma', label: 'Proforma' },
  { key: 'receipt', label: 'Receipt' },
  { key: 'sales_receipt', label: 'Sales Receipt' },
  { key: 'cash_receipt', label: 'Cash Receipt' },
  { key: 'quote', label: 'Quote' },
  { key: 'estimate', label: 'Estimate' },
  { key: 'credit_memo', label: 'Credit Memo' },
  { key: 'credit_note', label: 'Credit Note' },
  { key: 'purchase_order', label: 'Purchase Order' },
  { key: 'delivery_note', label: 'Delivery Note' },
]

const TABLE_COLUMNS = [
  { key: 'customer', label: 'Customer', colSpan: 3 },
  { key: 'docType', label: 'Document', colSpan: 2, headerAlign: 'center', align: 'center' },
  { key: 'number', label: 'Number', colSpan: 1, headerAlign: 'center', align: 'center' },
  { key: 'date', label: 'Date', colSpan: 2, headerAlign: 'center', align: 'center' },
  { key: 'tax', label: 'Tax', colSpan: 1, headerAlign: 'right', align: 'right' },
  { key: 'total', label: 'Total', colSpan: 2, headerAlign: 'right', align: 'right' },
]

export default function InvoiceListPage() {
  const history = useHistory()
  const [statusFilter, setStatusFilter] = useState('all')
  const [docTypeFilters, setDocTypeFilters] = useState(() => {
    const initial = {}
    DOC_TYPE_OPTIONS.forEach(opt => { initial[opt.key] = true })
    return initial
  })
  const searchTimeout = useRef(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => () => clearTimeout(searchTimeout.current), [])

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['invoices', debouncedSearch, statusFilter],
    queryFn: async ({ pageParam = 0 }) => {
      const params = {
        limit: 20,
        offset: pageParam,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      }
      const response = await invoiceApi.list(params)
      return response.data
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((sum, page) => sum + (page.invoices?.length || 0), 0)
      if (lastPage.invoices?.length < 20) return undefined
      return totalFetched
    },
    initialPageParam: 0
  })

  const invoices = data?.pages.flatMap(page => page.invoices || []) || []

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
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

  // Filter by doc type checkboxes
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const type = inv.documentType || 'invoice'
      return docTypeFilters[type] !== false
    })
  }, [invoices, docTypeFilters])

  // Compute counts for filter pills
  const counts = useMemo(() => {
    const c = { all: filteredInvoices.length, ISSUED: 0, PAID: 0, OVERDUE: 0, DRAFT: 0 }
    filteredInvoices.forEach((inv) => {
      if (inv.status === 'ISSUED') c.ISSUED++
      else if (inv.status === 'PAID') c.PAID++
      else if (inv.status === 'OVERDUE') c.OVERDUE++
      else if (inv.status === 'DRAFT') c.DRAFT++
    })
    return c
  }, [filteredInvoices])

  const filtersWithCounts = STATUS_FILTERS.map((f) => ({ ...f, count: counts[f.key] ?? 0 }))

  // Compute summary totals (Prisma Decimals come as strings — must parseFloat)
  const summary = useMemo(() => {
    let total = 0, subtotal = 0, tax = 0
    filteredInvoices.forEach((inv) => {
      total += parseFloat(inv.total) || 0
      subtotal += parseFloat(inv.subtotal) || 0
      tax += parseFloat(inv.taxTotal) || 0
    })
    return { total, subtotal, tax }
  }, [filteredInvoices])

  const handleDocTypeChange = (key, checked) => {
    setDocTypeFilters((prev) => ({ ...prev, [key]: checked }))
  }

  const getDocBadge = (invoice) => {
    const type = invoice.documentType || 'invoice'
    return DOC_TYPE_BADGE[type] || DOC_TYPE_BADGE.invoice
  }

  const isPaid = (invoice) => invoice.status === 'PAID'

  // Export filtered invoices as CSV
  const handleExport = useCallback(() => {
    if (filteredInvoices.length === 0) return
    const headers = ['Customer', 'Document Type', 'Number', 'Date', 'Subtotal', 'Tax', 'Total', 'Status']
    const rows = filteredInvoices.map(inv => [
      `"${(inv.customer?.name || '').replace(/"/g, '""')}"`,
      (DOC_TYPE_BADGE[inv.documentType || 'invoice']?.label || inv.documentType),
      inv.invoiceNumber || '',
      formatDate(inv.date),
      (parseFloat(inv.subtotal) || 0).toFixed(2),
      (parseFloat(inv.taxTotal) || 0).toFixed(2),
      (parseFloat(inv.total) || 0).toFixed(2),
      inv.status || '',
    ])
    rows.push(['', '', '', 'TOTAL', (summary.subtotal).toFixed(2), (summary.tax).toFixed(2), (summary.total).toFixed(2), ''])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `documents_${Date.now()}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [filteredInvoices, summary])

  const getRowClassName = (invoice) => {
    if (isPaid(invoice)) return 'opacity-50 hover:opacity-80 border-l-2 border-transparent'
    return 'border-l-2 border-accentOrange'
  }

  const renderRow = (invoice) => {
    const badge = getDocBadge(invoice)
    const taxAmount = parseFloat(invoice.taxTotal) || 0

    return [
      // Customer
      <div key="customer">
        <div className={`font-semibold ${invoice.customer?.name ? 'text-textPrimary' : 'text-textSecondary italic'}`}>
          {invoice.customer?.name || '<No Name>'}
        </div>
        {invoice.customer?.gstin && (
          <div className="text-xs text-textSecondary">GST: {invoice.customer.gstin}</div>
        )}
      </div>,
      // Document type badge
      <span key="type" className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${badge.className}`}>
        {badge.label}
      </span>,
      // Number
      <span key="number" className="text-textSecondary font-mono text-xs">{invoice.invoiceNumber}</span>,
      // Date
      <span key="date" className="text-textSecondary text-sm">{formatDate(invoice.date)}</span>,
      // Tax
      <span key="tax" className="text-textSecondary font-medium">{formatCurrency(taxAmount)}</span>,
      // Total
      <span key="total" className="font-bold text-textPrimary text-base">{formatCurrency(parseFloat(invoice.total) || 0)}</span>,
    ]
  }

  const [showMobileFilters, setShowMobileFilters] = useState(false)

  return (
    <div className="h-full flex flex-col">
      {/* Primary Filter Section */}
      <PageToolbar
        title="Documents"
        subtitle="Track and manage all your business documents"
        mobileActions={
          <>
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
                showMobileFilters ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-textSecondary active:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={() => history.push('/invoices/new')}
              className="w-10 h-10 flex items-center justify-center text-white bg-primary active:bg-primaryHover rounded-lg shadow-sm"
            >
              <Plus className="w-5 h-5" />
            </button>
          </>
        }
        actions={
          <>
            <button
              onClick={handleExport}
              disabled={filteredInvoices.length === 0}
              className="px-4 py-2 text-sm font-medium text-textSecondary hover:text-textPrimary hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => history.push('/invoices/new')}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primaryHover rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Document
            </button>
          </>
        }
      >
        {/* Mobile: collapsible filters */}
        {showMobileFilters && (
          <div className="md:hidden space-y-3 mb-1">
            <StatusFilterPills
              filters={filtersWithCounts}
              activeKey={statusFilter}
              onChange={setStatusFilter}
            />
            <CheckboxFilter
              label="Document Type:"
              options={DOC_TYPE_OPTIONS.map((o) => ({ ...o, checked: docTypeFilters[o.key] ?? true }))}
              onChange={handleDocTypeChange}
            />
          </div>
        )}
        {/* Desktop: always visible */}
        <div className="hidden md:block">
          <StatusFilterPills
            filters={filtersWithCounts}
            activeKey={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      </PageToolbar>

      {/* Secondary Filters — desktop only */}
      <div className="hidden md:block">
        <CheckboxFilter
          label="Document Type:"
          options={DOC_TYPE_OPTIONS.map((o) => ({ ...o, checked: docTypeFilters[o.key] ?? true }))}
          onChange={handleDocTypeChange}
        />
      </div>

      {/* Table Section */}
      <div className="flex-1 px-3 md:px-8 py-4 md:py-6 pb-mobile-nav overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <DataTable
            columns={TABLE_COLUMNS}
            rows={filteredInvoices}
            rowKey={(inv) => inv.id}
            renderRow={renderRow}
            onRowClick={(inv) => history.push(`/invoices/${inv.id}`)}
            getRowClassName={getRowClassName}
            selectable={true}
            isLoading={isLoading}
            emptyIcon={<FileText className="w-16 h-16 text-gray-300 mb-4" />}
            emptyTitle="No documents yet"
            emptyMessage="Create your first invoice to get started"
            renderMobileCard={(invoice) => {
              const badge = getDocBadge(invoice)
              return (
                <div>
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div className="min-w-0 flex-1">
                      <div className={`font-semibold text-sm ${invoice.customer?.name ? 'text-textPrimary' : 'text-textSecondary italic'}`}>
                        {invoice.customer?.name || '<No Name>'}
                      </div>
                    </div>
                    <span className="font-bold text-textPrimary text-base shrink-0">{formatCurrency(parseFloat(invoice.total) || 0)}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border tap-target-auto ${badge.className}`}>{badge.label}</span>
                    <span className="text-xs text-textSecondary font-mono tap-target-auto">{invoice.invoiceNumber}</span>
                    <span className="text-xs text-textSecondary tap-target-auto">{formatDate(invoice.date)}</span>
                    <span className="text-xs text-textSecondary font-medium ml-auto tap-target-auto">{invoice.status}</span>
                  </div>
                </div>
              )
            }}
            loadMore={{
              hasMore: hasNextPage,
              isLoading: isFetchingNextPage,
              onLoadMore: fetchNextPage
            }}
            footer={
              filteredInvoices.length > 0 && (
                <TableSummary
                  rows={[
                    { label: 'Subtotal', value: `${formatCurrency(summary.subtotal).replace('₹', '').trim()} INR` },
                    { label: 'Tax', value: `${formatCurrency(summary.tax).replace('₹', '').trim()} INR`, valueClassName: 'text-textSecondary' },
                  ]}
                  totalRow={{
                    label: 'Total',
                    value: `${formatCurrency(summary.total).replace('₹', '').trim()} INR`,
                    valueClassName: 'text-primary'
                  }}
                />
              )
            }
          />
        </div>
      </div>

      {/* Footer — hidden on mobile */}
      <div className="hidden md:block text-center py-4 bg-bgPrimary">
        <p className="text-xs text-textSecondary">© 2026 Invoice Baba. All rights reserved.</p>
      </div>
    </div>
  )
}
