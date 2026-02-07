import { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Loader2,
  CheckCircle2,
  Crown,
  Zap,
  FileText,
  Shield,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react'
import { plansApi } from '../../lib/api'
import { PageToolbar } from '../../components/data-table'

const PLAN_CONFIG = {
  free: {
    icon: Shield,
    gradient: 'from-gray-50 to-slate-50',
    border: 'border-gray-200',
    iconBg: 'bg-gray-100 text-gray-600',
    features: ['10 invoices/month', '20 customers', '20 products', '1 template'],
  },
  starter: {
    icon: Zap,
    gradient: 'from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100 text-blue-600',
    features: ['200 invoices/month', '500 customers', '200 products', '3 templates'],
  },
  pro: {
    icon: Crown,
    gradient: 'from-amber-50 to-orange-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100 text-amber-600',
    features: ['Unlimited invoices', 'Unlimited customers', 'Unlimited products', '10 templates'],
    popular: true,
  }
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function PlansPage() {
  const history = useHistory()
  const queryClient = useQueryClient()
  const [processingPlan, setProcessingPlan] = useState(null)
  const [billingPeriod, setBillingPeriod] = useState('yearly') // 'monthly' or 'yearly'

  const { data: planUsage, isLoading: usageLoading } = useQuery({
    queryKey: ['plans', 'usage'],
    queryFn: async () => {
      const response = await plansApi.getUsage()
      return response.data.data || response.data
    },
    staleTime: 0,
    refetchOnMount: 'always'
  })

  const { data: availablePlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['plans', 'list'],
    queryFn: async () => {
      const response = await plansApi.list()
      return response.data.data || response.data || []
    }
  })

  const subscribeMutation = useMutation({
    mutationFn: async ({ planId, period }) => {
      const orderRes = await plansApi.createOrder({ planId, billingPeriod: period })
      const order = orderRes.data.data || orderRes.data
      return { order, planId }
    },
    onSuccess: async ({ order, planId }) => {
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        alert('Failed to load payment gateway. Please try again.')
        setProcessingPlan(null)
        return
      }

      const selectedPlan = availablePlans.find(p => p.id === planId)

      const options = {
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'InvoiceApp',
        description: `${selectedPlan?.displayName || 'Plan'} - Yearly Subscription`,
        order_id: order.razorpayOrderId,
        handler: async function (response) {
          try {
            await plansApi.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              planId
            })
            queryClient.invalidateQueries(['plans', 'usage'])
            queryClient.invalidateQueries(['plans', 'list'])
            setProcessingPlan(null)
          } catch (err) {
            alert('Payment verification failed. Please contact support.')
            setProcessingPlan(null)
          }
        },
        modal: {
          ondismiss: () => setProcessingPlan(null)
        },
        prefill: {},
        theme: { color: '#3B82F6' }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function () {
        alert('Payment failed. Please try again.')
        setProcessingPlan(null)
      })
      rzp.open()
    },
    onError: (err) => {
      alert(err?.response?.data?.message || 'Failed to create order. Please try again.')
      setProcessingPlan(null)
    }
  })

  const handleSubscribe = (planId) => {
    setProcessingPlan(planId)
    subscribeMutation.mutate({ planId, period: billingPeriod })
  }

  const currentPlanId = planUsage?.plan?.id
  const currentPlanName = planUsage?.plan?.name || 'Free'
  const usage = planUsage?.usage
  const limit = planUsage?.plan?.monthlyInvoiceLimit || 10
  const used = usage?.invoicesIssued || 0
  const isUnlimited = limit >= 999999
  const displayLimit = isUnlimited ? '∞' : limit
  const percentage = isUnlimited ? 0 : (limit > 0 ? used / limit : 0)
  const isNearLimit = !isUnlimited && percentage >= 0.8
  const isAtLimit = !isUnlimited && percentage >= 1
  const barColor = isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-primary'
  const subscription = planUsage?.subscription

  const isLoading = usageLoading || plansLoading

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  // Sort plans: free → starter → pro
  const sortedPlans = [...availablePlans].sort((a, b) => {
    const order = { free: 0, starter: 1, pro: 2 }
    return (order[a.name] ?? 99) - (order[b.name] ?? 99)
  })

  return (
    <div className="h-full flex flex-col">
      <PageToolbar
        title="Plans & Billing"
        subtitle="Simple pricing for your business"
        actions={
          <button
            onClick={() => history.push('/settings')}
            className="px-4 py-2 text-sm font-medium text-textSecondary hover:text-textPrimary hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </button>
        }
      />

      <div className="flex-1 px-8 py-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Current Usage */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-textPrimary">
                  Current Plan: {currentPlanName}
                </h2>
                {subscription?.status === 'ACTIVE' && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Active subscription
                    {subscription?.renewAt && (
                      <span className="text-textSecondary ml-1">
                        · Renews {new Date(subscription.renewAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </p>
                )}
              </div>
              {isAtLimit && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-medium text-red-600">Limit reached</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-textSecondary mb-1">Invoices Used</p>
                <p className="text-2xl font-bold text-textPrimary">
                  {used} <span className="text-sm font-normal text-textSecondary">/ {displayLimit}</span>
                </p>
                {!isUnlimited && (
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(percentage * 100, 100)}%` }} />
                  </div>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-textSecondary mb-1">Remaining</p>
                <p className="text-2xl font-bold text-textPrimary">
                  {isUnlimited ? '∞' : Math.max(0, limit - used)}
                </p>
                <p className="text-xs text-textSecondary mt-1">invoices this month</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-textSecondary mb-1">Billing Period</p>
                <p className="text-sm font-medium text-textPrimary">
                  {usage?.periodStart ? new Date(usage.periodStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '—'}
                  {' — '}
                  {usage?.periodEnd ? new Date(usage.periodEnd).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </p>
                <p className="text-xs text-textSecondary mt-1">Monthly reset</p>
              </div>
            </div>
          </div>

          {/* Plan Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-textSecondary uppercase tracking-wider">Choose Your Plan</h3>
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${billingPeriod === 'monthly' ? 'bg-white text-textPrimary shadow-sm' : 'text-textSecondary hover:text-textPrimary'}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod('yearly')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${billingPeriod === 'yearly' ? 'bg-white text-textPrimary shadow-sm' : 'text-textSecondary hover:text-textPrimary'}`}
                >
                  Yearly <span className="text-green-600 ml-1">Save 33%</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {sortedPlans.filter(p => p.active !== false).map((plan) => {
                const planKey = plan.name?.toLowerCase() || 'free'
                const cfg = PLAN_CONFIG[planKey] || PLAN_CONFIG.free
                const isCurrent = plan.id === currentPlanId || (!currentPlanId && planKey === 'free')
                const isProcessing = processingPlan === plan.id
                const monthlyPrice = Number(plan.priceMonthly) || 0
                const yearlyPrice = Number(plan.priceYearly) || 0
                const yearlyMonthly = yearlyPrice > 0 ? Math.round(yearlyPrice / 12) : 0
                const savingsPercent = monthlyPrice > 0 ? Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100) : 0
                const isPaid = monthlyPrice > 0
                const IconComp = cfg.icon

                return (
                  <div
                    key={plan.id}
                    className={`relative bg-gradient-to-br ${cfg.gradient} rounded-xl border-2 ${isCurrent ? 'border-primary ring-2 ring-primary/20' : cfg.border} shadow-sm overflow-hidden transition-all hover:shadow-md flex flex-col`}
                  >
                    {cfg.popular && !isCurrent && (
                      <div className="absolute top-0 right-0">
                        <span className="px-3 py-1 text-[10px] font-bold text-white bg-amber-500 rounded-bl-lg uppercase tracking-wider">
                          Best Value
                        </span>
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute top-0 right-0">
                        <span className="px-3 py-1 text-[10px] font-bold text-white bg-primary rounded-bl-lg uppercase tracking-wider">
                          Current
                        </span>
                      </div>
                    )}

                    <div className="p-5 flex flex-col flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cfg.iconBg}`}>
                          <IconComp className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-textPrimary">{plan.displayName || plan.name}</h4>
                          <p className="text-[11px] text-textSecondary">{plan.description || ''}</p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="mb-4">
                        {isPaid ? (
                          billingPeriod === 'yearly' ? (
                            <div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-textPrimary">₹{yearlyMonthly}</span>
                                <span className="text-sm text-textSecondary">/month</span>
                              </div>
                              <p className="text-[11px] text-green-600 font-medium mt-0.5">
                                ₹{yearlyPrice}/year — Save {savingsPercent}%
                              </p>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-textPrimary">₹{monthlyPrice}</span>
                                <span className="text-sm text-textSecondary">/month</span>
                              </div>
                              <p className="text-[11px] text-textSecondary mt-0.5">
                                Billed monthly
                              </p>
                            </div>
                          )
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-textPrimary">Free</span>
                            <span className="text-sm text-textSecondary">forever</span>
                          </div>
                        )}
                      </div>

                      {/* Features */}
                      <div className="space-y-2 mb-5 flex-1">
                        {cfg.features.map((feat, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            <span className="text-sm text-textPrimary">{feat}</span>
                          </div>
                        ))}
                      </div>

                      {/* Button */}
                      {isCurrent ? (
                        <button
                          disabled
                          className="w-full py-2.5 rounded-lg font-semibold text-sm bg-gray-100 text-gray-400 cursor-default"
                        >
                          Current Plan
                        </button>
                      ) : isPaid ? (
                        <button
                          onClick={() => handleSubscribe(plan.id)}
                          disabled={isProcessing}
                          className="w-full py-2.5 rounded-lg font-semibold text-sm bg-primary hover:bg-primaryHover text-white shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4" />
                              {billingPeriod === 'yearly'
                                ? `Subscribe — ₹${yearlyPrice}/yr`
                                : `Subscribe — ₹${monthlyPrice}/mo`
                              }
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full py-2.5 rounded-lg font-semibold text-sm bg-gray-100 text-gray-400 cursor-default"
                        >
                          Free Forever
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-6">
            <h3 className="text-sm font-semibold text-textPrimary mb-3">Frequently Asked Questions</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-textPrimary">How does billing work?</p>
                <p className="text-xs text-textSecondary mt-0.5">You pay once per year via Razorpay. Your plan stays active for 12 months from the date of payment.</p>
              </div>
              <div>
                <p className="text-sm font-medium text-textPrimary">What happens when I reach my limit?</p>
                <p className="text-xs text-textSecondary mt-0.5">You won't be able to issue new invoices until the next month or until you upgrade your plan.</p>
              </div>
              <div>
                <p className="text-sm font-medium text-textPrimary">Can I upgrade anytime?</p>
                <p className="text-xs text-textSecondary mt-0.5">Yes! You can upgrade at any time and your new plan takes effect immediately.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 bg-bgPrimary">
        <p className="text-xs text-textSecondary">&copy; 2026 InvoiceApp. All rights reserved.</p>
      </div>
    </div>
  )
}
