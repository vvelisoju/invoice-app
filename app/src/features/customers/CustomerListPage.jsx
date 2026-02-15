import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { Plus, Search, Users, FileText, Pencil, Trash2, AlertTriangle, Loader2, SlidersHorizontal, Star, FolderOpen, RotateCcw } from 'lucide-react'
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customerApi } from '../../lib/api'
import {
  DataTable,
  StatusFilterPills,
  PageToolbar
} from '../../components/data-table'
import CustomerAddEditModal from './CustomerAddEditModal'
import PlanLimitModal from '../../components/PlanLimitModal'
import usePlanLimitCheck from '../../hooks/usePlanLimitCheck'
import Portal from '../../components/Portal'

const AVATAR_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-600' },
  { bg: 'bg-purple-100', text: 'text-purple-600' },
  { bg: 'bg-green-100', text: 'text-green-600' },
  { bg: 'bg-orange-100', text: 'text-orange-600' },
  { bg: 'bg-gray-100', text: 'text-gray-600' },
  { bg: 'bg-pink-100', text: 'text-pink-600' },
  { bg: 'bg-teal-100', text: 'text-teal-600' },
]

const STATUS_FILTERS = [
  { key: 'all', label: 'All Customers' },
  { key: 'outstanding', label: 'Outstanding Balance', badgeColor: 'bg-accentOrange' },
  { key: 'deleted', label: 'Deleted', badgeColor: 'bg-red-400' },
]

const TABLE_COLUMNS = [
  { key: 'name', label: 'Customer Name', colSpan: 4 },
  { key: 'emailPhone', label: 'Email / Phone', colSpan: 3 },
  { key: 'balance', label: 'Open Balance', colSpan: 2, headerAlign: 'right', align: 'right' },
  { key: 'actions', label: 'Actions', colSpan: 2, headerAlign: 'center', align: 'center' },
]

function getInitials(name) {
  if (!name) return '??'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[4]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function computeBalance(customer) {
  if (!customer.invoices || customer.invoices.length === 0) return 0
  return customer.invoices.reduce((sum, inv) => {
    if (inv.status === 'ISSUED') return sum + parseFloat(inv.total || 0)
    return sum
  }, 0)
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount || 0))
}

