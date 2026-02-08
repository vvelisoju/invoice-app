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
  AlertTriangle,
  Receipt,
  Eye,
  X
} from 'lucide-react'
import Portal from '../../components/Portal'
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

// ── Billing History Section ─────────────────────────────────────────
function BillingHistorySection() {
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['plans', 'billing-history'],
    queryFn: async () => {
      const res = await plansApi.getBillingHistory()
      return res.data.data || res.data || []
    }
  })

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0.00'
    return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const statusColor = {
    PAID: 'text-green-600 bg-green-50 border-green-200',
    PENDING: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    FAILED: 'text-red-600 bg-red-50 border-red-200',
    REFUNDED: 'text-gray-600 bg-gray-50 border-gray-200',
    CANCELLED: 'text-gray-500 bg-gray-50 border-gray-200',
  }

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-4 md:p-6">
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        <Receipt className="w-4 h-4 text-textSecondary" />
        <h3 className="text-xs md:text-sm font-semibold text-textPrimary uppercase tracking-wider">Billing History</h3>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-6">
          <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-textSecondary">No invoices yet</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Invoices will appear here after you subscribe to a plan</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map(inv => (
            <button
              key={inv.id}
              onClick={() => setSelectedInvoice(inv)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-mono font-medium text-textPrimary">{inv.invoiceNumber}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${statusColor[inv.status] || statusColor.PENDING}`}>
                    {inv.status}
                  </span>
                </div>
                <p className="text-[11px] text-textSecondary">
                  {formatDate(inv.createdAt)} · <span className="capitalize">{inv.billingPeriod || '—'}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-bold text-textPrimary">{formatCurrency(inv.total)}</span>
                <Eye className="w-3.5 h-3.5 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedInvoice(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto">
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-textPrimary">Invoice Details</h3>
                    <p className="text-xs text-textSecondary font-mono mt-0.5">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <button onClick={() => setSelectedInvoice(null)} className="p-1 rounded-lg hover:bg-gray-100">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-gray-400 text-[10px]">Date</p>
                    <p className="font-semibold text-textPrimary">{formatDate(selectedInvoice.createdAt)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-gray-400 text-[10px]">Period</p>
                    <p className="font-semibold text-textPrimary capitalize">{selectedInvoice.billingPeriod || '—'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-gray-400 text-[10px]">From</p>
                    <p className="font-semibold text-textPrimary">{formatDate(selectedInvoice.periodStart)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-gray-400 text-[10px]">To</p>
                    <p className="font-semibold text-textPrimary">{formatDate(selectedInvoice.periodEnd)}</p>
                  </div>
                </div>

                {/* Seller */}
                <div className="text-xs">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">From</p>
                  <p className="font-semibold text-textPrimary">{selectedInvoice.sellerName}</p>
                  {selectedInvoice.sellerGstin && <p className="text-textSecondary">GSTIN: {selectedInvoice.sellerGstin}</p>}
                  {selectedInvoice.sellerAddress && <p className="text-textSecondary">{selectedInvoice.sellerAddress}</p>}
                </div>

                {/* Amounts */}
                <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-textSecondary text-xs">Subtotal</span>
                    <span className="font-medium text-textPrimary text-xs">{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  {selectedInvoice.taxBreakup?.cgstAmount != null && (
                    <>
                      <div className="flex justify-between text-xs">
                        <span className="text-textSecondary">CGST ({selectedInvoice.taxBreakup.cgstRate}%)</span>
                        <span className="text-textPrimary">{formatCurrency(selectedInvoice.taxBreakup.cgstAmount)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-textSecondary">SGST ({selectedInvoice.taxBreakup.sgstRate}%)</span>
                        <span className="text-textPrimary">{formatCurrency(selectedInvoice.taxBreakup.sgstAmount)}</span>
                      </div>
                    </>
                  )}
                  {selectedInvoice.taxBreakup?.igstAmount != null && (
                    <div className="flex justify-between text-xs">
                      <span className="text-textSecondary">IGST ({selectedInvoice.taxBreakup.igstRate}%)</span>
                      <span className="text-textPrimary">{formatCurrency(selectedInvoice.taxBreakup.igstAmount)}</span>
                    </div>
                  )}
                  {Number(selectedInvoice.taxTotal) > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-textSecondary">Tax</span>
                      <span className="font-medium text-textPrimary">{formatCurrency(selectedInvoice.taxTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-100 pt-2">
                    <span className="font-semibold text-textPrimary text-sm">Total</span>
                    <span className="font-bold text-textPrimary">{formatCurrency(selectedInvoice.total)}</span>
                  </div>
                </div>

                {/* Payment ref */}
                {selectedInvoice.razorpayPaymentId && (
                  <div className="bg-gray-50 rounded-lg p-2.5 text-[11px] text-textSecondary">
                    <span className="text-gray-400">Payment ID:</span> {selectedInvoice.razorpayPaymentId}
                  </div>
                )}

                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="w-full py-2 text-sm font-medium text-textSecondary bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
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
        name: 'Invoice Baba',
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
      alert(err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to create order. Please try again.')
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
        mobileActions={
          <button
            onClick={() => history.push('/settings')}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-textSecondary active:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        }
        actions={
          <button
            onClick={() => history.push('/settings')}
            className="px-3 py-2 text-sm font-medium text-textSecondary md:hover:text-textPrimary md:hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </button>
        }
      />

      <div className="flex-1 px-3 py-4 md:px-8 md:py-6 pb-mobile-nav overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-5 md:space-y-8">

          {/* Current Usage — compact on mobile */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-4 md:p-6">
            <div className="flex items-start justify-between mb-3 md:mb-4 gap-2">
              <div className="min-w-0">
                <h2 className="text-base md:text-lg font-semibold text-textPrimary">
                  Current Plan: {currentPlanName}
                </h2>
                {subscription?.status === 'ACTIVE' && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1 flex-wrap">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    Active
                    {subscription?.renewAt && (
                      <span className="text-textSecondary">
                        · Renews {new Date(subscription.renewAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </p>
                )}
              </div>
              {isAtLimit && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-200 rounded-lg shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-[11px] font-medium text-red-600">Limit reached</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                <p className="text-[11px] md:text-xs text-textSecondary mb-1">Invoices Used</p>
                <p className="text-xl md:text-2xl font-bold text-textPrimary">
                  {used} <span className="text-xs md:text-sm font-normal text-textSecondary">/ {displayLimit}</span>
                </p>
                {!isUnlimited && (
                  <div className="w-full h-1.5 md:h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(percentage * 100, 100)}%` }} />
                  </div>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                <p className="text-[11px] md:text-xs text-textSecondary mb-1">Remaining</p>
                <p className="text-xl md:text-2xl font-bold text-textPrimary">
                  {isUnlimited ? '∞' : Math.max(0, limit - used)}
                </p>
                <p className="text-[11px] md:text-xs text-textSecondary mt-1">this month</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 md:p-4 col-span-2 md:col-span-1">
                <p className="text-[11px] md:text-xs text-textSecondary mb-1">Billing Period</p>
                <p className="text-xs md:text-sm font-medium text-textPrimary">
                  {usage?.periodStart ? new Date(usage.periodStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '—'}
                  {' — '}
                  {usage?.periodEnd ? new Date(usage.periodEnd).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </p>
                <p className="text-[11px] md:text-xs text-textSecondary mt-1">Monthly reset</p>
              </div>
            </div>
          </div>

          {/* Plan Cards */}
          <div>
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-xs md:text-sm font-semibold text-textSecondary uppercase tracking-wider">Choose Plan</h3>
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-2.5 md:px-3 py-1.5 text-[11px] md:text-xs font-semibold rounded-md transition-all ${billingPeriod === 'monthly' ? 'bg-white text-textPrimary shadow-sm' : 'text-textSecondary active:text-textPrimary md:hover:text-textPrimary'}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod('yearly')}
                  className={`px-2.5 md:px-3 py-1.5 text-[11px] md:text-xs font-semibold rounded-md transition-all ${billingPeriod === 'yearly' ? 'bg-white text-textPrimary shadow-sm' : 'text-textSecondary active:text-textPrimary md:hover:text-textPrimary'}`}
                >
                  Yearly <span className="text-green-600 ml-0.5">-33%</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
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
                    className={`relative bg-gradient-to-br ${cfg.gradient} rounded-xl border-2 ${isCurrent ? 'border-primary ring-2 ring-primary/20' : cfg.border} shadow-sm overflow-hidden transition-all md:hover:shadow-md flex flex-col`}
                  >
                    {cfg.popular && !isCurrent && (
                      <div className="absolute top-0 right-0">
                        <span className="px-2.5 py-0.5 md:px-3 md:py-1 text-[10px] font-bold text-white bg-amber-500 rounded-bl-lg uppercase tracking-wider">
                          Best Value
                        </span>
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute top-0 right-0">
                        <span className="px-2.5 py-0.5 md:px-3 md:py-1 text-[10px] font-bold text-white bg-primary rounded-bl-lg uppercase tracking-wider">
                          Current
                        </span>
                      </div>
                    )}

                    <div className="p-4 md:p-5 flex flex-col flex-1">
                      {/* Header + Price row on mobile */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center ${cfg.iconBg} shrink-0`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm md:text-base font-bold text-textPrimary">{plan.displayName || plan.name}</h4>
                            <p className="text-[11px] text-textSecondary leading-tight">{plan.description || ''}</p>
                          </div>
                        </div>
                        {/* Price inline on mobile */}
                        <div className="text-right shrink-0 md:hidden">
                          {isPaid ? (
                            billingPeriod === 'yearly' ? (
                              <>
                                <p className="text-lg font-bold text-textPrimary">₹{yearlyMonthly}<span className="text-[11px] font-normal text-textSecondary">/mo</span></p>
                                <p className="text-[10px] text-green-600 font-medium">₹{yearlyPrice}/yr</p>
                              </>
                            ) : (
                              <p className="text-lg font-bold text-textPrimary">₹{monthlyPrice}<span className="text-[11px] font-normal text-textSecondary">/mo</span></p>
                            )
                          ) : (
                            <p className="text-lg font-bold text-textPrimary">Free</p>
                          )}
                        </div>
                      </div>

                      {/* Price — desktop only */}
                      <div className="mb-3 hidden md:block">
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
                              <p className="text-[11px] text-textSecondary mt-0.5">Billed monthly</p>
                            </div>
                          )
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-textPrimary">Free</span>
                            <span className="text-sm text-textSecondary">forever</span>
                          </div>
                        )}
                      </div>

                      {/* Features — horizontal on mobile, vertical on desktop */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1.5 md:flex-col md:gap-x-0 md:space-y-2 mb-4 md:mb-5 flex-1">
                        {cfg.features.map((feat, i) => (
                          <div key={i} className="flex items-center gap-1.5 md:gap-2">
                            <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-green-500 shrink-0" />
                            <span className="text-xs md:text-sm text-textPrimary">{feat}</span>
                          </div>
                        ))}
                      </div>

                      {/* Button */}
                      {isCurrent ? (
                        <button
                          disabled
                          className="w-full py-2 md:py-2.5 rounded-lg font-semibold text-xs md:text-sm bg-gray-100 text-gray-400 cursor-default"
                        >
                          Current Plan
                        </button>
                      ) : isPaid ? (
                        <button
                          onClick={() => handleSubscribe(plan.id)}
                          disabled={isProcessing}
                          className="w-full py-2 md:py-2.5 rounded-lg font-semibold text-xs md:text-sm bg-primary active:bg-primaryHover md:hover:bg-primaryHover text-white shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 md:w-4 md:h-4" />
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
                          className="w-full py-2 md:py-2.5 rounded-lg font-semibold text-xs md:text-sm bg-gray-100 text-gray-400 cursor-default"
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

          {/* Billing History */}
          <BillingHistorySection />

          {/* FAQ — compact */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-4 md:p-6">
            <h3 className="text-xs md:text-sm font-semibold text-textPrimary mb-2 md:mb-3">Frequently Asked Questions</h3>
            <div className="space-y-2 md:space-y-3">
              <div>
                <p className="text-xs md:text-sm font-medium text-textPrimary">How does billing work?</p>
                <p className="text-[11px] md:text-xs text-textSecondary mt-0.5">You pay via Razorpay. Your plan stays active for the billing period from the date of payment.</p>
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-textPrimary">What happens when I reach my limit?</p>
                <p className="text-[11px] md:text-xs text-textSecondary mt-0.5">You won't be able to issue new invoices until the next month or until you upgrade.</p>
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-textPrimary">Can I upgrade anytime?</p>
                <p className="text-[11px] md:text-xs text-textSecondary mt-0.5">Yes! Upgrade at any time and your new plan takes effect immediately.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
