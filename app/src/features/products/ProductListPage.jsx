import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { Plus, Search, Package, Pencil, Trash2, FileText, AlertTriangle, Loader2, Download, X, SlidersHorizontal, RotateCcw } from 'lucide-react'
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productApi } from '../../lib/api'
import {
  DataTable,
  StatusFilterPills,
  PageToolbar
} from '../../components/data-table'
import ProductAddEditModal from './ProductAddEditModal'
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
  { key: 'all', label: 'All Products' },
  { key: 'active', label: 'Active', badgeColor: 'bg-green-500' },
  { key: 'deleted', label: 'Deleted', badgeColor: 'bg-red-400' },
]

const TABLE_COLUMNS = [
  { key: 'name', label: 'Product / Service', colSpan: 4 },
  { key: 'taxRate', label: 'Tax Rate', colSpan: 2 },
  { key: 'rate', label: 'Default Rate', colSpan: 2, headerAlign: 'right', align: 'right' },
  { key: 'actions', label: 'Actions', colSpan: 3, headerAlign: 'center', align: 'center' },
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

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0)
}

export default function ProductListPage() {
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
      history.replace('/products')
    }
  }, [location.search])

  // When pill filter changes, update URL
  const handleFilterChange = useCallback((key) => {
    setStatusFilter(key)
    if (key === 'all') {
      history.replace('/products')
    } else {
      history.replace(`/products?filter=${key}`)
    }
  }, [history])

  const [searchQuery, setSearchQuery] = useState('')
  const searchTimeout = useRef(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [mobileActionProduct, setMobileActionProduct] = useState(null)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState(new Set())

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
    queryKey: ['products', debouncedSearch],
    queryFn: async ({ pageParam = 0 }) => {
      const params = {
        limit: PAGE_SIZE,
        offset: pageParam,
        ...(debouncedSearch && { search: debouncedSearch })
      }
      const response = await productApi.list(params)
      return response.data
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((sum, p) => sum + (p.products?.length || 0), 0)
      if (lastPage.products?.length < PAGE_SIZE) return undefined
      return totalFetched
    },
    initialPageParam: 0
  })

  const allProducts = data?.pages.flatMap(p => p.products || []) || []
  const totalCount = data?.pages[0]?.total || 0

  // Fetch deleted products
  const { data: deletedProductsData } = useQuery({
    queryKey: ['products', 'deleted'],
    queryFn: async () => {
      const response = await productApi.listDeleted()
      return response.data || []
    }
  })
  const deletedProducts = deletedProductsData || []

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: (id) => productApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })

  // Client-side filtering based on statusFilter
  const products = useMemo(() => {
    switch (statusFilter) {
      case 'active':
        return allProducts.filter(p => p.defaultRate != null && Number(p.defaultRate) > 0)
      case 'deleted':
        return deletedProducts
      default:
        return allProducts
    }
  }, [allProducts, deletedProducts, statusFilter])

  // Compute counts for filter pills
  const counts = useMemo(() => {
    const c = { all: allProducts.length, active: 0, deleted: deletedProducts.length }
    allProducts.forEach((p) => {
      if (p.defaultRate != null && Number(p.defaultRate) > 0) c.active++
    })
    return c
  }, [allProducts, deletedProducts])

  const filtersWithCounts = STATUS_FILTERS.map((f) => ({ ...f, count: counts[f.key] ?? 0 }))

  // Pagination over filtered list
  const paginatedProducts = useMemo(() => {
    const start = page * PAGE_SIZE
    return products.slice(start, start + PAGE_SIZE)
  }, [products, page])

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE))

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => productApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setDeleteTarget(null)
    }
  })

  const handleEdit = useCallback((product) => {
    setEditingProduct(product)
  }, [])

  const handleDelete = useCallback((product) => {
    setDeleteTarget(product)
  }, [])

  const confirmDelete = () => {
    if (!deleteTarget) return
    if (deleteTarget._bulkIds) {
      // Bulk delete: delete one by one
      deleteTarget._bulkIds.forEach(id => deleteMutation.mutate(id))
      setSelectedIds(new Set())
    } else {
      deleteMutation.mutate(deleteTarget.id)
    }
  }

  const renderRow = (product) => {
    const initials = getInitials(product.name)
    const color = getAvatarColor(product.name)

    return [
      // Product Name + Avatar + HSN
      <div key="name" className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg ${color.bg} ${color.text} flex items-center justify-center font-bold text-xs shrink-0`}>
          {initials}
        </div>
        <div>
          <div className="font-semibold text-textPrimary">{product.name}</div>
          <div className="text-xs text-textSecondary line-clamp-1">
            {product.hsnCode ? `HSN: ${product.hsnCode}` : 'No HSN'}{product.description ? ` · ${product.description}` : ''}
          </div>
        </div>
      </div>,

      // Tax Rate
      <span key="taxRate" className="text-textSecondary">
        {product.taxRate != null && Number(product.taxRate) > 0 ? `${Number(product.taxRate)}%` : '--'}
      </span>,

      // Default Rate
      <div key="rate" className="text-right">
        {product.defaultRate ? (
          <span className="font-semibold text-textPrimary">{formatCurrency(product.defaultRate)}</span>
        ) : (
          <span className="font-medium text-textSecondary">--</span>
        )}
      </div>,

      // Actions
      statusFilter === 'deleted' ? (
        <div key="actions" className="flex justify-center">
          <button
            onClick={(e) => { e.stopPropagation(); restoreMutation.mutate(product.id) }}
            disabled={restoreMutation.isPending}
            className="px-2.5 py-1 rounded-md text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 flex items-center gap-1 transition-colors disabled:opacity-50"
            title="Restore Product"
          >
            <RotateCcw className="w-3 h-3" />
            Restore
          </button>
        </div>
      ) : (
        <div key="actions" className="flex justify-center gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); history.push('/invoices/new') }}
            className="w-7 h-7 rounded hover:bg-blue-50 text-textSecondary hover:text-primary flex items-center justify-center transition-colors"
            title="Create Invoice"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(product) }}
            className="w-7 h-7 rounded hover:bg-blue-50 text-textSecondary hover:text-primary flex items-center justify-center transition-colors"
            title="Edit Product"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(product) }}
            className="w-7 h-7 rounded hover:bg-red-50 text-textSecondary hover:text-red-500 flex items-center justify-center transition-colors"
            title="Delete Product"
          >
            <Trash2 className="w-4 h-4" />
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
        title="Products & Services"
        subtitle="Manage your product catalog and service offerings"
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
              className="w-10 h-10 flex items-center justify-center text-white bg-[#2563eb] active:bg-[#1d4ed8] rounded-lg shadow-sm"
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
                placeholder="Search products..."
                className="pl-9 pr-4 py-2.5 text-sm border border-border rounded-lg w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Product
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
                placeholder="Search products..."
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
      <div className="flex-1 px-3 md:px-8 py-4 md:py-6 pb-mobile-nav overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Bulk Action Bar */}
          {selectedIds.size > 0 && (
            <div className="mb-3 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
              <span className="text-sm font-semibold text-primary">{selectedIds.size} selected</span>
              <div className="w-px h-5 bg-blue-200" />
              <button
                onClick={() => {
                  const selected = products.filter(p => selectedIds.has(p.id))
                  const headers = ['Name', 'Default Rate', 'Tax Rate']
                  const rows = selected.map(p => [
                    `"${(p.name || '').replace(/"/g, '""')}"`,
                    p.defaultRate != null ? Number(p.defaultRate).toFixed(2) : '',
                    p.taxRate != null ? `${Number(p.taxRate)}%` : '',
                  ])
                  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
                  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url; a.download = `products_${Date.now()}.csv`
                  document.body.appendChild(a); a.click(); document.body.removeChild(a)
                  URL.revokeObjectURL(url)
                }}
                className="text-xs font-medium text-primary hover:text-primaryHover flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
              <button
                onClick={() => {
                  const ids = Array.from(selectedIds)
                  if (ids.length === 1) {
                    const p = products.find(pr => pr.id === ids[0])
                    if (p) setDeleteTarget(p)
                  } else {
                    setDeleteTarget({ id: '__bulk__', name: `${ids.length} products`, _bulkIds: ids })
                  }
                }}
                className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
              <div className="flex-1" />
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-textSecondary hover:text-textPrimary flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            </div>
          )}

          <DataTable
            columns={TABLE_COLUMNS}
            rows={paginatedProducts}
            rowKey={(p) => p.id}
            renderRow={renderRow}
            onRowClick={(p) => handleEdit(p)}
            onMobileRowClick={(p) => setMobileActionProduct(p)}
            getRowClassName={() => ''}
            selectable={true}
            onSelectionChange={setSelectedIds}
            isLoading={isLoading}
            emptyIcon={<Package className="w-16 h-16 text-gray-300 mb-4" />}
            emptyTitle={statusFilter !== 'all' ? 'No products match this filter' : 'No products yet'}
            emptyMessage={statusFilter !== 'all' ? 'Try a different filter or add new products' : 'Add your first product or service to get started'}
            renderMobileCard={(product) => {
              const initials = getInitials(product.name)
              const color = getAvatarColor(product.name)
              return (
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${color.bg} ${color.text} flex items-center justify-center font-bold text-xs shrink-0`}>
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-textPrimary truncate">{product.name}</div>
                    <div className="text-xs text-textSecondary">
                      {product.hsnCode ? `HSN: ${product.hsnCode}` : 'No HSN'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {product.defaultRate ? (
                      <span className="font-semibold text-sm text-textPrimary">{formatCurrency(product.defaultRate)}</span>
                    ) : (
                      <span className="font-medium text-xs text-textSecondary">--</span>
                    )}
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
              products.length > 0 && (
                <div className="border-t border-border bg-gray-50 px-6 py-3 flex items-center justify-between">
                  <div className="text-xs text-textSecondary">
                    Showing <span className="font-medium text-textPrimary">{page * PAGE_SIZE + 1}</span> to{' '}
                    <span className="font-medium text-textPrimary">{Math.min((page + 1) * PAGE_SIZE, products.length)}</span> of{' '}
                    <span className="font-medium text-textPrimary">{products.length}</span> products
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

      {/* Add / Edit Product Modal */}
      <ProductAddEditModal
        isOpen={showAddModal || !!editingProduct}
        onClose={() => { setShowAddModal(false); setEditingProduct(null) }}
        product={editingProduct}
        onSuccess={() => { setShowAddModal(false); setEditingProduct(null) }}
      />

      {/* Mobile Action Bottom Sheet */}
      {mobileActionProduct && (
        <Portal>
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMobileActionProduct(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl safe-bottom animate-slide-up" onClick={e => e.stopPropagation()}>
            {/* Product Info Header */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-borderLight">
              <div className={`w-11 h-11 rounded-lg ${getAvatarColor(mobileActionProduct.name).bg} ${getAvatarColor(mobileActionProduct.name).text} flex items-center justify-center font-bold text-sm shrink-0`}>
                {getInitials(mobileActionProduct.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-base text-textPrimary truncate">{mobileActionProduct.name}</div>
                <div className="text-xs text-textSecondary">
                  {mobileActionProduct.defaultRate ? formatCurrency(mobileActionProduct.defaultRate) : 'No rate'}
                  {mobileActionProduct.hsnCode ? ` · HSN: ${mobileActionProduct.hsnCode}` : ''}
                </div>
              </div>
            </div>
            {/* Actions */}
            <div className="py-2 px-2">
              <button
                onClick={() => { history.push('/invoices/new'); setMobileActionProduct(null) }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-textPrimary active:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <span>Create Invoice</span>
              </button>
              <button
                onClick={() => { handleEdit(mobileActionProduct); setMobileActionProduct(null) }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-textPrimary active:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <Pencil className="w-4.5 h-4.5" />
                </div>
                <span>Edit Product</span>
              </button>
              <button
                onClick={() => { handleDelete(mobileActionProduct); setMobileActionProduct(null) }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-red-600 active:bg-red-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4.5 h-4.5" />
                </div>
                <span>Delete Product</span>
              </button>
            </div>
            {/* Cancel */}
            <div className="px-4 pb-4 pt-1">
              <button
                onClick={() => setMobileActionProduct(null)}
                className="w-full py-3 text-sm font-semibold text-textSecondary bg-gray-100 active:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Portal>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-textPrimary text-center mb-2">Delete Product</h3>
            <p className="text-sm text-textSecondary text-center mb-6">
              Are you sure you want to delete <span className="font-semibold text-textPrimary">{deleteTarget.name}</span>?
              This action cannot be undone.
            </p>
            {deleteMutation.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <p className="text-sm text-red-600 text-center">
                  {deleteMutation.error?.response?.data?.error?.message || 'Cannot delete this product. It may be used in existing invoices.'}
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
    </div>
  )
}
