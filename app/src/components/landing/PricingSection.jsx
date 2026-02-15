import { useHistory } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Check, ArrowRight, Sparkles } from 'lucide-react'
import { plansApi } from '../../lib/api'

function PricingSection() {
  const history = useHistory()

  const { data: plansData, isLoading } = useQuery({
    queryKey: ['plans', 'public'],
    queryFn: async () => {
      const response = await plansApi.listPublic()
      return response.data.data || response.data || []
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  // Map API plans to display format
  const plans = (plansData || []).map((plan) => {
    const entitlements = plan.entitlements || {}
    const isFree = !plan.priceMonthly || plan.priceMonthly === 0
    const isPro = plan.name === 'pro'
    const isStarter = plan.name === 'starter'

    // Build features list from entitlements
    const features = []
    
    if (entitlements.monthlyInvoicesLimit) {
      if (entitlements.monthlyInvoicesLimit === -1) {
        features.push('Unlimited invoices')
      } else {
        features.push(`${entitlements.monthlyInvoicesLimit} invoices/month`)
      }
    }
    
    if (entitlements.customersLimit) {
      if (entitlements.customersLimit === -1) {
        features.push('Unlimited customers')
      } else {
        features.push(`${entitlements.customersLimit} customers`)
      }
    }
    
    if (entitlements.productsLimit) {
      if (entitlements.productsLimit === -1) {
        features.push('Unlimited products')
      } else {
        features.push(`${entitlements.productsLimit} products`)
      }
    }
    
    if (entitlements.templatesLimit) {
      if (entitlements.templatesLimit === -1) {
        features.push('All premium templates')
      } else if (entitlements.templatesLimit === 1) {
        features.push('1 template')
      } else {
        features.push(`${entitlements.templatesLimit} templates`)
      }
    }
    
    if (entitlements.customTemplates) {
      features.push('Full template customization')
    }
    
    if (entitlements.prioritySupport) {
      features.push('Priority support')
    }
    
    if (entitlements.advancedReports) {
      features.push('Advanced reports & analytics')
    }
    
    if (entitlements.exportCsv) {
      features.push('Export to CSV')
    }

    // Add basic features for free plan
    if (isFree) {
      features.push('PDF download', 'WhatsApp sharing', 'Offline drafts')
    }

    return {
      id: plan.id,
      name: plan.displayName || plan.name,
      price: isFree ? '₹0' : `₹${plan.priceMonthly}`,
      period: isFree ? 'forever' : 'per month',
      description: plan.description || '',
      features,
      cta: isFree ? 'Create Invoice Now' : 'Start Free Trial',
      primary: isPro,
      badge: isPro ? 'Most Popular' : isStarter ? 'Best Value' : null,
    }
  })

  return (
    <section id="pricing" className="py-16 sm:py-20 lg:py-24 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Pricing
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
            Start free, upgrade when you need more. No hidden fees, cancel anytime.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 sm:p-8 flex flex-col ${
                plan.primary
                  ? 'bg-white ring-2 ring-blue-500 shadow-2xl shadow-blue-500/10'
                  : 'bg-gray-800/50 border border-gray-700/50'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-blue-600/30">
                    <Sparkles className="w-3 h-3" />
                    {plan.badge}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-lg font-bold mb-3 ${plan.primary ? 'text-gray-900' : 'text-white'}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className={`text-4xl sm:text-5xl font-extrabold ${plan.primary ? 'text-gray-900' : 'text-white'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.primary ? 'text-gray-500' : 'text-gray-400'}`}>
                    /{plan.period}
                  </span>
                </div>
                <p className={`text-sm ${plan.primary ? 'text-gray-600' : 'text-gray-400'}`}>
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      plan.primary ? 'bg-blue-100' : 'bg-blue-500/10'
                    }`}>
                      <Check className={`w-3 h-3 ${plan.primary ? 'text-blue-600' : 'text-blue-400'}`} />
                    </div>
                    <span className={`text-sm ${plan.primary ? 'text-gray-700' : 'text-gray-300'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => history.push('/demo')}
                className={`w-full flex items-center justify-center gap-2 font-semibold text-sm sm:text-base py-3 sm:py-3.5 rounded-xl transition-all ${
                  plan.primary
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40'
                    : 'bg-white/10 hover:bg-white/15 text-white border border-gray-600 hover:border-gray-500'
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default PricingSection
