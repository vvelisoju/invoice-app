import { FileText, AlertTriangle } from 'lucide-react'

export default function PlanUsageCard({ usage, onUpgradeClick }) {
  if (!usage) return null

  const { plan, usage: usageData } = usage
  const percentage = plan?.monthlyInvoiceLimit 
    ? (usageData?.invoicesIssued / plan.monthlyInvoiceLimit) 
    : 0
  const isNearLimit = percentage >= 0.8
  const isAtLimit = percentage >= 1

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num || 0)
  }

  const barColor = isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-primary'

  return (
    <div className="bg-bgSecondary rounded-xl border border-border shadow-card p-5">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-textPrimary">{plan?.name || 'Free'} Plan</span>
          </div>
          <p className="text-xs text-textSecondary">
            {formatNumber(usageData?.invoicesIssued)} of {formatNumber(plan?.monthlyInvoiceLimit)} invoices used
          </p>
        </div>
        {isNearLimit && (
          <AlertTriangle className={`w-5 h-5 ${isAtLimit ? 'text-red-500' : 'text-yellow-500'}`} />
        )}
      </div>

      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(percentage * 100, 100)}%` }} />
      </div>

      {isAtLimit && (
        <div className="mt-3 p-2.5 bg-red-50 rounded-lg flex justify-between items-center">
          <span className="text-xs text-red-600">Limit reached. Upgrade to continue.</span>
          <button onClick={onUpgradeClick} className="text-xs font-semibold text-primary cursor-pointer hover:underline">
            Upgrade
          </button>
        </div>
      )}

      {isNearLimit && !isAtLimit && (
        <p className="mt-2 text-xs text-yellow-600">
          {formatNumber(usageData?.invoicesRemaining)} invoices remaining this month
        </p>
      )}
    </div>
  )
}
