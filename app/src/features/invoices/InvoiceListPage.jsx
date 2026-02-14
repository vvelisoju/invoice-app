import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { Plus, Download, FileText, Loader2, SlidersHorizontal, X, Users, Trash2, AlertTriangle } from 'lucide-react'
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoiceApi, businessApi, customerApi } from '../../lib/api'
import { DEFAULT_ENABLED_TYPES } from '../../components/layout/navigationConfig'
import Portal from '../../components/Portal'
import {
  DataTable,
  StatusFilterPills,
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
  { key: 'inactive', label: 'Inactive', badgeColor: 'bg-gray-400' },
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

// ── Customer Multi-Select Filter ────────────────────────────────────
function CustomerMultiFilter({ customers, selectedIds, onToggle, onClear, compact = false }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const anchorRef = useRef(null)
  const dropdownRef = useRef(null)

  const filtered = useMemo(() => {
    const list = search
      ? customers.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()))
      : customers
    return list
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

  const selectedCustomers = customers.filter(c => selectedIds.includes(c.id))

  const inputRef = useRef(null)

  return (
    <div ref={anchorRef}>
      {/* Tag-input style container */}
      <div
        onClick={() => inputRef.current?.focus()}
        className={`flex items-center flex-wrap gap-1 ${compact ? 'min-h-[32px] px-2 py-1' : 'min-h-[38px] px-2.5 py-1.5'} border border-border rounded-lg bg-white cursor-text transition-all focus-within:ring-1 focus-within:ring-primary focus-within:border-primary`}
      >
        <Users className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-gray-400 shrink-0`} />
        {/* Selected chips inside the input */}
        {selectedCustomers.map(c => (
          <span
            key={c.id}
            className={`inline-flex items-center gap-0.5 ${compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'} bg-primary/8 text-primary rounded-md font-medium shrink-0`}
          >
            <span className="truncate max-w-[100px]">{c.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(c) }}
              className="w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-primary/15 tap-target-auto shrink-0 ml-0.5"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        {/* Inline search input */}
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={selectedCustomers.length ? 'Add customer...' : 'Search customers...'}
          className={`flex-1 min-w-[80px] outline-none bg-transparent ${compact ? 'text-[11px] py-0' : 'text-xs py-0'} placeholder:text-gray-400 tap-target-auto`}
        />
        {selectedCustomers.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onClear() }}
            className={`${compact ? 'text-[10px]' : 'text-[11px]'} text-textSecondary hover:text-red-500 font-medium shrink-0 tap-target-auto`}
          >
            Clear
          </button>
        )}
      </div>

      {open && (
        <Portal>
          <div
            ref={dropdownRef}
            className="fixed z-50 bg-white border border-border rounded-lg shadow-xl overflow-y-auto"
            style={{ top: pos.top, left: pos.left, width: Math.max(pos.width, 220), maxHeight: 224 }}
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-xs text-textSecondary">No customers found</div>
            ) : filtered.map(c => {
              const isSelected = selectedIds.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { onToggle(c); setSearch('') }}
                  className={`w-full px-3 py-2 text-left text-xs text-textPrimary active:bg-blue-50 md:hover:bg-blue-50 border-b border-border/30 last:border-b-0 flex items-center gap-2 tap-target-auto ${
                    isSelected ? 'bg-primary/5' : ''
                  }`}
                >
                  <span className={`truncate flex-1 ${isSelected ? 'font-semibold text-primary' : ''}`}>{c.name}</span>
                  {isSelected && <span className="text-primary text-[10px] font-bold shrink-0">✓</span>}
                  {!isSelected && c.phone && <span className="text-[10px] text-textSecondary shrink-0">{c.phone}</span>}
                </button>
              )
            })}
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
  const [selectedIds, setSelectedIds] = useState([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const queryClient = useQueryClient()

  // Fetch business profile to get enabled document types
  const { data: businessProfile } = useQuery({
    queryKey: ['business'],
    queryFn: async () => {
      const response = await businessApi.getProfile()
      return response.data?.data || response.data
    }
  })

  const enabledKeys = businessProfile?.enabledInvoiceTypes || DEFAULT_ENABLED_TYPES
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

  // Customer filter state — multi-select
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([])

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
    if (custId && selectedCustomerIds.length === 0) {
      setSelectedCustomerIds([custId])
    }
  }, [location.search])

  const handleCustomerToggle = (customer) => {
    setSelectedCustomerIds(prev =>
      prev.includes(customer.id)
        ? prev.filter(id => id !== customer.id)
        : [...prev, customer.id]
    )
  }
  const handleCustomerClear = () => { setSelectedCustomerIds([]); history.replace('/invoices') }

  useEffect(() => () => clearTimeout(searchTimeout.current), [])

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['invoices', debouncedSearch, statusFilter, selectedCustomerIds],
    queryFn: async ({ pageParam = 0 }) => {
      const params = {
        limit: 20,
        offset: pageParam,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter === 'inactive' ? { active: 'false' } : statusFilter !== 'all' && { status: statusFilter, active: 'true' }),
        ...(statusFilter === 'all' && { active: 'true' }),
        ...(selectedCustomerIds.length === 1 && { customerId: selectedCustomerIds[0] })
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

  // Filter by doc type + multi-customer (client-side for >1 customer)
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const type = inv.documentType || 'invoice'
      if (docTypeFilters[type] === false) return false
      if (selectedCustomerIds.length > 1 && !selectedCustomerIds.includes(inv.customerId)) return false
      return true
    })
  }, [invoices, docTypeFilters, selectedCustomerIds])

  // Compute counts for filter pills
  const counts = useMemo(() => {
    const c = { all: filteredInvoices.length, ISSUED: 0, PAID: 0, OVERDUE: 0, DRAFT: 0, inactive: 0 }
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

  // Check if all doc types are selected (treat as "all" — no filtering)
  const allDocTypesSelected = filteredDocTypeOptions.every(opt => docTypeFilters[opt.key] !== false)

  // Toggle a doc type pill: if all are on, turn all off except clicked; if only one on and it's clicked, turn all on
  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (invoiceIds) => {
      const response = await invoiceApi.bulkDelete(invoiceIds)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setSelectedIds([])
      setShowDeleteConfirm(false)
    }
  })

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    bulkDeleteMutation.mutate(selectedIds)
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(filteredInvoices.map(inv => inv.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id))
    }
  }

  const handleDocTypePillClick = (key) => {
    if (allDocTypesSelected) {
      // All selected → select only this one
      const next = {}
      DOC_TYPE_OPTIONS.forEach(opt => { next[opt.key] = opt.key === key })
      setDocTypeFilters(next)
    } else if (docTypeFilters[key]) {
      // This one is on — check if it's the only one
      const activeCount = filteredDocTypeOptions.filter(opt => docTypeFilters[opt.key] !== false).length
      if (activeCount === 1) {
        // Last one — turn all back on
        const next = {}
        DOC_TYPE_OPTIONS.forEach(opt => { next[opt.key] = true })
        setDocTypeFilters(next)
      } else {
        setDocTypeFilters(prev => ({ ...prev, [key]: false }))
      }
    } else {
      setDocTypeFilters(prev => ({ ...prev, [key]: true }))
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header — compact */}
      <div className="bg-white border-b border-border px-4 md:px-8 pt-2.5 md:pt-3 pb-2 md:pb-2.5">
        <div className="max-w-7xl mx-auto">
          {/* Mobile: title + actions */}
          <div className="flex items-center justify-between md:hidden mb-2">
            <h1 className="text-base font-bold text-textPrimary truncate">Documents</h1>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors tap-target-auto ${
                  showMobileFilters ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-textSecondary active:bg-gray-50'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              <button
                onClick={() => history.push('/invoices/new')}
                className="w-9 h-9 flex items-center justify-center text-white bg-primary active:bg-primaryHover rounded-lg shadow-sm tap-target-auto"
              >
                <Plus className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Desktop: title row */}
          <div className="hidden md:flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold text-textPrimary">Documents</h1>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleExport}
                disabled={filteredInvoices.length === 0}
                className="px-3 py-1.5 text-xs font-medium text-textSecondary hover:text-textPrimary hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
              <button
                onClick={() => history.push('/invoices/new')}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primaryHover rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                New Document
              </button>
            </div>
          </div>

          {/* Mobile: collapsible filters */}
          {showMobileFilters && (
            <div className="md:hidden space-y-2.5 mb-1">
              <StatusFilterPills
                filters={filtersWithCounts}
                activeKey={statusFilter}
                onChange={setStatusFilter}
              />
              {/* Customer multi-filter — mobile */}
              <CustomerMultiFilter
                customers={allCustomers}
                selectedIds={selectedCustomerIds}
                onToggle={handleCustomerToggle}
                onClear={handleCustomerClear}
              />
              {/* Doc type pills — mobile */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
                {filteredDocTypeOptions.map((opt) => {
                  const active = !allDocTypesSelected && (docTypeFilters[opt.key] !== false)
                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleDocTypePillClick(opt.key)}
                      className={`px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap shrink-0 border transition-colors tap-target-auto ${
                        active
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'text-textSecondary border-border active:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Desktop: status pills */}
          <div className="hidden md:block">
            <StatusFilterPills
              filters={filtersWithCounts}
              activeKey={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
        </div>
      </div>

      {/* Secondary Filters — desktop: customer filter (left) + doc type pills (right) */}
      <div className="hidden md:block bg-white border-b border-borderLight">
        <div className="max-w-7xl mx-auto px-8 py-1.5 flex items-center gap-3">
          {/* Customer Multi-Filter — left */}
          <div className="shrink-0 w-72">
            <CustomerMultiFilter
              customers={allCustomers}
              selectedIds={selectedCustomerIds}
              onToggle={handleCustomerToggle}
              onClear={handleCustomerClear}
              compact
            />
          </div>
          {/* Divider */}
          <div className="h-5 w-px bg-border shrink-0" />
          {/* Document Type pills — smaller */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 min-w-0">
            {filteredDocTypeOptions.map((opt) => {
              const active = !allDocTypesSelected && (docTypeFilters[opt.key] !== false)
              return (
                <button
                  key={opt.key}
                  onClick={() => handleDocTypePillClick(opt.key)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap shrink-0 border transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'text-textSecondary border-border hover:bg-gray-50 hover:text-textPrimary'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-primary/5 border-b border-primary/20 px-4 md:px-8 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="text-sm font-medium text-textPrimary">
              {selectedIds.length} document{selectedIds.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 text-xs font-medium text-textSecondary hover:text-textPrimary hover:bg-white rounded-lg transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

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
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectOne={handleSelectOne}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-textPrimary mb-2">Delete {selectedIds.length} Document{selectedIds.length !== 1 ? 's' : ''}?</h3>
              <p className="text-sm text-textSecondary mb-1">
                {selectedIds.length === 1 
                  ? 'This document will be moved to Inactive. You can view it later by selecting the Inactive filter.'
                  : `These ${selectedIds.length} documents will be moved to Inactive. You can view them later by selecting the Inactive filter.`
                }
              </p>
              <p className="text-xs text-textSecondary mt-2">This action can be reversed by restoring from Inactive.</p>
            </div>
            <div className="flex border-t border-border">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={bulkDeleteMutation.isPending}
                className="flex-1 px-4 py-3 text-sm font-medium text-textSecondary hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                className="flex-1 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 border-l border-border transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {bulkDeleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
