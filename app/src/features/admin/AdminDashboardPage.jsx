import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useHistory } from 'react-router-dom'
import { adminApi } from '../../lib/api'
import {
  Users, Building2, FileText, TrendingUp,
  Activity, DollarSign, ArrowUpRight, ArrowDownRight,
  Package, UserCheck, Calendar, BarChart3, Crown,
  Zap, Eye, ShoppingBag, CalendarDays
} from 'lucide-react'

// ── Date presets ─────────────────────────────────────────────────────────
function getPresetRange(key) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const fmt = (d) => d.toISOString().split('T')[0]

  switch (key) {
    case 'today':
      return { from: fmt(today), to: fmt(today) }
    case 'yesterday': {
      const y = new Date(today); y.setDate(y.getDate() - 1)
      return { from: fmt(y), to: fmt(y) }
    }
    case 'this_week': {
      const s = new Date(today); s.setDate(s.getDate() - s.getDay())
      return { from: fmt(s), to: fmt(today) }
    }
    case 'last_week': {
      const s = new Date(today); s.setDate(s.getDate() - s.getDay() - 7)
      const e = new Date(s); e.setDate(e.getDate() + 6)
      return { from: fmt(s), to: fmt(e) }
    }
    case 'this_month':
      return { from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), to: fmt(today) }
    case 'last_month': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const e = new Date(now.getFullYear(), now.getMonth(), 0)
      return { from: fmt(s), to: fmt(e) }
    }
    case 'last_90': {
      const s = new Date(today); s.setDate(s.getDate() - 89)
      return { from: fmt(s), to: fmt(today) }
    }
    default:
      return { from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), to: fmt(today) }
  }
}

const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'this_week', label: 'This Week' },
  { key: 'last_week', label: 'Last Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'last_90', label: 'Last 90 Days' },
  { key: 'custom', label: 'Custom' },
]

