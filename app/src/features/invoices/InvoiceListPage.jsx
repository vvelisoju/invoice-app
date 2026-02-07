import { useState, useEffect, useRef, useCallback } from 'react'
import { useHistory } from 'react-router-dom'
import { Search, FileText, Plus, Loader2 } from 'lucide-react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { invoiceApi } from '../../lib/api'
import { PageHeader } from '../../components/layout'

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ISSUED: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  VOID: 'bg-gray-200 text-gray-700'
}

const STATUS_LABELS = {
  DRAFT: 'Draft',
  ISSUED: 'Issued',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
  VOID: 'Void'
}

const statusTabs = [
  { key: 'all', label: 'All' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'ISSUED', label: 'Issued' },
  { key: 'PAID', label: 'Paid' }
]

export default function InvoiceListPage() {
  const history = useHistory()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const searchTimeout = useRef(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value
    setSearchQuery(value)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => setDebouncedSearch(value), 300)
  }, [])

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
      const totalFetched = allPages.reduce((sum, page) => sum + (page.data?.length || 0), 0)
      if (lastPage.data?.length < 20) return undefined
      return totalFetched
    },
    initialPageParam: 0
  })

  const invoices = data?.pages.flatMap(page => page.data || []) || []

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short'
    })
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Invoices"
        actions={
          <button
            onClick={() => history.push('/invoices/new')}
            className="px-5 py-2.5 bg-primary hover:bg-primaryHover text-white rounded-lg transition-all font-medium text-sm shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
        }
      />

      {/* Search + Filters */}
      <div className="bg-bgSecondary rounded-xl border border-border shadow-card mb-6">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search invoices..."
              className="w-full pl-10 pr-4 py-2.5 bg-bgPrimary border border-transparent focus:border-primary focus:bg-white rounded-lg text-sm text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>
        <div className="px-4 py-2 flex gap-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                statusFilter === tab.key
                  ? 'bg-primary/10 text-primary'
                  : 'text-textSecondary hover:bg-bgPrimary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-textSecondary mb-1">No invoices yet</h2>
          <p className="text-sm text-textSecondary">Create your first invoice to get started</p>
        </div>
      ) : (
        <div className="bg-bgSecondary rounded-xl border border-border shadow-card overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border bg-bgPrimary/50">
            <div className="col-span-4 text-[11px] font-bold text-textSecondary uppercase tracking-wider">Invoice</div>
            <div className="col-span-3 text-[11px] font-bold text-textSecondary uppercase tracking-wider">Customer</div>
            <div className="col-span-2 text-[11px] font-bold text-textSecondary uppercase tracking-wider">Date</div>
            <div className="col-span-2 text-[11px] font-bold text-textSecondary uppercase tracking-wider text-right">Amount</div>
            <div className="col-span-1 text-[11px] font-bold text-textSecondary uppercase tracking-wider text-right">Status</div>
          </div>

          {/* Rows */}
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              onClick={() => history.push(`/invoices/${invoice.id}`)}
              className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border last:border-b-0 hover:bg-bgPrimary/30 cursor-pointer transition-colors"
            >
              <div className="col-span-4">
                <span className="text-sm font-semibold text-textPrimary">#{invoice.invoiceNumber}</span>
              </div>
              <div className="col-span-3">
                <span className="text-sm text-textSecondary truncate">{invoice.customer?.name || 'No customer'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-sm text-textSecondary">{formatDate(invoice.date)}</span>
              </div>
              <div className="col-span-2 text-right">
                <span className="text-sm font-semibold text-textPrimary">{formatCurrency(invoice.total)}</span>
              </div>
              <div className="col-span-1 text-right">
                <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[invoice.status]}`}>
                  {STATUS_LABELS[invoice.status]}
                </span>
              </div>
            </div>
          ))}

          {/* Load More */}
          {hasNextPage && (
            <div className="px-6 py-4 text-center border-t border-border">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="text-sm text-primary hover:underline font-medium"
              >
                {isFetchingNextPage ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
