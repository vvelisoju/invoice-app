import { useHistory } from 'react-router-dom'
import { Zap, FileText, Users, Package, Trash2 } from 'lucide-react'
import AppModal from './AppModal'

/**
 * Generic plan limit modal — shown when user hits invoice, customer, or product limits.
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - resourceType: 'invoice' | 'customer' | 'product'
 * - usage: { plan, usage, canIssueInvoice, canCreateCustomer, canCreateProduct }
 */

const RESOURCE_CONFIG = {
  invoice: {
    icon: FileText,
    title: 'Invoice Limit Reached',
    color: 'amber',
    getUsed: (u) => u?.invoicesIssued || 0,
    getLimit: (p) => p?.monthlyInvoiceLimit || 10,
    label: 'invoices',
    periodLabel: 'this month',
    canDelete: false,
    hint: 'Invoice count is based on issued invoices and cannot be reduced by deleting.',
  },
  customer: {
    icon: Users,
    title: 'Customer Limit Reached',
    color: 'blue',
    getUsed: (u) => u?.customersCount || 0,
    getLimit: (p) => p?.customersLimit || 20,
    label: 'customers',
    periodLabel: '',
    canDelete: true,
    hint: 'You can delete unused customers to free up slots, or upgrade for more.',
  },
  product: {
    icon: Package,
    title: 'Product Limit Reached',
    color: 'purple',
    getUsed: (u) => u?.productsCount || 0,
    getLimit: (p) => p?.productsLimit || 20,
    label: 'products',
    periodLabel: '',
    canDelete: true,
    hint: 'You can delete unused products to free up slots, or upgrade for more.',
  },
}

const COLOR_MAP = {
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', sub: 'text-amber-700', icon: 'text-amber-600', bar: 'bg-amber-500' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', sub: 'text-blue-700', icon: 'text-blue-600', bar: 'bg-blue-500' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', sub: 'text-purple-700', icon: 'text-purple-600', bar: 'bg-purple-500' },
}

export default function PlanLimitModal({ isOpen, onClose, resourceType = 'invoice', usage }) {
  const history = useHistory()
  const config = RESOURCE_CONFIG[resourceType] || RESOURCE_CONFIG.invoice
  const colors = COLOR_MAP[config.color]
  const Icon = config.icon

  const plan = usage?.plan
  const usageData = usage?.usage
  const used = config.getUsed(usageData)
  const limit = config.getLimit(plan)
  const isUnlimited = limit >= 999999
  const percentage = isUnlimited ? 0 : (limit > 0 ? Math.min(used / limit, 1) : 0)

  const fmt = (num) => new Intl.NumberFormat('en-IN').format(num || 0)

  const handleUpgrade = () => {
    onClose()
    history.push('/plans')
  }

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={config.title}
      actions={
        <div className="space-y-2">
          <button
            onClick={handleUpgrade}
            className="w-full py-3 bg-primary active:bg-primaryHover md:hover:bg-primaryHover text-white rounded-xl font-semibold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Upgrade Plan
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-textSecondary active:text-textPrimary md:hover:text-textPrimary transition-colors"
          >
            Maybe Later
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Usage Alert */}
        <div className={`${colors.bg} ${colors.border} border rounded-xl p-4 text-center`}>
          <Icon className={`w-9 h-9 ${colors.icon} mx-auto mb-2.5`} />
          <h3 className={`text-sm font-bold ${colors.text} mb-1`}>
            {fmt(used)} / {isUnlimited ? '∞' : fmt(limit)} {config.label} used{config.periodLabel ? ` ${config.periodLabel}` : ''}
          </h3>
          <div className="w-full h-2 bg-white/80 rounded-full overflow-hidden mt-3 mb-1">
            <div className={`h-full rounded-full transition-all ${colors.bar}`} style={{ width: `${percentage * 100}%` }} />
          </div>
        </div>

        {/* Current Plan */}
        <div className="bg-gray-50 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-textSecondary mb-0.5">Current Plan</p>
            <p className="text-sm font-semibold text-textPrimary">{plan?.name || 'Free'}</p>
          </div>
          <div className="text-right text-[11px] text-textSecondary space-y-0.5">
            <p>{fmt(plan?.monthlyInvoiceLimit >= 999999 ? '∞' : plan?.monthlyInvoiceLimit)} invoices/mo</p>
            <p>{fmt(plan?.customersLimit >= 999999 ? '∞' : plan?.customersLimit)} customers</p>
            <p>{fmt(plan?.productsLimit >= 999999 ? '∞' : plan?.productsLimit)} products</p>
          </div>
        </div>

        {/* Hint */}
        <div className="flex items-start gap-2 px-1">
          {config.canDelete && <Trash2 className="w-3.5 h-3.5 text-textSecondary mt-0.5 shrink-0" />}
          <p className="text-xs text-textSecondary leading-relaxed">{config.hint}</p>
        </div>
      </div>
    </AppModal>
  )
}
