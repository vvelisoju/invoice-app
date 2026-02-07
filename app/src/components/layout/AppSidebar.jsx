import { useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FileText, AlertTriangle, Plus, Settings, X, Home, Users, Package, PieChart, Palette, LogOut, ChevronDown } from 'lucide-react'
import { plansApi, businessApi } from '../../lib/api'
import { ALL_INVOICE_TYPES, DEFAULT_ENABLED_TYPES, headerTabs, getActiveTabKey } from './navigationConfig'
import { useAuthStore } from '../../store/authStore'

export default function AppSidebar({ mobile = false, onClose }) {
  const history = useHistory()
  const location = useLocation()
  const logout = useAuthStore((state) => state.logout)
  const business = useAuthStore((state) => state.business)
  const activeTabKey = getActiveTabKey(location.pathname)

  // Collapsible section state — Navigation & Create New open by default, Settings collapsed
  const [openSections, setOpenSections] = useState({ navigation: true, createNew: true, settings: false })

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const navigate = (path) => {
    history.push(path)
    if (mobile && onClose) onClose()
  }

  // Fetch business profile to get enabledInvoiceTypes
  const { data: businessProfile } = useQuery({
    queryKey: ['business'],
    queryFn: async () => {
      const response = await businessApi.getProfile()
      return response.data?.data || response.data
    },
    staleTime: 1000 * 60 * 5
  })

  const enabledKeys = businessProfile?.enabledInvoiceTypes || DEFAULT_ENABLED_TYPES
  const enabledTypes = ALL_INVOICE_TYPES.filter(t => enabledKeys.includes(t.key))

  // Plan usage
  const { data: planUsage } = useQuery({
    queryKey: ['plans', 'usage'],
    queryFn: async () => {
      const response = await plansApi.getUsage()
      return response.data.data || response.data
    },
    staleTime: 1000 * 60 * 5
  })

  const plan = planUsage?.plan
  const usage = planUsage?.usage
  const limit = plan?.monthlyInvoiceLimit || 10
  const used = usage?.invoicesIssued || 0
  const isUnlimited = limit >= 999999
  const percentage = isUnlimited ? 0 : (limit > 0 ? used / limit : 0)
  const isNearLimit = !isUnlimited && percentage >= 0.8
  const isAtLimit = !isUnlimited && percentage >= 1
  const barColor = isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-primary'

  // Desktop sidebar: hidden on mobile
  if (!mobile) {
    return (
      <aside className="w-56 bg-bgSecondary border-r border-border flex-col shrink-0 hidden md:flex">
        <div className="flex-1 overflow-y-auto">
          {/* Section header */}
          <div className="px-4 pt-5 pb-2">
            <h3 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest">Create New</h3>
          </div>

          {/* Invoice type list */}
          <nav className="px-2 space-y-0.5">
            {enabledTypes.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.key}
                  onClick={() => navigate(`/invoices/new?type=${type.key}`)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-textSecondary hover:text-primary hover:bg-primary/5 transition-all group"
                >
                  <Icon className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors shrink-0" />
                  <span>{type.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Manage types link */}
          <div className="px-2 mt-3 mb-4">
            <button
              onClick={() => navigate('/settings?section=invoice')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-textSecondary/70 hover:text-textPrimary hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Manage Types
            </button>
          </div>
        </div>

        {/* Bottom Plan Card */}
        <div className="mt-auto p-3 border-t border-border">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-primary" />
              <p className="text-xs font-semibold text-primary">{plan?.name || 'Free'} Plan</p>
              {isNearLimit && <AlertTriangle className={`w-3.5 h-3.5 ${isAtLimit ? 'text-red-500' : 'text-yellow-500'}`} />}
            </div>
            <p className="text-[10px] text-textSecondary mb-2">
              {isUnlimited ? `${used} invoices used` : `${used} of ${limit} invoices used`}
            </p>
            {!isUnlimited && (
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(percentage * 100, 100)}%` }} />
              </div>
            )}
            <button
              onClick={() => navigate('/plans')}
              className="text-[10px] font-bold text-primary hover:underline"
            >
              Manage Subscription
            </button>
          </div>
        </div>
      </aside>
    )
  }

  // Determine active nav item — only one item should be active at a time
  const isHome = location.pathname === '/home' || location.pathname === '/'
  const isDocuments = !isHome && (location.pathname.startsWith('/invoices') || activeTabKey === 'documents')
  const isCustomers = location.pathname.startsWith('/customers')
  const isProducts = location.pathname.startsWith('/products')
  const isReports = location.pathname.startsWith('/reports')

  // Mobile drawer sidebar
  return (
    <aside className="h-full bg-bgSecondary flex flex-col shadow-xl">
      {/* Drawer Header — Logo + Business Name */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base text-textPrimary truncate">
            {business?.name || 'InvoiceApp'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-11 h-11 flex items-center justify-center rounded-lg text-textSecondary active:bg-bgPrimary shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Navigation Section — collapsible, open by default */}
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={() => toggleSection('navigation')}
            className="w-full flex items-center justify-between px-3 py-2 mb-1"
          >
            <h3 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest">Navigation</h3>
            <ChevronDown className={`w-3.5 h-3.5 text-textSecondary transition-transform ${openSections.navigation ? 'rotate-180' : ''}`} />
          </button>
          {openSections.navigation && (
            <nav className="space-y-0.5">
              <button
                onClick={() => navigate('/home')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                  isHome ? 'text-primary bg-primary/5' : 'text-textSecondary active:bg-primary/5'
                }`}
              >
                <Home className="w-5 h-5 shrink-0" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => navigate('/invoices')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                  isDocuments ? 'text-primary bg-primary/5' : 'text-textSecondary active:bg-primary/5'
                }`}
              >
                <FileText className="w-5 h-5 shrink-0" />
                <span>My Documents</span>
              </button>
              <button
                onClick={() => navigate('/customers')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                  isCustomers ? 'text-primary bg-primary/5' : 'text-textSecondary active:bg-primary/5'
                }`}
              >
                <Users className="w-5 h-5 shrink-0" />
                <span>My Customers</span>
              </button>
              <button
                onClick={() => navigate('/products')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                  isProducts ? 'text-primary bg-primary/5' : 'text-textSecondary active:bg-primary/5'
                }`}
              >
                <Package className="w-5 h-5 shrink-0" />
                <span>My Products</span>
              </button>
              <button
                onClick={() => navigate('/reports')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                  isReports ? 'text-primary bg-primary/5' : 'text-textSecondary active:bg-primary/5'
                }`}
              >
                <PieChart className="w-5 h-5 shrink-0" />
                <span>Reports</span>
              </button>
            </nav>
          )}
        </div>

        {/* Create New Section — collapsible, open by default */}
        <div className="px-3 pt-1 pb-1">
          <button
            onClick={() => toggleSection('createNew')}
            className="w-full flex items-center justify-between px-3 py-2 mb-1"
          >
            <h3 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest">Create New</h3>
            <ChevronDown className={`w-3.5 h-3.5 text-textSecondary transition-transform ${openSections.createNew ? 'rotate-180' : ''}`} />
          </button>
          {openSections.createNew && (
            <nav className="space-y-0.5">
              {enabledTypes.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.key}
                    onClick={() => navigate(`/invoices/new?type=${type.key}`)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-textSecondary active:text-primary active:bg-primary/5 transition-all"
                  >
                    <Icon className="w-5 h-5 text-gray-400 shrink-0" />
                    <span>{type.label}</span>
                  </button>
                )
              })}
            </nav>
          )}
        </div>

        {/* Settings Section — collapsible, collapsed by default */}
        <div className="px-3 pt-1 pb-2 border-t border-border mt-1">
          <button
            onClick={() => toggleSection('settings')}
            className="w-full flex items-center justify-between px-3 py-2 mb-1 mt-2"
          >
            <h3 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest">Settings</h3>
            <ChevronDown className={`w-3.5 h-3.5 text-textSecondary transition-transform ${openSections.settings ? 'rotate-180' : ''}`} />
          </button>
          {openSections.settings && (
            <nav className="space-y-0.5">
              <button
                onClick={() => navigate('/settings')}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-textSecondary active:bg-primary/5 transition-all"
              >
                <Settings className="w-5 h-5 shrink-0" />
                <span>Business Settings</span>
              </button>
              <button
                onClick={() => { logout(); history.replace('/auth/phone'); if (onClose) onClose() }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-600 active:bg-red-50 transition-all"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                <span>Logout</span>
              </button>
            </nav>
          )}
        </div>
      </div>

      {/* Bottom Plan Card */}
      <div className="mt-auto p-3 border-t border-border safe-bottom">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
          <div className="flex items-center gap-1.5 mb-1">
            <FileText className="w-3.5 h-3.5 text-primary" />
            <p className="text-xs font-semibold text-primary">{plan?.name || 'Free'} Plan</p>
            {isNearLimit && <AlertTriangle className={`w-3.5 h-3.5 ${isAtLimit ? 'text-red-500' : 'text-yellow-500'}`} />}
          </div>
          <p className="text-[10px] text-textSecondary mb-2">
            {isUnlimited ? `${used} invoices used` : `${used} of ${limit} invoices used`}
          </p>
          {!isUnlimited && (
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(percentage * 100, 100)}%` }} />
            </div>
          )}
          <button
            onClick={() => navigate('/plans')}
            className="text-[10px] font-bold text-primary active:underline"
          >
            Manage Subscription
          </button>
        </div>
      </div>
    </aside>
  )
}
