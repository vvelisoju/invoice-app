import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useHistory } from 'react-router-dom'
import { adminApi } from '../../lib/api'
import {
  Search, Building2, ChevronRight, ChevronDown, ChevronUp,
  Ban, CheckCircle, AlertTriangle, ExternalLink, FileText,
  Users as UsersIcon, Package, CreditCard, Calendar, Filter,
  ArrowUpDown, X, Shield
} from 'lucide-react'

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'BANNED', label: 'Banned' },
]

const GST_OPTIONS = [
  { value: '', label: 'All GST' },
  { value: 'true', label: 'GST Enabled' },
  { value: 'false', label: 'GST Disabled' },
]

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Newest First' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'invoices', label: 'Most Invoices' },
  { value: 'customers', label: 'Most Customers' },
]

const STATUS_BADGE = {
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-yellow-100 text-yellow-700',
  BANNED: 'bg-red-100 text-red-700',
}

const SUB_STATUS_BADGE = {
  ACTIVE: 'text-green-600',
  EXPIRED: 'text-red-500',
  CANCELLED: 'text-gray-400',
}

export default function AdminBusinessListPage() {
  const history = useHistory()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [gstEnabled, setGstEnabled] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(0)
  const limit = 20

  // Fetch plans for filter dropdown
  const { data: plansData } = useQuery({
    queryKey: ['admin', 'plans-list'],
    queryFn: () => adminApi.listPlans().then(r => r.data?.data || r.data),
    staleTime: 60000
  })
  const plans = Array.isArray(plansData) ? plansData : plansData?.plans || []
  const [planId, setPlanId] = useState('')

  const activeFilterCount = [status, gstEnabled, planId, createdFrom].filter(Boolean).length

  const queryParams = {
    search: search || undefined,
    status: status || undefined,
    planId: planId || undefined,
    gstEnabled: gstEnabled || undefined,
    createdFrom: createdFrom || undefined,
    createdTo: createdTo || undefined,
    sortBy,
    sortOrder,
    limit,
    offset: page * limit
  }

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'businesses', queryParams],
    queryFn: () => adminApi.listBusinesses(queryParams).then(r => r.data.data),
    keepPreviousData: true
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => adminApi.updateBusinessStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries(['admin', 'businesses'])
  })

  const impersonateMutation = useMutation({
    mutationFn: (bizId) => adminApi.impersonateBusiness(bizId),
    onSuccess: (res) => {
      const { token } = res.data.data
      window.open(`${window.location.origin}/home?impersonate_token=${token}`, '_blank')
    }
  })

  const businesses = data?.businesses || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / limit)

  const clearFilters = () => {
    setStatus(''); setGstEnabled(''); setPlanId(''); setCreatedFrom(''); setCreatedTo('')
    setPage(0)
  }

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(o => o === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setPage(0)
  }

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
  const INR = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Businesses</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total businesses</p>
        </div>
      </div>

      {/* Search + Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, phone, email, GSTIN, owner..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
            showFilters || activeFilterCount > 0
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-medium mb-1 block">Status</label>
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }}
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-medium mb-1 block">Plan</label>
              <select value={planId} onChange={(e) => { setPlanId(e.target.value); setPage(0) }}
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Plans</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.displayName || p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-medium mb-1 block">GST</label>
              <select value={gstEnabled} onChange={(e) => { setGstEnabled(e.target.value); setPage(0) }}
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {GST_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-medium mb-1 block">Sort By</label>
              <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(0) }}
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-medium mb-1 block">Created From</label>
              <input type="date" value={createdFrom} onChange={(e) => { setCreatedFrom(e.target.value); setPage(0) }}
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-medium mb-1 block">Created To</label>
              <input type="date" value={createdTo} onChange={(e) => { setCreatedTo(e.target.value); setPage(0) }}
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
              <X className="w-3 h-3" /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* List */}
      {isLoading && !data ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">No businesses found</p>
          <p className="text-xs mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {businesses.map((biz) => (
            <div
              key={biz.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition-all"
            >
              {/* Top row: name, status, actions */}
              <div className="flex items-start justify-between gap-3">
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => history.push(`/admin/businesses/${biz.id}`)}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{biz.name}</h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_BADGE[biz.status] || 'bg-gray-100 text-gray-600'}`}>
                      {biz.status}
                    </span>
                    {biz.gstEnabled && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600">GST</span>
                    )}
                  </div>

                  {/* Owner row */}
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
                    <span className="font-medium">{biz.owner?.name || 'Unnamed'}</span>
                    <span className="text-gray-300">·</span>
                    <span>{biz.owner?.phone}</span>
                    {biz.owner?.email && (
                      <>
                        <span className="text-gray-300 hidden sm:inline">·</span>
                        <span className="hidden sm:inline text-gray-400">{biz.owner.email}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {biz.status === 'ACTIVE' && (
                    <button
                      onClick={() => statusMutation.mutate({ id: biz.id, status: 'SUSPENDED' })}
                      className="p-1.5 text-yellow-500 hover:bg-yellow-50 rounded-lg" title="Suspend"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {biz.status === 'SUSPENDED' && (
                    <>
                      <button
                        onClick={() => statusMutation.mutate({ id: biz.id, status: 'ACTIVE' })}
                        className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg" title="Activate"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => statusMutation.mutate({ id: biz.id, status: 'BANNED' })}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Ban"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  {biz.status === 'BANNED' && (
                    <button
                      onClick={() => statusMutation.mutate({ id: biz.id, status: 'ACTIVE' })}
                      className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg" title="Reactivate"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => impersonateMutation.mutate(biz.id)}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="View as User"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => history.push(`/admin/businesses/${biz.id}`)}
                    className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                  <CreditCard className="w-3 h-3 text-gray-400" />
                  {biz.plan?.displayName || 'Free'}
                  {biz.subscription?.status && (
                    <span className={`font-medium ${SUB_STATUS_BADGE[biz.subscription.status] || 'text-gray-400'}`}>
                      · {biz.subscription.status}
                    </span>
                  )}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                  <FileText className="w-3 h-3 text-gray-400" />
                  {biz._count?.invoices || 0} invoices
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                  <UsersIcon className="w-3 h-3 text-gray-400" />
                  {biz._count?.customers || 0} customers
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                  <Package className="w-3 h-3 text-gray-400" />
                  {biz._count?.products || 0} products
                </span>
                {biz.gstin && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-2 py-1 rounded-md font-mono">
                    <Shield className="w-3 h-3 text-gray-400" />
                    {biz.gstin}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 ml-auto">
                  <Calendar className="w-3 h-3" />
                  {fmtDate(biz.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">
            Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(0)}
              disabled={page === 0}
              className="px-2 py-1.5 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              First
            </button>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-xs text-gray-500 px-2">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
              className="px-2 py-1.5 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
