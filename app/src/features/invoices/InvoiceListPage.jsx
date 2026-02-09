import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { Plus, Download, FileText, Loader2, SlidersHorizontal, Search, X, Users } from 'lucide-react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { invoiceApi, businessApi, customerApi } from '../../lib/api'
import Portal from '../../components/Portal'
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

// ── Customer Filter Dropdown ────────────────────────────────────────
function CustomerFilterDropdown({ customers, selected, onSelect, onClear, compact = false }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const anchorRef = useRef(null)
  const dropdownRef = useRef(null)

  const filtered = useMemo(() => {
    if (!search) return customers
    const q = search.toLowerCase()
    return customers.filter(c => c.name?.toLowerCase().includes(q))
  }, [customers, search])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (
        anchorRef.current && !anchorRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [open])

  // Position the dropdown relative to the anchor
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  useEffect(() => {
    if (!open || !anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
  }, [open])

  if (selected) {
    return (
      <div className={`flex items-center gap-2 ${compact ? 'px-2.5 py-1' : 'px-3 py-2'} bg-primary/5 border border-primary/20 rounded-lg`}>
        <Users className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-primary shrink-0`} />
        <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-primary truncate flex-1`}>{selected.name}</span>
        <button
          onClick={onClear}
          className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} flex items-center justify-center rounded-full active:bg-primary/10 md:hover:bg-primary/10 text-primary shrink-0 tap-target-auto`}
        >
          <X className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
        </button>
      </div>
    )
  }

  return (
    <div ref={anchorRef}>
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Filter by customer..."
          className={`w-full ${compact ? 'pl-7 pr-3 py-1.5 text-xs' : 'pl-8 pr-3 py-2 text-sm'} border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary tap-target-auto`}
        />
        <Users className={`${compact ? 'w-3 h-3 left-2.5 top-[7px]' : 'w-3.5 h-3.5 left-2.5 top-[10px]'} absolute text-gray-400 pointer-events-none`} />
      </div>

      {open && (
        <Portal>
          <div
            ref={dropdownRef}
            className="fixed z-50 bg-white border border-border rounded-lg shadow-xl overflow-y-auto"
            style={{ top: pos.top, left: pos.left, width: Math.max(pos.width, 200), maxHeight: compact ? 224 : 200 }}
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-xs text-textSecondary">No customers found</div>
            ) : filtered.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onSelect(c); setSearch(''); setOpen(false) }}
                className={`w-full px-3 ${compact ? 'py-2' : 'py-2.5'} text-left ${compact ? 'text-xs' : 'text-sm'} text-textPrimary active:bg-blue-50 md:hover:bg-blue-50 border-b border-border/30 last:border-b-0 flex items-center gap-2 tap-target-auto`}
              >
                <span className="truncate">{c.name}</span>
                {c.phone && <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-textSecondary shrink-0`}>{c.phone}</span>}
              </button>
            ))}
          </div>
        </Portal>
      )}
    </div>
  )
}

export default function InvoiceListPage() {
  const history = useHistory()
  const location = useLocation()
  const [statusFilter, setStatusFilter] = useState('all')

  // Fetch business profile to get enabled document types
  const { data: businessProfile } = useQuery({
    queryKey: ['business'],
    queryFn: async () => {
      const response = await businessApi.getProfile()
      return response.data?.data || response.data
    }
  })

  const enabledKeys = businessProfile?.enabledInvoiceTypes || ['invoice', 'quote', 'receipt']
  const filteredDocTypeOptions = useMemo(
    () => DOC_TYPE_OPTIONS.filter(opt => enabledKeys.includes(opt.key)),
    [enabledKeys]
  )

  const [docTypeFilters, setDocTypeFilters] = useState(() => {
    const initial = {}
    DOC_TYPE_OPTIONS.forEach(opt => { initial[opt.key] = true })
    return initial
  })
  const searchTimeout = useRef(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Customer filter state
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  // Fetch customers for the dropdown
  const { data: customersData } = useQuery({
    queryKey: ['customers', 'filter-list'],
    queryFn: async () => {
      const response = await customerApi.list({ limit: 200 })
      return response.data?.customers || response.data || []
    }
  })
  const allCustomers = customersData || []

  // Read ?customerId= from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const custId = params.get('customerId')
    if (custId && !selectedCustomer) {
      customerApi.get(custId).then(res => {
        const customer = res.data?.data || res.data
        if (customer) setSelectedCustomer(customer)
      }).catch(() => {})
    }
  }, [location.search])

  const handleCustomerClear = () => { setSelectedCustomer(null); history.replace('/invoices') }

  useEffect(() => () => clearTimeout(searchTimeout.current), [])

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['invoices', debouncedSearch, statusFilter, selectedCustomer?.id],
    queryFn: async ({ pageParam = 0 }) => {
      const params = {
        limit: 20,
        offset: pageParam,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(selectedCustomer?.id && { customerId: selectedCustomer.id })
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
              options={filteredDocTypeOptions.map((o) => ({ ...o, checked: docTypeFilters[o.key] ?? true }))}
              onChange={handleDocTypeChange}
            />
            {/* Mobile Customer Filter */}
            <CustomerFilterDropdown
              customers={allCustomers}
              selected={selectedCustomer}
              onSelect={setSelectedCustomer}
              onClear={handleCustomerClear}
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

      {/* Secondary Filters — desktop */}
      <div className="hidden md:flex items-center gap-4 px-8 max-w-7xl">
        <div className="flex-1">
          <CheckboxFilter
            label="Document Type:"
            options={filteredDocTypeOptions.map((o) => ({ ...o, checked: docTypeFilters[o.key] ?? true }))}
            onChange={handleDocTypeChange}
          />
        </div>
        {/* Desktop Customer Filter */}
        <div className="shrink-0 w-52">
          <CustomerFilterDropdown
            customers={allCustomers}
            selected={selectedCustomer}
            onSelect={setSelectedCustomer}
            onClear={handleCustomerClear}
            compact
          />
        </div>
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
