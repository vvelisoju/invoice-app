import { useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, AlertTriangle, Plus, Settings, X, Home, Users, Package, PieChart, Palette, LogOut, ChevronDown, Crown, Infinity, Star } from 'lucide-react'
import { plansApi, businessApi } from '../../lib/api'
import { ALL_INVOICE_TYPES, DEFAULT_ENABLED_TYPES, headerTabs, getActiveTabKey } from './navigationConfig'
import { useAuthStore } from '../../store/authStore'

export default function AppSidebar({ mobile = false, onClose }) {
  const history = useHistory()
  const location = useLocation()
  const queryClient = useQueryClient()
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
  const defaultDocType = businessProfile?.defaultDocType || 'invoice'

  const setDefaultMutation = useMutation({
    mutationFn: (docType) => businessApi.updateProfile({ defaultDocType: docType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business'] })
    }
  })

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
              const isOnNewPage = location.pathname === '/invoices/new'
              const urlType = new URLSearchParams(location.search).get('type') || 'invoice'
              const isActive = isOnNewPage && urlType === type.key
              const isDefault = defaultDocType === type.key
              return (
                <div key={type.key} className="relative group/item flex items-center">
                  <button
                    onClick={() => navigate(`/invoices/new?type=${type.key}`)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                      isActive
                        ? 'text-primary bg-primary/8 font-semibold'
                        : 'text-textSecondary hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 transition-colors shrink-0 ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`} />
                    <span className="flex-1 text-left">{type.label}</span>
                    {isDefault && (
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                    )}
                  </button>
                  {!isDefault && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDefaultMutation.mutate(type.key) }}
                      className="absolute right-2 opacity-0 group-hover/item:opacity-100 w-6 h-6 flex items-center justify-center rounded hover:bg-amber-50 text-gray-300 hover:text-amber-500 transition-all"
                      title="Set as default"
                    >
                      <Star className="w-3 h-3" />
                    </button>
                  )}
                </div>
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
          <div className={`p-3 rounded-xl border transition-all ${
            isAtLimit ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200' :
            isNearLimit ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200' :
            'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Crown className={`w-3.5 h-3.5 ${
                  isAtLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-600' : 'text-primary'
                }`} />
                <p className={`text-xs font-bold ${
                  isAtLimit ? 'text-red-700' : isNearLimit ? 'text-yellow-700' : 'text-primary'
                }`}>{plan?.name || 'Free'} Plan</p>
              </div>
              {isNearLimit && <AlertTriangle className={`w-3.5 h-3.5 ${isAtLimit ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`} />}
            </div>
            <div className="flex items-baseline gap-1 mb-1.5">
              <span className="text-lg font-bold text-textPrimary">{used}</span>
              {isUnlimited ? (
                <span className="text-[10px] text-textSecondary flex items-center gap-0.5">/ <Infinity className="w-3 h-3" /></span>
              ) : (
                <span className="text-[10px] text-textSecondary">/ {limit} invoices</span>
              )}
            </div>
            {!isUnlimited && (
              <div className="w-full h-1.5 bg-white/80 rounded-full overflow-hidden mb-2.5">
                <div className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`} style={{ width: `${Math.min(percentage * 100, 100)}%` }} />
              </div>
            )}
            <button
              onClick={() => navigate('/plans')}
              className={`w-full text-[10px] font-bold py-1.5 rounded-md transition-colors ${
                isAtLimit ? 'bg-red-500 text-white hover:bg-red-600' :
                'text-primary hover:bg-primary/10'
              }`}
            >
              {isAtLimit ? 'Upgrade Now' : 'Manage Subscription'}
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
      {/* Drawer Header — Logo + Close */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
        <div className="flex items-center min-w-0">
          <img
            src="/assets/brand/logo-full-transparent.png"
            alt="Invoice Baba"
            className="h-10 shrink-0"
          />
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
                const isOnNewPage = location.pathname === '/invoices/new'
                const urlType = new URLSearchParams(location.search).get('type') || 'invoice'
                const isActiveType = isOnNewPage && urlType === type.key
                const isDefault = defaultDocType === type.key
                return (
                  <div key={type.key} className="flex items-center">
                    <button
                      onClick={() => navigate(`/invoices/new?type=${type.key}`)}
                      className={`flex-1 flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                        isActiveType
                          ? 'text-primary bg-primary/8 font-semibold'
                          : 'text-textSecondary active:text-primary active:bg-primary/5'
                      }`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${isActiveType ? 'text-primary' : 'text-gray-400'}`} />
                      <span className="flex-1 text-left">{type.label}</span>
                      {isDefault && (
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </button>
                    {!isDefault && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDefaultMutation.mutate(type.key) }}
                        className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-300 active:text-amber-500 active:bg-amber-50 transition-all shrink-0"
                        title="Set as default"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
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
                onClick={() => { queryClient.clear(); logout(); history.replace('/auth/phone'); if (onClose) onClose() }}
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
        <div className={`p-3 rounded-xl border transition-all ${
          isAtLimit ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200' :
          isNearLimit ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200' :
          'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Crown className={`w-3.5 h-3.5 ${
                isAtLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-600' : 'text-primary'
              }`} />
              <p className={`text-xs font-bold ${
                isAtLimit ? 'text-red-700' : isNearLimit ? 'text-yellow-700' : 'text-primary'
              }`}>{plan?.name || 'Free'} Plan</p>
            </div>
            {isNearLimit && <AlertTriangle className={`w-3.5 h-3.5 ${isAtLimit ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`} />}
          </div>
          <div className="flex items-baseline gap-1 mb-1.5">
            <span className="text-lg font-bold text-textPrimary">{used}</span>
            {isUnlimited ? (
              <span className="text-[10px] text-textSecondary flex items-center gap-0.5">/ <Infinity className="w-3 h-3" /></span>
            ) : (
              <span className="text-[10px] text-textSecondary">/ {limit} invoices</span>
            )}
          </div>
          {!isUnlimited && (
            <div className="w-full h-1.5 bg-white/80 rounded-full overflow-hidden mb-2.5">
              <div className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`} style={{ width: `${Math.min(percentage * 100, 100)}%` }} />
            </div>
          )}
          <button
            onClick={() => navigate('/plans')}
            className={`w-full text-[10px] font-bold py-1.5 rounded-md transition-colors ${
              isAtLimit ? 'bg-red-500 text-white active:bg-red-600' :
              'text-primary active:bg-primary/10'
            }`}
          >
            {isAtLimit ? 'Upgrade Now' : 'Manage Subscription'}
          </button>
        </div>
      </div>
    </aside>
  )
}