// ── Reusable components ──────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, trend, trendLabel, color = 'blue', sub }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    pink: 'bg-pink-50 text-pink-600',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide truncate">{label}</p>
          <p className="text-xl md:text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-1 text-[11px] font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend)}% {trendLabel || 'vs prev period'}
            </div>
          )}
          {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2 rounded-lg flex-shrink-0 ${colorMap[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children, icon: Icon }) {
  return (
    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      {children}
    </h3>
  )
}

function BarBreakdown({ items, colorMap }) {
  const total = items.reduce((s, i) => s + i.count, 0) || 1
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${colorMap?.[item.label] || 'bg-gray-400'}`} />
              {item.label}
            </span>
            <span className="font-medium text-gray-900">{item.count} <span className="text-gray-400 font-normal">({Math.round((item.count / total) * 100)}%)</span></span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${colorMap?.[item.label] || 'bg-gray-400'}`}
              style={{ width: `${Math.max((item.count / total) * 100, 1)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function MiniTrendChart({ data, label, color = '#3B82F6' }) {
  if (!data || data.length === 0) return <p className="text-xs text-gray-400 py-4 text-center">No data for this period</p>
  const max = Math.max(...data.map(d => d.count), 1)
  const barW = Math.max(100 / data.length - 1, 2)

  return (
    <div>
      <div className="flex items-end gap-px h-24 mt-2">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 min-w-0 rounded-t group relative"
            style={{ height: `${Math.max((d.count / max) * 100, 4)}%`, backgroundColor: color, opacity: 0.8 }}
            title={`${new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}: ${d.count}`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-gray-400">
          {data.length > 0 && new Date(data[0].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
        <span className="text-[9px] text-gray-400">
          {data.length > 1 && new Date(data[data.length - 1].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </div>
  )
}

const INR = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

// ── Main page ────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const history = useHistory()
  const [activePreset, setActivePreset] = useState('this_month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const dateParams = useMemo(() => {
    if (activePreset === 'custom' && customFrom && customTo) {
      return { from: customFrom, to: customTo }
    }
    if (activePreset !== 'custom') {
      return getPresetRange(activePreset)
    }
    return getPresetRange('this_month')
  }, [activePreset, customFrom, customTo])

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'dashboard', dateParams],
    queryFn: () => adminApi.getDashboardStats(dateParams).then(r => r.data.data),
    keepPreviousData: true
  })

  if (isLoading && !data) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-10 bg-gray-200 rounded w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
          Failed to load dashboard: {error.message}
        </div>
      </div>
    )
  }

  const { overview, live, rangeStats, revenue, planBreakdown, businessStatusBreakdown,
    userStatusBreakdown, invoiceStatusBreakdown, trends, topBusinesses, recentSignups } = data

  const presetLabel = PRESETS.find(p => p.key === activePreset)?.label || 'This Month'

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">Platform overview · {presetLabel}</p>
        </div>
        {isLoading && <span className="text-[10px] text-blue-500 animate-pulse">Refreshing…</span>}
      </div>

      {/* ── Date Filter Pills ─────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {PRESETS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActivePreset(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                activePreset === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activePreset === 'custom' && (
          <div className="flex flex-col sm:flex-row gap-2 bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs text-gray-500 w-10">From</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs text-gray-500 w-10">To</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── All-time Overview ─────────────────────────────────────────────── */}
      <div>
        <SectionTitle icon={BarChart3}>All-time Overview</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-2">
          <StatCard label="Total Users" value={overview.totalUsers} icon={Users} color="blue" />
          <StatCard label="Businesses" value={overview.totalBusinesses} icon={Building2} color="purple" />
          <StatCard label="Invoices" value={overview.totalInvoices} icon={FileText} color="green" />
          <StatCard label="Customers" value={overview.totalCustomers} icon={UserCheck} color="cyan" />
          <StatCard label="Products" value={overview.totalProducts} icon={Package} color="orange" />
        </div>
      </div>

      {/* ── Filtered Period Stats ─────────────────────────────────────────── */}
      <div>
        <SectionTitle icon={CalendarDays}>{presetLabel} — Growth</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
          <StatCard
            label="New Users"
            value={rangeStats.users.count}
            icon={Users}
            trend={rangeStats.users.growth}
            sub={`prev: ${rangeStats.users.prev}`}
            color="blue"
          />
          <StatCard
            label="New Businesses"
            value={rangeStats.businesses.count}
            icon={Building2}
            trend={rangeStats.businesses.growth}
            sub={`prev: ${rangeStats.businesses.prev}`}
            color="purple"
          />
          <StatCard
            label="Invoices Created"
            value={rangeStats.invoices.count}
            icon={FileText}
            trend={rangeStats.invoices.growth}
            sub={`prev: ${rangeStats.invoices.prev}`}
            color="green"
          />
          <StatCard
            label="Invoice Revenue"
            value={INR(rangeStats.invoiceRevenue.total)}
            icon={DollarSign}
            trend={rangeStats.invoiceRevenue.growth}
            sub={`avg: ${INR(rangeStats.invoiceRevenue.avg)}`}
            color="orange"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <StatCard label="New Customers" value={rangeStats.customers.count} icon={UserCheck} color="cyan" />
          <StatCard label="New Products" value={rangeStats.products.count} icon={Package} color="pink" />
          <StatCard label="Max Invoice" value={INR(rangeStats.invoiceRevenue.max)} icon={Crown} color="orange" />
          <StatCard label="Active MRR" value={INR(revenue.mrr)} icon={DollarSign} sub={`${revenue.activeSubscriptions} subs`} color="green" />
        </div>
      </div>

      {/* ── Live Quick Stats ──────────────────────────────────────────────── */}
      <div>
        <SectionTitle icon={Zap}>Live — Right Now</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
          <StatCard label="Users Today" value={live.newUsersToday} icon={TrendingUp} color="green" />
          <StatCard label="Users This Week" value={live.newUsersThisWeek} icon={Activity} color="blue" />
          <StatCard label="Users This Month" value={live.newUsersThisMonth} icon={Users} color="purple" />
          <StatCard label="Invoices Today" value={live.invoicesToday} icon={FileText} color="orange" />
        </div>
      </div>

      {/* ── Daily Trends ──────────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">User Signups Trend</h3>
          <p className="text-[10px] text-gray-400 mb-1">{presetLabel} · daily</p>
          <MiniTrendChart data={trends.users} color="#3B82F6" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Invoices Created Trend</h3>
          <p className="text-[10px] text-gray-400 mb-1">{presetLabel} · daily</p>
          <MiniTrendChart data={trends.invoices} color="#10B981" />
        </div>
      </div>

      {/* ── Breakdowns ────────────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Plan Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Plan Distribution</h3>
          <BarBreakdown
            items={planBreakdown.map(p => ({ label: p.planName, count: p.count }))}
            colorMap={{ 'Free': 'bg-gray-400', 'Starter': 'bg-blue-500', 'Pro': 'bg-purple-500', 'No Plan': 'bg-gray-300' }}
          />
        </div>

        {/* Business Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Business Health</h3>
          <BarBreakdown
            items={[
              ...businessStatusBreakdown.map(b => ({ label: b.status, count: b.count })),
              { label: 'Active (30d)', count: overview.activeBusinesses },
              { label: 'Dormant', count: overview.dormantBusinesses }
            ]}
            colorMap={{ 'ACTIVE': 'bg-green-500', 'SUSPENDED': 'bg-yellow-500', 'BANNED': 'bg-red-500', 'Active (30d)': 'bg-emerald-400', 'Dormant': 'bg-gray-300' }}
          />
        </div>

        {/* Invoice Status in Range */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Invoice Status ({presetLabel})</h3>
          {invoiceStatusBreakdown.length > 0 ? (
            <div className="space-y-2.5">
              {invoiceStatusBreakdown.map((inv) => (
                <div key={inv.status} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <span className={`w-2 h-2 rounded-full ${
                      inv.status === 'PAID' ? 'bg-green-500' :
                      inv.status === 'ISSUED' ? 'bg-blue-500' :
                      inv.status === 'DRAFT' ? 'bg-gray-400' :
                      inv.status === 'CANCELLED' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    {inv.status}
                  </span>
                  <span className="font-medium text-gray-900">{inv.count} <span className="text-gray-400 font-normal">· {INR(inv.total)}</span></span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">No invoices in this period</p>
          )}
        </div>
      </div>

      {/* ── Top Businesses & Recent Signups ────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Top Businesses */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Businesses by Invoices</h3>
          <div className="space-y-2.5">
            {topBusinesses.map((biz, i) => (
              <div
                key={biz.id}
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                onClick={() => history.push(`/admin/businesses/${biz.id}`)}
              >
                <span className="text-[10px] font-bold text-gray-400 w-4 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{biz.name}</p>
                  <p className="text-[10px] text-gray-500">{biz.owner?.name || biz.owner?.phone} · {biz.plan?.displayName || 'Free'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-gray-900">{biz._count.invoices} inv</p>
                  <p className="text-[10px] text-gray-400">{biz._count.customers} cust</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Signups */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Signups</h3>
          <div className="space-y-2.5">
            {recentSignups.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                onClick={() => history.push(`/admin/users/${user.id}`)}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    {(user.name || user.phone)?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{user.name || 'Unnamed'}</p>
                    <p className="text-[10px] text-gray-500">{user.phone}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-[10px] text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  {user.role === 'SUPER_ADMIN' && (
                    <span className="block text-[9px] text-blue-600 font-medium">Admin</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
