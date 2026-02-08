import { useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../lib/api'
import {
  ArrowLeft, Building2, User, FileText, Package, Users as UsersIcon,
  CreditCard, Calendar, CheckCircle, AlertTriangle, Ban, ExternalLink,
  Shield, BarChart3, Palette, Receipt, DollarSign, Hash
} from 'lucide-react'

const STATUS_BADGE = {
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-yellow-100 text-yellow-700',
  BANNED: 'bg-red-100 text-red-700',
}

const INV_STATUS_BADGE = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ISSUED: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
  OVERDUE: 'bg-orange-100 text-orange-700',
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'invoices', label: 'Invoices', icon: FileText },
  { key: 'customers', label: 'Customers', icon: UsersIcon },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'settings', label: 'Settings', icon: Shield },
]

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs font-medium text-gray-900 text-right max-w-[60%] truncate ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
    </div>
  )
}

function StatBox({ label, value, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-3 text-center">
      <div className={`w-8 h-8 rounded-lg mx-auto mb-1.5 flex items-center justify-center ${colorMap[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
    </div>
  )
}

const INR = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const fmtShort = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'

export default function AdminBusinessDetailPage() {
  const { id } = useParams()
  const history = useHistory()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')

  const { data: business, isLoading, error } = useQuery({
    queryKey: ['admin', 'business', id],
    queryFn: () => adminApi.getBusinessDetails(id).then(r => r.data.data)
  })

  const statusMutation = useMutation({
    mutationFn: (status) => adminApi.updateBusinessStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'business', id])
      queryClient.invalidateQueries(['admin', 'businesses'])
    }
  })

  const impersonateMutation = useMutation({
    mutationFn: () => adminApi.impersonateBusiness(id),
    onSuccess: (res) => {
      const { token } = res.data.data
      window.open(`${window.location.origin}/home?impersonate_token=${token}`, '_blank')
    }
  })

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-32" />
          <div className="h-10 bg-gray-200 rounded w-full" />
          <div className="h-60 bg-gray-200 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
          Failed to load business: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => history.push('/admin/businesses')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-gray-900 truncate">{business.name}</h1>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_BADGE[business.status]}`}>
              {business.status}
            </span>
            {business.gstEnabled && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600">GST</span>
            )}
          </div>
          <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">{business.id}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {business.status === 'ACTIVE' && (
          <button onClick={() => statusMutation.mutate('SUSPENDED')} disabled={statusMutation.isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100">
            <AlertTriangle className="w-3.5 h-3.5" /> Suspend
          </button>
        )}
        {business.status === 'SUSPENDED' && (
          <>
            <button onClick={() => statusMutation.mutate('ACTIVE')} disabled={statusMutation.isLoading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100">
              <CheckCircle className="w-3.5 h-3.5" /> Activate
            </button>
            <button onClick={() => statusMutation.mutate('BANNED')} disabled={statusMutation.isLoading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100">
              <Ban className="w-3.5 h-3.5" /> Ban
            </button>
          </>
        )}
        {business.status === 'BANNED' && (
          <button onClick={() => statusMutation.mutate('ACTIVE')} disabled={statusMutation.isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100">
            <CheckCircle className="w-3.5 h-3.5" /> Reactivate
          </button>
        )}
        <button onClick={() => impersonateMutation.mutate()} disabled={impersonateMutation.isLoading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
          <ExternalLink className="w-3.5 h-3.5" /> View as User
        </button>
        <button onClick={() => history.push(`/admin/users/${business.owner?.id}`)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100">
          <User className="w-3.5 h-3.5" /> View Owner
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide border-b border-gray-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
              activeTab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {key === 'invoices' && <span className="text-[10px] text-gray-400 ml-0.5">({business._count?.invoices || 0})</span>}
            {key === 'customers' && <span className="text-[10px] text-gray-400 ml-0.5">({business._count?.customers || 0})</span>}
            {key === 'products' && <span className="text-[10px] text-gray-400 ml-0.5">({business._count?.products || 0})</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab business={business} />}
      {activeTab === 'invoices' && <InvoicesTab invoices={business.recentInvoices} statusBreakdown={business.invoiceStatusBreakdown} aggregates={business.invoiceAggregates} />}
      {activeTab === 'customers' && <CustomersTab customers={business.customers} />}
      {activeTab === 'products' && <ProductsTab products={business.products} />}
      {activeTab === 'settings' && <SettingsTab business={business} />}
    </div>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────
function OverviewTab({ business }) {
  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="Invoices" value={business._count?.invoices || 0} icon={FileText} color="blue" />
        <StatBox label="Customers" value={business._count?.customers || 0} icon={UsersIcon} color="green" />
        <StatBox label="Products" value={business._count?.products || 0} icon={Package} color="purple" />
        <StatBox label="Revenue" value={INR(business.invoiceAggregates?.totalRevenue)} icon={DollarSign} color="orange" />
      </div>

      {/* Invoice Revenue Stats */}
      {business.invoiceAggregates?.count > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-gray-400" /> Invoice Revenue
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-gray-900">{INR(business.invoiceAggregates.totalRevenue)}</p>
              <p className="text-[10px] text-gray-500 uppercase">Total</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{INR(business.invoiceAggregates.avgInvoice)}</p>
              <p className="text-[10px] text-gray-500 uppercase">Average</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{INR(business.invoiceAggregates.maxInvoice)}</p>
              <p className="text-[10px] text-gray-500 uppercase">Largest</p>
            </div>
          </div>
          {/* Invoice status breakdown */}
          {business.invoiceStatusBreakdown?.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex flex-wrap gap-3">
                {business.invoiceStatusBreakdown.map((s) => (
                  <div key={s.status} className="flex items-center gap-1.5 text-xs">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${INV_STATUS_BADGE[s.status] || 'bg-gray-100 text-gray-600'}`}>
                      {s.status}
                    </span>
                    <span className="text-gray-600">{s.count}</span>
                    <span className="text-gray-400">· {INR(s.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Business Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400" /> Business Info
          </h3>
          <InfoRow label="Name" value={business.name} />
          <InfoRow label="Phone" value={business.phone} />
          <InfoRow label="Email" value={business.email} />
          <InfoRow label="GST Enabled" value={business.gstEnabled ? 'Yes' : 'No'} />
          <InfoRow label="GSTIN" value={business.gstin} mono />
          <InfoRow label="State Code" value={business.stateCode} />
          <InfoRow label="Address" value={business.address} />
          <InfoRow label="Invoice Prefix" value={business.invoicePrefix} />
          <InfoRow label="Next Invoice #" value={business.nextInvoiceNumber} />
          <InfoRow label="Created" value={fmtDate(business.createdAt)} />
          <InfoRow label="Updated" value={fmtDate(business.updatedAt)} />
        </div>

        {/* Owner Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" /> Owner
          </h3>
          <InfoRow label="Name" value={business.owner?.name} />
          <InfoRow label="Phone" value={business.owner?.phone} />
          <InfoRow label="Email" value={business.owner?.email} />
          <InfoRow label="Role" value={business.owner?.role} />
          <InfoRow label="Status" value={business.owner?.status} />
          <InfoRow label="Joined" value={fmtDate(business.owner?.createdAt)} />

          <h3 className="text-sm font-semibold text-gray-900 mt-5 mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-400" /> Plan & Subscription
          </h3>
          <InfoRow label="Plan" value={business.plan?.displayName || 'No Plan'} />
          <InfoRow label="Plan Key" value={business.plan?.name} />
          <InfoRow label="Subscription Status" value={business.subscription?.status || 'None'} />
          <InfoRow label="Amount" value={business.subscription?.amount ? INR(business.subscription.amount) : '—'} />
          <InfoRow label="Renews At" value={business.subscription?.renewAt ? fmtDate(business.subscription.renewAt) : '—'} />
          <InfoRow label="This Month Usage" value={`${business.usage?.invoicesIssuedCount || 0} invoices issued`} />
        </div>
      </div>
    </div>
  )
}

// ── Invoices Tab ─────────────────────────────────────────────────────────
function InvoicesTab({ invoices, statusBreakdown, aggregates }) {
  if (!invoices || invoices.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No invoices yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-3">
        {statusBreakdown?.map((s) => (
          <span key={s.status} className={`text-[11px] px-2 py-1 rounded-md font-medium ${INV_STATUS_BADGE[s.status] || 'bg-gray-100 text-gray-600'}`}>
            {s.status}: {s.count} · {INR(s.total)}
          </span>
        ))}
      </div>

      {/* Invoice list */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {invoices.map((inv) => (
          <div key={inv.id} className="p-3 md:p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-gray-900">{inv.invoiceNumber}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${INV_STATUS_BADGE[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                    {inv.status}
                  </span>
                  <span className="text-[10px] text-gray-400">{inv.documentType}</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  {inv.customer?.name || 'No customer'}
                  {inv.customer?.phone && <span className="text-gray-400"> · {inv.customer.phone}</span>}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-gray-900">{INR(inv.total)}</p>
                <p className="text-[10px] text-gray-400">{fmtShort(inv.date)}</p>
                {inv.dueDate && <p className="text-[10px] text-gray-400">Due: {fmtShort(inv.dueDate)}</p>}
              </div>
            </div>
            {(inv.subtotal || inv.taxTotal) && (
              <div className="flex gap-3 mt-1.5 text-[10px] text-gray-400">
                <span>Subtotal: {INR(inv.subtotal)}</span>
                <span>Tax: {INR(inv.taxTotal)}</span>
                {inv.issuedAt && <span>Issued: {fmtShort(inv.issuedAt)}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
      {invoices.length >= 50 && (
        <p className="text-[10px] text-gray-400 text-center">Showing last 50 invoices</p>
      )}
    </div>
  )
}

// ── Customers Tab ────────────────────────────────────────────────────────
function CustomersTab({ customers }) {
  if (!customers || customers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <UsersIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No customers yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
      {customers.map((cust) => (
        <div key={cust.id} className="p-3 md:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {cust.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{cust.name}</p>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                  {cust.phone && <span>{cust.phone}</span>}
                  {cust.email && <span className="hidden sm:inline">{cust.email}</span>}
                </div>
                {cust.gstin && <p className="text-[10px] text-gray-400 font-mono mt-0.5">GSTIN: {cust.gstin}</p>}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-medium text-gray-900">{cust._count?.invoices || 0} inv</p>
              <p className="text-[10px] text-gray-400">{fmtShort(cust.createdAt)}</p>
            </div>
          </div>
        </div>
      ))}
      {customers.length >= 50 && (
        <p className="text-[10px] text-gray-400 text-center py-2">Showing last 50 customers</p>
      )}
    </div>
  )
}

// ── Products Tab ─────────────────────────────────────────────────────────
function ProductsTab({ products }) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No products yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
      {products.map((prod) => (
        <div key={prod.id} className="p-3 md:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-gray-900 truncate">{prod.name}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">{prod.type}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                {prod.unit && <span>Unit: {prod.unit}</span>}
                {prod.hsnCode && <span className="font-mono">HSN: {prod.hsnCode}</span>}
                {prod.taxRate !== null && prod.taxRate !== undefined && <span>Tax: {prod.taxRate}%</span>}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-gray-900">{INR(prod.rate)}</p>
              <p className="text-[10px] text-gray-400">{fmtShort(prod.createdAt)}</p>
            </div>
          </div>
        </div>
      ))}
      {products.length >= 50 && (
        <p className="text-[10px] text-gray-400 text-center py-2">Showing last 50 products</p>
      )}
    </div>
  )
}

// ── Settings Tab ─────────────────────────────────────────────────────────
function SettingsTab({ business }) {
  return (
    <div className="space-y-4">
      {/* Tax Rates */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-gray-400" /> Tax Rates ({business.taxRates?.length || 0})
        </h3>
        {business.taxRates?.length > 0 ? (
          <div className="space-y-2">
            {business.taxRates.map((tr) => (
              <div key={tr.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-900">{tr.name}</span>
                  {tr.isDefault && <span className="text-[9px] px-1 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">Default</span>}
                </div>
                <span className="text-xs font-semibold text-gray-700">{tr.rate}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No custom tax rates</p>
        )}
      </div>

      {/* Template Configs */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Palette className="w-4 h-4 text-gray-400" /> Template Configurations ({business.templateConfigs?.length || 0})
        </h3>
        {business.templateConfigs?.length > 0 ? (
          <div className="space-y-2">
            {business.templateConfigs.map((tc) => (
              <div key={tc.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-xs font-medium text-gray-900">{tc.baseTemplate?.name || 'Unknown'}</p>
                  <p className="text-[10px] text-gray-500">{tc.baseTemplate?.description}</p>
                </div>
                {tc.isActive && <span className="text-[9px] px-1 py-0.5 rounded bg-green-50 text-green-600 font-medium">Active</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No template configurations</p>
        )}
      </div>

      {/* GST Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-gray-400" /> GST & Billing
        </h3>
        <InfoRow label="GST Enabled" value={business.gstEnabled ? 'Yes' : 'No'} />
        <InfoRow label="GSTIN" value={business.gstin} mono />
        <InfoRow label="State Code" value={business.stateCode} />
        <InfoRow label="Invoice Prefix" value={business.invoicePrefix} />
        <InfoRow label="Next Invoice Number" value={business.nextInvoiceNumber} />
        <InfoRow label="Default Terms" value={business.defaultTerms} />
        <InfoRow label="Default Notes" value={business.defaultNotes} />
      </div>
    </div>
  )
}