export default function CustomerListPage() {
  const history = useHistory()
  const location = useLocation()
  const queryClient = useQueryClient()

  // Read sidebar filter from URL query param
  const urlFilter = new URLSearchParams(location.search).get('filter') || 'all'
  const [statusFilter, setStatusFilter] = useState(urlFilter)

  // Sync status filter with URL changes (sidebar clicks)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const f = params.get('filter')
    if (f && f !== statusFilter) setStatusFilter(f)
    else if (!f && statusFilter !== 'all') setStatusFilter('all')

    // Auto-open add modal when ?action=add is in URL
    if (params.get('action') === 'add') {
      setShowAddModal(true)
      history.replace('/customers')
    }
  }, [location.search])

  // When pill filter changes, update URL
  const handleFilterChange = useCallback((key) => {
    setStatusFilter(key)
    if (key === 'all') {
      history.replace('/customers')
    } else {
      history.replace(`/customers?filter=${key}`)
    }
  }, [history])

  const [searchQuery, setSearchQuery] = useState('')
  const searchTimeout = useRef(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Plan limit pre-check
  const { planLimitData, setPlanLimitData, checkLimit } = usePlanLimitCheck()

  const handleAddCustomer = useCallback(async () => {
    const blocked = await checkLimit('customer')
    if (blocked) return
    setShowAddModal(true)
  }, [checkLimit])

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [mobileActionCustomer, setMobileActionCustomer] = useState(null)

  // Page state
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  useEffect(() => () => clearTimeout(searchTimeout.current), [])

  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchQuery(val)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(val)
      setPage(0)
    }, 300)
  }

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['customers', debouncedSearch],
    queryFn: async ({ pageParam = 0 }) => {
      const params = {
        limit: PAGE_SIZE,
        offset: pageParam,
        ...(debouncedSearch && { search: debouncedSearch })
      }
      const response = await customerApi.list(params)
      return response.data
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((sum, p) => sum + (p.customers?.length || 0), 0)
      if (lastPage.customers?.length < PAGE_SIZE) return undefined
      return totalFetched
    },
    initialPageParam: 0
  })

  const allCustomers = data?.pages.flatMap(p => p.customers || []) || []
  const totalCount = data?.pages[0]?.total || 0

  // Fetch deleted customers
  const { data: deletedCustomersData } = useQuery({
    queryKey: ['customers', 'deleted'],
    queryFn: async () => {
      const response = await customerApi.listDeleted()
      return response.data || []
    }
  })
  const deletedCustomers = deletedCustomersData || []

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: (id) => customerApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['plan-usage'] })
    }
  })

  // Client-side filtering based on statusFilter
  const customers = useMemo(() => {
    switch (statusFilter) {
      case 'active':
        return allCustomers.filter(c => c.invoices && c.invoices.length > 0)
      case 'outstanding':
        return allCustomers.filter(c => computeBalance(c) > 0)
      case 'deleted':
        return deletedCustomers
      default:
        return allCustomers
    }
  }, [allCustomers, deletedCustomers, statusFilter])

  // Removed count calculations - displaying filters without counts

  // Pagination over filtered list
  const paginatedCustomers = useMemo(() => {
    const start = page * PAGE_SIZE
    return customers.slice(start, start + PAGE_SIZE)
  }, [customers, page])

  const totalPages = Math.max(1, Math.ceil(customers.length / PAGE_SIZE))

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => customerApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['plan-usage'] })
      setDeleteTarget(null)
    }
  })

  const handleEdit = useCallback((customer) => {
    setEditingCustomer(customer)
  }, [])

  const handleDelete = useCallback((customer) => {
    setDeleteTarget(customer)
  }, [])

  const confirmDelete = () => {
    if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
  }

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => Promise.all(ids.map(id => customerApi.delete(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['plan-usage'] })
      setSelectedIds(new Set())
      setShowBulkActions(false)
      setShowBulkDeleteConfirm(false)
    },
    onError: () => {
      // Keep modal open on error to show the error message
    }
  })

  // Bulk favorite mutation (placeholder for future)
  const bulkFavoriteMutation = useMutation({
    mutationFn: (ids) => {
      // Placeholder: future implementation for favorites
      return Promise.resolve()
    },
    onSuccess: () => {
      setSelectedIds(new Set())
      setShowBulkActions(false)
    }
  })

  const handleSelectionChange = useCallback((selectedIdsSet) => {
    setSelectedIds(selectedIdsSet)
    setShowBulkActions(selectedIdsSet.size > 0)
  }, [])

  const handleBulkDelete = () => {
    if (selectedIds.size > 0) {
      setShowBulkDeleteConfirm(true)
    }
  }

  const confirmBulkDelete = () => {
    if (selectedIds.size > 0) {
      bulkDeleteMutation.mutate(Array.from(selectedIds))
      // Don't close modal here - let it stay open until success or error
    }
  }

  const cancelBulkDelete = () => {
    if (!bulkDeleteMutation.isPending) {
      setShowBulkDeleteConfirm(false)
      bulkDeleteMutation.reset()
    }
  }

  const handleBulkFavorite = () => {
    if (selectedIds.size > 0) {
      bulkFavoriteMutation.mutate(Array.from(selectedIds))
    }
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
    setShowBulkActions(false)
  }

  const renderRow = (customer) => {
    const initials = getInitials(customer.name)
    const color = getAvatarColor(customer.name)
    const balance = computeBalance(customer)
    const isOverdue = balance > 0
    const isCredit = balance < 0

    return [
      // Customer Name + Avatar + GST
      <div key="name" className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full ${color.bg} ${color.text} flex items-center justify-center font-bold text-xs shrink-0`}>
          {initials}
        </div>
        <div>
          <div className="font-semibold text-textPrimary">{customer.name}</div>
          <div className="text-xs text-textSecondary">
            {customer.gstin ? `GST: ${customer.gstin}` : 'GST: Not Registered'}
          </div>
        </div>
      </div>,


      // Email / Phone
      <div key="emailPhone">
        <div className="text-textPrimary text-xs mb-0.5">{customer.email || '--'}</div>
        <div className="text-textSecondary text-xs">
          {customer.phone ? `+91 ${customer.phone.replace(/(\d{5})(\d{5})/, '$1 $2')}` : '--'}
        </div>
      </div>,

      // Open Balance
      <div key="balance" className="text-right">
        {isOverdue ? (
          <span className="font-bold text-accentOrange">{formatCurrency(balance)}</span>
        ) : isCredit ? (
          <>
            <span className="font-bold text-green-600">- {formatCurrency(balance)}</span>
            <div className="text-[10px] text-green-600 font-medium mt-0.5">Credit Available</div>
          </>
        ) : (
          <span className="font-medium text-textSecondary">{formatCurrency(0)}</span>
        )}
      </div>,

      // Actions
      statusFilter === 'deleted' ? (
        <div key="actions" className="flex justify-center">
          <button
            onClick={(e) => { e.stopPropagation(); restoreMutation.mutate(customer.id) }}
            disabled={restoreMutation.isPending}
            className="px-2.5 py-1 rounded-md text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 flex items-center gap-1 transition-colors disabled:opacity-50"
            title="Restore Customer"
          >
            <RotateCcw className="w-3 h-3" />
            Restore
          </button>
        </div>
      ) : (
        <div key="actions" className="flex justify-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); history.push(`/invoices?customerId=${customer.id}`) }}
            className="w-6 h-6 rounded hover:bg-blue-50 text-textSecondary hover:text-primary flex items-center justify-center transition-colors"
            title="View Documents"
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); history.push(`/invoices/new?customerId=${customer.id}`) }}
            className="w-6 h-6 rounded hover:bg-blue-50 text-textSecondary hover:text-primary flex items-center justify-center transition-colors"
            title="Create Invoice"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(customer) }}
            className="w-6 h-6 rounded hover:bg-blue-50 text-textSecondary hover:text-primary flex items-center justify-center transition-colors"
            title="Edit Customer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(customer) }}
            className="w-6 h-6 rounded hover:bg-red-50 text-textSecondary hover:text-red-500 flex items-center justify-center transition-colors"
            title="Delete Customer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    ]
  }

  const [showMobileFilters, setShowMobileFilters] = useState(false)

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <PageToolbar
        title="Customers"
        subtitle="Manage your client relationships and contact details"
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
              onClick={handleAddCustomer}
              className="w-10 h-10 flex items-center justify-center text-white bg-primary active:bg-primaryHover rounded-lg shadow-sm"
            >
              <Plus className="w-5 h-5" />
            </button>
          </>
        }
        actions={
          <>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search customers..."
                className="pl-9 pr-4 py-2.5 text-sm border border-border rounded-lg w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            </div>
            <button
              onClick={handleAddCustomer}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primaryHover rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Customer
            </button>
          </>
        }
      >
        {/* Mobile: collapsible filters */}
        {showMobileFilters && (
          <div className="md:hidden space-y-3 mb-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search customers..."
                className="pl-9 pr-4 py-2.5 text-sm border border-border rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
            </div>
            <StatusFilterPills
              filters={STATUS_FILTERS}
              activeKey={statusFilter}
              onChange={handleFilterChange}
            />
          </div>
        )}
        {/* Desktop: always visible */}
        <div className="hidden md:block">
          <StatusFilterPills
            filters={STATUS_FILTERS}
            activeKey={statusFilter}
            onChange={handleFilterChange}
          />
        </div>
      </PageToolbar>

      {/* Table */}
      <div className="flex-1 px-3 md:px-8 py-4 md:py-6 pb-mobile-nav overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Bulk Actions Bar */}
          {showBulkActions && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-900">
                  {selectedIds.size} {selectedIds.size === 1 ? 'customer' : 'customers'} selected
                </span>
                <button
                  onClick={clearSelection}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkFavorite}
                  disabled={bulkFavoriteMutation.isPending}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                  <Star className="w-4 h-4" />
                  {bulkFavoriteMutation.isPending ? 'Adding...' : 'Add to Favorite'}
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          )}
          <DataTable
            columns={TABLE_COLUMNS}
            rows={paginatedCustomers}
            rowKey={(c) => c.id}
            renderRow={renderRow}
            onRowClick={(c) => handleEdit(c)}
            onMobileRowClick={(c) => setMobileActionCustomer(c)}
            getRowClassName={() => ''}
            selectable={true}
            onSelectionChange={handleSelectionChange}
            isLoading={isLoading}
            emptyIcon={<Users className="w-16 h-16 text-gray-300 mb-4" />}
            emptyTitle={statusFilter !== 'all' ? 'No customers match this filter' : 'No customers yet'}
            emptyMessage={statusFilter !== 'all' ? 'Try a different filter or add new customers' : 'Add your first customer to get started'}
            renderMobileCard={(customer) => {
              const initials = getInitials(customer.name)
              const color = getAvatarColor(customer.name)
              const balance = computeBalance(customer)
              return (
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${color.bg} ${color.text} flex items-center justify-center font-bold text-xs shrink-0`}>
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-textPrimary truncate">{customer.name}</div>
                    <div className="text-xs text-textSecondary">
                      {customer.phone ? `+91 ${customer.phone}` : customer.email || 'No contact'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      {balance > 0 ? (
                        <span className="font-bold text-sm text-accentOrange">{formatCurrency(balance)}</span>
                      ) : (
                        <span className="font-medium text-xs text-textSecondary">{formatCurrency(0)}</span>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); history.push(`/invoices/new?customerId=${customer.id}`) }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary active:bg-primary/20 transition-colors"
                      title="Create Invoice"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            }}
            loadMore={statusFilter === 'all' ? {
              hasMore: hasNextPage,
              isLoading: isFetchingNextPage,
              onLoadMore: fetchNextPage
            } : undefined}
            footer={
              customers.length > 0 && (
                <div className="border-t border-border bg-gray-50 px-6 py-3 flex items-center justify-between">
                  <div className="text-xs text-textSecondary">
                    Showing <span className="font-medium text-textPrimary">{page * PAGE_SIZE + 1}</span> to{' '}
                    <span className="font-medium text-textPrimary">{Math.min((page + 1) * PAGE_SIZE, customers.length)}</span> of{' '}
                    <span className="font-medium text-textPrimary">{customers.length}</span> customers
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="px-3 py-2 text-xs border border-border rounded bg-white text-textSecondary active:bg-gray-50 md:hover:bg-gray-50 active:text-textPrimary md:hover:text-textPrimary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-textSecondary">
                      Page {page + 1} of {totalPages}
                    </span>
                    <button
                      onClick={() => {
                        if (page + 1 < totalPages) {
                          setPage(p => p + 1)
                        } else if (hasNextPage) {
                          fetchNextPage()
                        }
                      }}
                      disabled={page + 1 >= totalPages && !hasNextPage}
                      className="px-3 py-2 text-xs border border-border rounded bg-white text-textSecondary active:bg-gray-50 md:hover:bg-gray-50 active:text-textPrimary md:hover:text-textPrimary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isFetchingNextPage ? 'Loading...' : 'Next'}
                    </button>
                  </div>
                </div>
              )
            }
          />
        </div>
      </div>

      {/* Footer — hidden on mobile */}
      <div className="hidden md:block text-center py-4 bg-bgPrimary">
        <p className="text-xs text-textSecondary">© 2026 Invoice Baba. All rights reserved.</p>
      </div>

      {/* Add / Edit Customer Modal */}
      <CustomerAddEditModal
        isOpen={showAddModal || !!editingCustomer}
        onClose={() => { setShowAddModal(false); setEditingCustomer(null) }}
        customer={editingCustomer}
        onSuccess={() => { setShowAddModal(false); setEditingCustomer(null) }}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Portal>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-textPrimary text-center mb-2">Delete Customer</h3>
            <p className="text-sm text-textSecondary text-center mb-6">
              Are you sure you want to delete <span className="font-semibold text-textPrimary">{deleteTarget.name}</span>?
              This action cannot be undone.
            </p>
            {deleteMutation.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <p className="text-sm text-red-600 text-center">
                  {deleteMutation.error?.response?.data?.error?.message || 'Cannot delete this customer. They may have existing invoices.'}
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteTarget(null); deleteMutation.reset() }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-textSecondary hover:text-textPrimary bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Mobile Action Bottom Sheet */}
      {mobileActionCustomer && (
        <Portal>
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMobileActionCustomer(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl safe-bottom animate-slide-up" onClick={e => e.stopPropagation()}>
            {/* Customer Info Header */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-borderLight">
              <div className={`w-11 h-11 rounded-full ${getAvatarColor(mobileActionCustomer.name).bg} ${getAvatarColor(mobileActionCustomer.name).text} flex items-center justify-center font-bold text-sm shrink-0`}>
                {getInitials(mobileActionCustomer.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-base text-textPrimary truncate">{mobileActionCustomer.name}</div>
                <div className="text-xs text-textSecondary">
                  {mobileActionCustomer.phone ? `+91 ${mobileActionCustomer.phone}` : mobileActionCustomer.email || 'No contact'}
                </div>
              </div>
            </div>
            {/* Actions */}
            <div className="py-2 px-2">
              <button
                onClick={() => { history.push(`/invoices?customerId=${mobileActionCustomer.id}`); setMobileActionCustomer(null) }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-textPrimary active:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FolderOpen className="w-4.5 h-4.5" />
                </div>
                <span>View Documents</span>
              </button>
              <button
                onClick={() => { history.push(`/invoices/new?customerId=${mobileActionCustomer.id}`); setMobileActionCustomer(null) }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-textPrimary active:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <span>Create Invoice</span>
              </button>
              <button
                onClick={() => { handleEdit(mobileActionCustomer); setMobileActionCustomer(null) }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-textPrimary active:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <Pencil className="w-4.5 h-4.5" />
                </div>
                <span>Edit Customer</span>
              </button>
              <button
                onClick={() => { handleDelete(mobileActionCustomer); setMobileActionCustomer(null) }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-red-600 active:bg-red-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4.5 h-4.5" />
                </div>
                <span>Delete Customer</span>
              </button>
            </div>
            {/* Cancel */}
            <div className="px-4 pb-4 pt-1">
              <button
                onClick={() => setMobileActionCustomer(null)}
                className="w-full py-3 text-sm font-semibold text-textSecondary bg-gray-100 active:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <Portal>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              {bulkDeleteMutation.isSuccess ? (
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-500" />
              )}
            </div>
            <h3 className="text-lg font-bold text-textPrimary text-center mb-2">
              {bulkDeleteMutation.isSuccess ? 'Deleted Successfully' : 'Delete Customers'}
            </h3>
            <p className="text-sm text-textSecondary text-center mb-6">
              {bulkDeleteMutation.isSuccess 
                ? `${selectedIds.size} ${selectedIds.size === 1 ? 'customer' : 'customers'} deleted successfully.`
                : (
                  <>
                    Are you sure you want to delete <span className="font-semibold text-textPrimary">{selectedIds.size} selected {selectedIds.size === 1 ? 'customer' : 'customers'}</span>? This action cannot be undone.
                  </>
                )
              }
            </p>
            {bulkDeleteMutation.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <p className="text-sm text-red-600 text-center">
                  {bulkDeleteMutation.error?.response?.data?.error?.message || 'Cannot delete these customers. They may have existing invoices.'}
                </p>
              </div>
            )}
            <div className="flex gap-3">
              {!bulkDeleteMutation.isSuccess ? (
                <>
                  <button
                    onClick={cancelBulkDelete}
                    disabled={bulkDeleteMutation.isPending}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-textSecondary hover:text-textPrimary bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmBulkDelete}
                    disabled={bulkDeleteMutation.isPending}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {bulkDeleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setShowBulkDeleteConfirm(false)
                    bulkDeleteMutation.reset()
                  }}
                  className="w-full px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primaryHover rounded-lg transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Plan Limit Modal */}
      <PlanLimitModal
        isOpen={!!planLimitData}
        onClose={() => setPlanLimitData(null)}
        resourceType={planLimitData?.type || 'customer'}
        usage={planLimitData?.usage}
      />
    </div>
  )
}
