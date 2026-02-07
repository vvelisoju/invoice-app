import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { Plus, Search, Users, FileText, Pencil, Trash2, AlertTriangle, Loader2, SlidersHorizontal } from 'lucide-react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customerApi } from '../../lib/api'
import {
  DataTable,
  StatusFilterPills,
  PageToolbar
} from '../../components/data-table'
import CustomerAddEditModal from './CustomerAddEditModal'

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
  { key: 'active', label: 'Active Customers' },
  { key: 'outstanding', label: 'Outstanding Balance', badgeColor: 'bg-accentOrange' },
  { key: 'inactive', label: 'Inactive', badgeColor: 'bg-gray-400' },
  { key: 'favorites', label: 'Favorites', badgeColor: 'bg-yellow-400' },
]

const TABLE_COLUMNS = [
  { key: 'name', label: 'Customer Name', colSpan: 3 },
  { key: 'contact', label: 'Contact Person', colSpan: 2 },
  { key: 'emailPhone', label: 'Email / Phone', colSpan: 2 },
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
  const urlFilter = new URLSearchParams(location.search).get('filter') || 'active'
  const [statusFilter, setStatusFilter] = useState(urlFilter)

  // Sync status filter with URL changes (sidebar clicks)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const f = params.get('filter')
    if (f && f !== statusFilter) setStatusFilter(f)
    else if (!f && statusFilter !== 'active') setStatusFilter('active')

    // Auto-open add modal when ?action=add is in URL
    if (params.get('action') === 'add') {
      setShowAddModal(true)
      history.replace('/customers')
    }
  }, [location.search])

  // When pill filter changes, update URL
  const handleFilterChange = useCallback((key) => {
    setStatusFilter(key)
    if (key === 'active') {
      history.replace('/customers')
    } else {
      history.replace(`/customers?filter=${key}`)
    }
  }, [history])

  const [searchQuery, setSearchQuery] = useState('')
  const searchTimeout = useRef(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

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

  // Client-side filtering based on statusFilter
  const customers = useMemo(() => {
    switch (statusFilter) {
      case 'outstanding':
        return allCustomers.filter(c => computeBalance(c) > 0)
      case 'inactive':
        // Customers with no invoices at all
        return allCustomers.filter(c => !c.invoices || c.invoices.length === 0)
      case 'favorites':
        // Placeholder — no favorite flag in schema, show none
        return []
      default:
        return allCustomers
    }
  }, [allCustomers, statusFilter])

  // Compute counts for filter pills
  const counts = useMemo(() => {
    const c = { active: allCustomers.length, outstanding: 0, inactive: 0, favorites: 0 }
    allCustomers.forEach((cust) => {
      const balance = computeBalance(cust)
      if (balance > 0) c.outstanding++
      if (!cust.invoices || cust.invoices.length === 0) c.inactive++
    })
    return c
  }, [allCustomers])

  const filtersWithCounts = STATUS_FILTERS.map((f) => ({ ...f, count: counts[f.key] ?? 0 }))

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

      // Contact Person
      <span key="contact" className="text-textSecondary">{customer.name?.split(' ')[0] || '--'}</span>,

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
      <div key="actions" className="flex justify-center gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); history.push(`/invoices/new?customerId=${customer.id}`) }}
          className="w-7 h-7 rounded hover:bg-blue-50 text-textSecondary hover:text-primary flex items-center justify-center transition-colors"
          title="Create Invoice"
        >
          <FileText className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleEdit(customer) }}
          className="w-7 h-7 rounded hover:bg-blue-50 text-textSecondary hover:text-primary flex items-center justify-center transition-colors"
          title="Edit Customer"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(customer) }}
          className="w-7 h-7 rounded hover:bg-red-50 text-textSecondary hover:text-red-500 flex items-center justify-center transition-colors"
          title="Delete Customer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>,
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
              onClick={() => setShowAddModal(true)}
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
              onClick={() => setShowAddModal(true)}
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
              filters={filtersWithCounts}
              activeKey={statusFilter}
              onChange={handleFilterChange}
            />
          </div>
        )}
        {/* Desktop: always visible */}
        <div className="hidden md:block">
          <StatusFilterPills
            filters={filtersWithCounts}
            activeKey={statusFilter}
            onChange={handleFilterChange}
          />
        </div>
      </PageToolbar>

      {/* Table */}
      <div className="flex-1 px-3 md:px-8 py-4 md:py-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <DataTable
            columns={TABLE_COLUMNS}
            rows={paginatedCustomers}
            rowKey={(c) => c.id}
            renderRow={renderRow}
            onRowClick={(c) => handleEdit(c)}
            getRowClassName={() => ''}
            selectable={true}
            isLoading={isLoading}
            emptyIcon={<Users className="w-16 h-16 text-gray-300 mb-4" />}
            emptyTitle={statusFilter !== 'active' ? 'No customers match this filter' : 'No customers yet'}
            emptyMessage={statusFilter !== 'active' ? 'Try a different filter or add new customers' : 'Add your first customer to get started'}
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
                  <div className="text-right shrink-0">
                    {balance > 0 ? (
                      <span className="font-bold text-sm text-accentOrange">{formatCurrency(balance)}</span>
                    ) : (
                      <span className="font-medium text-xs text-textSecondary">{formatCurrency(0)}</span>
                    )}
                  </div>
                </div>
              )
            }}
            loadMore={statusFilter === 'active' ? {
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
        <p className="text-xs text-textSecondary">© 2026 InvoiceApp. All rights reserved.</p>
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
      )}
    </div>
  )
}
