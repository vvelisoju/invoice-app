import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { Plus, Download, FileText } from 'lucide-react'
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
  INVOICE: { label: 'Invoice', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  QUOTE: { label: 'Quote', className: 'bg-gray-50 text-gray-700 border-gray-200' },
  RECEIPT: { label: 'Cash Receipt', className: 'bg-green-50 text-green-700 border-green-200' },
  CREDIT_NOTE: { label: 'Credit Note', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  DELIVERY_NOTE: { label: 'Delivery Note', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  PURCHASE_ORDER: { label: 'Purchase Order', className: 'bg-orange-50 text-orange-700 border-orange-200' },
}

const STATUS_FILTERS = [
  { key: 'all', label: 'All Documents' },
  { key: 'ISSUED', label: 'Unpaid', badgeColor: 'bg-accentOrange' },
  { key: 'OVERDUE', label: 'Overdue', badgeColor: 'bg-red-500' },
  { key: 'PARTIAL', label: 'Partially Paid', badgeColor: 'bg-blue-500' },
  { key: 'PAID', label: 'Paid', badgeColor: 'bg-green-600' },
]

const STATUS_EXTRAS = [
  { key: 'SENT', label: 'Sent by Email' },
  { key: 'TRASH', label: 'Trash', badgeColor: 'bg-gray-400' },
]

const DOC_TYPE_OPTIONS = [
  { key: 'INVOICE', label: 'Invoice' },
  { key: 'QUOTE', label: 'Quote' },
  { key: 'RECEIPT', label: 'Cash Receipt' },
]

const TABLE_COLUMNS = [
  { key: 'customer', label: 'Customer', colSpan: 3 },
  { key: 'docType', label: 'Document', colSpan: 2, headerAlign: 'center', align: 'center' },
  { key: 'number', label: 'Number', colSpan: 1, headerAlign: 'center', align: 'center' },
  { key: 'date', label: 'Date', colSpan: 2, headerAlign: 'center', align: 'center' },
  { key: 'paid', label: 'Paid', colSpan: 1, headerAlign: 'right', align: 'right' },
  { key: 'total', label: 'Total', colSpan: 2, headerAlign: 'right', align: 'right' },
]

export default function InvoiceListPage() {
  const history = useHistory()
  const [statusFilter, setStatusFilter] = useState('all')
  const [docTypeFilters, setDocTypeFilters] = useState({ INVOICE: true, QUOTE: true, RECEIPT: true })
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

  // Compute counts for filter pills
  const counts = useMemo(() => {
    const c = { all: invoices.length, ISSUED: 0, PAID: 0, OVERDUE: 0, PARTIAL: 0, SENT: 0, TRASH: 0 }
    invoices.forEach((inv) => {
      if (inv.status === 'ISSUED') c.ISSUED++
      if (inv.status === 'PAID') c.PAID++
    })
    return c
  }, [invoices])

  const filtersWithCounts = STATUS_FILTERS.map((f) => ({ ...f, count: counts[f.key] ?? 0 }))
  const extrasWithCounts = STATUS_EXTRAS.map((f) => ({ ...f, count: counts[f.key] ?? 0 }))

  // Compute summary totals
  const summary = useMemo(() => {
    let total = 0, paid = 0
    invoices.forEach((inv) => {
      total += inv.total || 0
      paid += inv.paidAmount || 0
    })
    return { total, paid, balance: total - paid }
  }, [invoices])

  const handleDocTypeChange = (key, checked) => {
    setDocTypeFilters((prev) => ({ ...prev, [key]: checked }))
  }

  const getDocBadge = (invoice) => {
    const type = invoice.documentType || 'INVOICE'
    return DOC_TYPE_BADGE[type] || DOC_TYPE_BADGE.INVOICE
  }

  const isPaid = (invoice) => invoice.status === 'PAID'

  const getRowClassName = (invoice) => {
    if (isPaid(invoice)) return 'opacity-50 hover:opacity-80 border-l-2 border-transparent'
    return 'border-l-2 border-accentOrange'
  }

  const renderRow = (invoice) => {
    const badge = getDocBadge(invoice)
    const paidAmount = invoice.paidAmount || 0
    const paidColor = isPaid(invoice) ? 'text-green-600' : 'text-accentOrange'

    return [
      // Customer
      <div key="customer">
        <div className={`font-semibold ${invoice.customer?.name ? 'text-textPrimary' : 'text-textSecondary italic'}`}>
          {invoice.customer?.name || '<No Name>'}
        </div>
        {invoice.customer?.gst && (
          <div className="text-xs text-textSecondary">GST: {invoice.customer.gst}</div>
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
      // Paid
      <span key="paid" className={`${paidColor} font-semibold`}>{formatCurrency(paidAmount)}</span>,
      // Total
      <span key="total" className="font-bold text-textPrimary text-base">{formatCurrency(invoice.total)}</span>,
    ]
  }

  return (
    <div className="h-full flex flex-col">
      {/* Primary Filter Section */}
      <PageToolbar
        title="Documents"
        subtitle="Track and manage all your business documents"
        actions={
          <>
            <button className="px-4 py-2 text-sm font-medium text-textSecondary hover:text-textPrimary hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2">
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
        <StatusFilterPills
          filters={filtersWithCounts}
          activeKey={statusFilter}
          onChange={setStatusFilter}
          extras={extrasWithCounts}
        />
      </PageToolbar>

      {/* Secondary Filters */}
      <CheckboxFilter
        label="Document Type:"
        options={DOC_TYPE_OPTIONS.map((o) => ({ ...o, checked: docTypeFilters[o.key] ?? true }))}
        onChange={handleDocTypeChange}
      />

      {/* Table Section */}
      <div className="flex-1 px-8 py-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <DataTable
            columns={TABLE_COLUMNS}
            rows={invoices}
            rowKey={(inv) => inv.id}
            renderRow={renderRow}
            onRowClick={(inv) => history.push(`/invoices/${inv.id}`)}
            getRowClassName={getRowClassName}
            selectable={true}
            isLoading={isLoading}
            emptyIcon={<FileText className="w-16 h-16 text-gray-300 mb-4" />}
            emptyTitle="No documents yet"
            emptyMessage="Create your first invoice to get started"
            loadMore={{
              hasMore: hasNextPage,
              isLoading: isFetchingNextPage,
              onLoadMore: fetchNextPage
            }}
            footer={
              invoices.length > 0 && (
                <TableSummary
                  rows={[
                    { label: 'Total', value: `${formatCurrency(summary.total).replace('₹', '').trim()} INR` },
                    { label: 'Paid Amount', value: `${formatCurrency(summary.paid).replace('₹', '').trim()} INR`, valueClassName: 'text-green-600' },
                  ]}
                  totalRow={{
                    label: 'Balance Due',
                    value: `${formatCurrency(summary.balance).replace('₹', '').trim()} INR`,
                    valueClassName: 'text-accentOrange'
                  }}
                />
              )
            }
          />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 bg-bgPrimary">
        <p className="text-xs text-textSecondary">© 2026 InvoiceApp. All rights reserved.</p>
      </div>
    </div>
  )
}
