import { X, Rocket, CheckCircle } from 'lucide-react'

export default function UpgradePrompt({ isOpen, onClose, usage }) {
  if (!isOpen) return null

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num || 0)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-bgSecondary rounded-2xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-textPrimary">Upgrade Your Plan</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-textSecondary hover:bg-bgPrimary rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Limit Reached */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <Rocket className="w-10 h-10 text-yellow-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-yellow-800 mb-1">Monthly Limit Reached</h3>
            <p className="text-sm text-yellow-700">
              You've issued {formatNumber(usage?.invoicesIssued)} of {formatNumber(usage?.plan?.monthlyInvoiceLimit)} invoices this month.
            </p>
          </div>

          {/* Current Plan */}
          <div>
            <h4 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">Current Plan</h4>
            <div className="bg-bgPrimary rounded-lg p-4">
              <div className="text-lg font-semibold text-textPrimary">{usage?.plan?.name || 'Free'}</div>
              <p className="text-sm text-textSecondary">{formatNumber(usage?.plan?.monthlyInvoiceLimit)} invoices/month</p>
            </div>
          </div>

          {/* Upgrade Options */}
          <div>
            <h4 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">Upgrade Options</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-4 bg-bgPrimary rounded-lg hover:bg-bgPrimary/80 cursor-pointer transition-colors border border-border">
                <div>
                  <div className="text-sm font-semibold text-textPrimary">Pro Plan</div>
                  <div className="text-xs text-textSecondary">100 invoices/month</div>
                </div>
                <span className="text-sm font-semibold text-primary">₹299/mo</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-bgPrimary rounded-lg hover:bg-bgPrimary/80 cursor-pointer transition-colors border border-border">
                <div>
                  <div className="text-sm font-semibold text-textPrimary">Business Plan</div>
                  <div className="text-xs text-textSecondary">Unlimited invoices</div>
                </div>
                <span className="text-sm font-semibold text-primary">₹599/mo</span>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div>
            <h4 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">Pro Benefits</h4>
            <div className="space-y-2">
              {['More invoices per month', 'Priority support', 'Custom branding', 'Advanced reports'].map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-textPrimary">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button className="w-full py-3 bg-primary hover:bg-primaryHover text-white rounded-xl font-semibold text-sm shadow-sm transition-colors">
            Upgrade Now
          </button>
          <button onClick={onClose} className="w-full py-2 text-sm text-textSecondary hover:text-textPrimary transition-colors">
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  )
}
