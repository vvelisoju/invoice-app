import { useHistory } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FileText, AlertTriangle, Plus, Settings } from 'lucide-react'
import { plansApi, businessApi } from '../../lib/api'
import { ALL_INVOICE_TYPES, DEFAULT_ENABLED_TYPES } from './navigationConfig'

export default function AppSidebar() {
  const history = useHistory()

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

  return (
    <aside className="w-56 bg-bgSecondary border-r border-border flex flex-col shrink-0 hidden md:flex">
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
                onClick={() => history.push(`/invoices/new?type=${type.key}`)}
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
            onClick={() => history.push('/settings?section=invoice')}
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
            onClick={() => history.push('/plans')}
            className="text-[10px] font-bold text-primary hover:underline"
          >
            Manage Subscription
          </button>
        </div>
      </div>
    </aside>
  )
}
