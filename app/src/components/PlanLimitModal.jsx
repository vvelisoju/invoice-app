import { useHistory } from 'react-router-dom'
import { Rocket, Zap } from 'lucide-react'
import AppModal from './AppModal'

/**
 * Modal shown when user hits their plan's invoice limit.
 * Navigates to /plans on upgrade click.
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - usage?: { invoicesIssued, invoicesRemaining }
 * - plan?: { name, monthlyInvoiceLimit }
 */
export default function PlanLimitModal({ isOpen, onClose, usage, plan }) {
  const history = useHistory()

  const handleUpgrade = () => {
    onClose()
    history.push('/plans')
  }

  const formatNumber = (num) => new Intl.NumberFormat('en-IN').format(num || 0)

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Plan Limit Reached"
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
      <div className="space-y-5">
        {/* Icon + Message */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
          <Rocket className="w-10 h-10 text-amber-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-amber-800 mb-1">Monthly Limit Reached</h3>
          <p className="text-sm text-amber-700">
            You've used {formatNumber(usage?.invoicesIssued)} of {formatNumber(plan?.monthlyInvoiceLimit)} invoices this month.
          </p>
        </div>

        {/* Current Plan Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-textSecondary mb-1">Current Plan</p>
          <p className="text-sm font-semibold text-textPrimary">{plan?.name || 'Free'}</p>
          <p className="text-xs text-textSecondary mt-0.5">
            {formatNumber(plan?.monthlyInvoiceLimit)} invoices/month
          </p>
        </div>

        <p className="text-xs text-textSecondary text-center">
          Upgrade to get more invoices, unlimited customers, and premium features.
        </p>
      </div>
    </AppModal>
  )
}
