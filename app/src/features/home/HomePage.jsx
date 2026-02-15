import { useHistory } from 'react-router-dom'
import { FileText, Clock, IndianRupee, Plus, ArrowRight, Loader2, Users, Package, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { businessApi } from '../../lib/api'

export default function HomePage() {
  const history = useHistory()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['business', 'stats'],
    queryFn: async () => {
      const response = await businessApi.getStats()
      return response.data.data || response.data
    }
  })

  const { data: businessProfile } = useQuery({
    queryKey: ['business'],
    queryFn: async () => {
      const response = await businessApi.getProfile()
      return response.data?.data || response.data
    },
    staleTime: 1000 * 60 * 5
  })

  const defaultDocType = businessProfile?.defaultDocType || 'invoice'

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  const totalRevenue = (stats?.paidAmount || 0) + (stats?.unpaidAmount || 0)

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-5 md:py-8 space-y-5 md:space-y-6">

      {/* Header — mobile: compact, desktop: full */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-textPrimary">Dashboard</h1>
          <p className="text-xs md:text-sm text-textSecondary mt-0.5 hidden md:block">Overview of your business activity</p>
        </div>
        <button
          onClick={() => history.push(`/invoices/new?type=${defaultDocType}`)}
          className="px-4 md:px-5 py-2.5 bg-primary active:bg-primaryHover md:hover:bg-primaryHover text-white rounded-lg transition-all font-semibold text-sm shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* Revenue Summary — prominent top card */}
          <div className="bg-gradient-to-br from-primary to-blue-700 rounded-2xl p-5 md:p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 opacity-80" />
              <span className="text-xs md:text-sm font-medium opacity-80">Total Revenue</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold tracking-tight mb-4 md:mb-5">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="flex gap-4 md:gap-6">
              <div className="flex-1 bg-white/15 rounded-xl px-3 py-2.5 md:px-4 md:py-3">
                <div className="text-lg md:text-xl font-bold">{formatCurrency(stats?.paidAmount)}</div>
                <div className="text-[11px] md:text-xs opacity-75 mt-0.5">Collected ({stats?.paidCount || 0})</div>
              </div>
              <div className="flex-1 bg-white/15 rounded-xl px-3 py-2.5 md:px-4 md:py-3">
                <div className="text-lg md:text-xl font-bold text-yellow-200">{formatCurrency(stats?.unpaidAmount)}</div>
                <div className="text-[11px] md:text-xs opacity-75 mt-0.5">Outstanding ({stats?.unpaidCount || 0})</div>
              </div>
            </div>
          </div>

          {/* Stat Cards — 3 compact cards */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="bg-white rounded-xl border border-border p-3.5 md:p-5 shadow-card text-center">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-blue-50 flex items-center justify-center mx-auto mb-2 md:mb-3">
                <FileText className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div className="text-lg md:text-2xl font-bold text-textPrimary">{stats?.totalInvoices || 0}</div>
              <p className="text-[10px] md:text-xs text-textSecondary mt-0.5">Total Invoices</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-3.5 md:p-5 shadow-card text-center">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-amber-50 flex items-center justify-center mx-auto mb-2 md:mb-3">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
              </div>
              <div className="text-lg md:text-2xl font-bold text-textPrimary">{stats?.draftCount || 0}</div>
              <p className="text-[10px] md:text-xs text-textSecondary mt-0.5">Drafts</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-3.5 md:p-5 shadow-card text-center">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-green-50 flex items-center justify-center mx-auto mb-2 md:mb-3">
                <IndianRupee className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
              </div>
              <div className="text-lg md:text-2xl font-bold text-green-600">{stats?.paidCount || 0}</div>
              <p className="text-[10px] md:text-xs text-textSecondary mt-0.5">Paid</p>
            </div>
          </div>

          {/* Outstanding Alert — only show if there's unpaid amount */}
          {(stats?.unpaidAmount || 0) > 0 && (
            <button
              onClick={() => history.push('/invoices')}
              className="w-full flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 md:py-4 active:bg-amber-100 md:hover:bg-amber-100 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4.5 h-4.5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800">
                  {stats?.unpaidCount || 0} unpaid invoice{(stats?.unpaidCount || 0) !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  {formatCurrency(stats?.unpaidAmount)} outstanding
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />
            </button>
          )}

          {/* Quick Actions */}
          <div>
            <h2 className="text-sm font-semibold text-textSecondary uppercase tracking-wider mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
              <button
                onClick={() => history.push('/invoices')}
                className="flex items-center gap-3 bg-white border border-border rounded-xl px-4 py-3.5 active:bg-gray-50 md:hover:bg-gray-50 md:hover:border-primary/30 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 group-active:bg-blue-100 md:group-hover:bg-blue-100 transition-colors">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-textPrimary">Invoices</span>
              </button>
              <button
                onClick={() => history.push('/customers')}
                className="flex items-center gap-3 bg-white border border-border rounded-xl px-4 py-3.5 active:bg-gray-50 md:hover:bg-gray-50 md:hover:border-primary/30 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 group-active:bg-purple-100 md:group-hover:bg-purple-100 transition-colors">
                  <Users className="w-4 h-4 text-purple-500" />
                </div>
                <span className="text-sm font-medium text-textPrimary">Customers</span>
              </button>
              <button
                onClick={() => history.push('/products')}
                className="flex items-center gap-3 bg-white border border-border rounded-xl px-4 py-3.5 active:bg-gray-50 md:hover:bg-gray-50 md:hover:border-primary/30 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0 group-active:bg-green-100 md:group-hover:bg-green-100 transition-colors">
                  <Package className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-sm font-medium text-textPrimary">Products</span>
              </button>
              <button
                onClick={() => history.push('/reports')}
                className="flex items-center gap-3 bg-white border border-border rounded-xl px-4 py-3.5 active:bg-gray-50 md:hover:bg-gray-50 md:hover:border-primary/30 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 group-active:bg-orange-100 md:group-hover:bg-orange-100 transition-colors">
                  <BarChart3 className="w-4 h-4 text-orange-500" />
                </div>
                <span className="text-sm font-medium text-textPrimary">Reports</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
