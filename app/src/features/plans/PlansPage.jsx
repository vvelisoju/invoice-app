import { useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Loader2,
  CheckCircle2,
  Crown,
  Zap,
  Shield,
  ArrowLeft,
  AlertTriangle,
  Receipt,
  Eye,
  Download,
  Printer,
  Share2,
  MessageCircle,
  XCircle,
  CalendarClock,
  RefreshCw,
  CreditCard
} from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import { plansApi } from '../../lib/api'
import { PageToolbar } from '../../components/data-table'
import { downloadPDF, sharePDF, printPDF } from '../invoices/utils/pdfGenerator.jsx'
import SubscriptionInvoicePdf from './SubscriptionInvoicePdf'
const PdfViewer = lazy(() => import('../../components/MobilePdfViewer'))

const PLANS_TABS = [
  { key: 'plans', label: 'Plans & Pricing', mobileLabel: 'Plans', icon: Crown },
  { key: 'billing', label: 'Billing History', mobileLabel: 'Billing', icon: Receipt },
]

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

// ── Billing History Tab ──────────────────────────────────────────────
const STATUS_COLORS = {
  PAID: 'text-green-600 bg-green-50 border-green-200',
  PENDING: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  FAILED: 'text-red-600 bg-red-50 border-red-200',
  REFUNDED: 'text-gray-600 bg-gray-50 border-gray-200',
  CANCELLED: 'text-gray-500 bg-gray-50 border-gray-200',
}

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0.00'
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Invoice detail view — PDF viewer like InvoiceDetailPage
function BillingInvoiceDetail({ invoice, onBack }) {
  const [pdfUrl, setPdfUrl] = useState(null)
  const [pdfBlob, setPdfBlob] = useState(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  // Generate PDF on mount
  useEffect(() => {
    let cancelled = false
    const generate = async () => {
      if (!invoice) return
      setIsGeneratingPdf(true)
      try {
        const blob = await pdf(<SubscriptionInvoicePdf invoice={invoice} />).toBlob()
        if (cancelled) return
        setPdfBlob(blob)
        const url = URL.createObjectURL(blob)
        setPdfUrl(url)
      } catch (err) {
        console.error('Subscription invoice PDF generation failed:', err)
      } finally {
        if (!cancelled) setIsGeneratingPdf(false)
      }
    }
    generate()
    return () => {
      cancelled = true
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    }
  }, [invoice])

  const handleDownload = useCallback(async () => {
    if (!pdfBlob || !invoice) return
    try {
      await downloadPDF(pdfBlob, `Subscription-Invoice-${invoice.invoiceNumber}.pdf`)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }, [pdfBlob, invoice])

  const handlePrint = useCallback(async () => {
    if (!pdfBlob || !invoice) return
    try {
      await printPDF(pdfBlob, `Subscription-Invoice-${invoice.invoiceNumber}.pdf`)
    } catch (err) {
      console.error('Print failed:', err)
    }
  }, [pdfBlob, invoice])

  const handleShare = useCallback(async () => {
    if (!pdfBlob || !invoice) return
    try {
      await sharePDF(pdfBlob, `Subscription-Invoice-${invoice.invoiceNumber}.pdf`, {
        title: `Invoice ${invoice.invoiceNumber}`,
        text: `Subscription Invoice ${invoice.invoiceNumber}\nAmount: ₹${Number(invoice.total).toLocaleString('en-IN')}`,
      })
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Share failed:', err)
    }
  }, [pdfBlob, invoice])

  const handleWhatsAppShare = useCallback(async () => {
    if (!pdfBlob || !invoice) return
    try {
      await sharePDF(pdfBlob, `Subscription-Invoice-${invoice.invoiceNumber}.pdf`, {
        title: `Invoice ${invoice.invoiceNumber}`,
        text: `Subscription Invoice ${invoice.invoiceNumber}\nAmount: ₹${Number(invoice.total).toLocaleString('en-IN')}\nDate: ${formatDate(invoice.createdAt)}`,
      })
    } catch (err) {
      if (err.name !== 'AbortError') console.error('WhatsApp share failed:', err)
    }
  }, [pdfBlob, invoice])

  return (
    <div className="h-full flex flex-col">
      {/* Top Bar — same as InvoiceDetailPage */}
      <div className="px-3 md:px-6 py-2 md:py-3 border-b border-border bg-white shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onBack}
              className="w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-lg active:bg-bgPrimary md:hover:bg-bgPrimary text-textSecondary shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm md:text-base font-bold text-textPrimary truncate">{invoice.invoiceNumber}</h1>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full shrink-0 ${STATUS_COLORS[invoice.status] || STATUS_COLORS.PENDING}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${invoice.status === 'PAID' ? 'bg-green-500' : invoice.status === 'PENDING' ? 'bg-yellow-500' : 'bg-gray-400'}`} />
                  {invoice.status}
                </span>
              </div>
              <span className="text-xs text-textSecondary">{formatDate(invoice.createdAt)}</span>
            </div>
          </div>

          {/* Desktop action buttons */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleWhatsAppShare}
              disabled={!pdfBlob}
              className="md:px-3 md:py-1.5 text-sm font-medium text-[#25D366] hover:bg-green-50 rounded-lg border border-[#25D366]/30 transition-colors flex items-center gap-1.5 disabled:opacity-40"
              title="WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden lg:inline">WhatsApp</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={!pdfBlob}
              className="md:px-3 md:py-1.5 text-sm font-medium text-textSecondary hover:bg-bgPrimary rounded-lg border border-border transition-colors flex items-center gap-1.5 disabled:opacity-40"
              title="Download"
            >
              <Download className="w-4 h-4" />
              <span className="hidden lg:inline">Download</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={!pdfBlob}
              className="md:px-3 md:py-1.5 text-sm font-medium text-textSecondary hover:bg-bgPrimary rounded-lg border border-border transition-colors flex items-center gap-1.5 disabled:opacity-40"
              title="Print"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden lg:inline">Print</span>
            </button>
            <button
              onClick={handleShare}
              disabled={!pdfBlob}
              className="md:px-3 md:py-1.5 text-sm font-medium text-textSecondary hover:bg-bgPrimary rounded-lg border border-border transition-colors flex items-center gap-1.5 disabled:opacity-40"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden lg:inline">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Action Bar — horizontal scroll, below header */}
      <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-border bg-white overflow-x-auto no-scrollbar shrink-0">
        <button
          onClick={handleWhatsAppShare}
          disabled={!pdfBlob}
          className="px-3 py-2 text-xs font-medium text-[#25D366] active:bg-green-50 rounded-lg border border-[#25D366]/30 flex items-center gap-1.5 shrink-0 disabled:opacity-40"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp
        </button>
        <button
          onClick={handleDownload}
          disabled={!pdfBlob}
          className="px-3 py-2 text-xs font-medium text-textSecondary active:bg-bgPrimary rounded-lg border border-border flex items-center gap-1.5 shrink-0 disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
        <button
          onClick={handlePrint}
          disabled={!pdfBlob}
          className="px-3 py-2 text-xs font-medium text-textSecondary active:bg-bgPrimary rounded-lg border border-border flex items-center gap-1.5 shrink-0 disabled:opacity-40"
        >
          <Printer className="w-3.5 h-3.5" />
          Print
        </button>
        <button
          onClick={handleShare}
          disabled={!pdfBlob}
          className="px-3 py-2 text-xs font-medium text-textSecondary active:bg-bgPrimary rounded-lg border border-border flex items-center gap-1.5 shrink-0 disabled:opacity-40"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>
      </div>

      {/* PDF Viewer Area — fills remaining space */}
      <div className="flex-1 bg-gray-100 pb-mobile-nav">
        {isGeneratingPdf ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-textSecondary">Generating PDF preview...</p>
          </div>
        ) : pdfBlob ? (
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <p className="text-xs text-textSecondary">Loading viewer...</p>
            </div>
          }>
            <PdfViewer blob={pdfBlob} className="w-full h-full" />
          </Suspense>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-sm text-textSecondary">PDF preview unavailable</p>
          </div>
        )}
      </div>
    </div>
  )
}

function BillingHistoryTab() {
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['plans', 'billing-history'],
    queryFn: async () => {
      const res = await plansApi.getBillingHistory()
      return res.data.data || res.data || []
    }
  })

  // Show invoice detail view
  if (selectedInvoice) {
    return <BillingInvoiceDetail invoice={selectedInvoice} onBack={() => setSelectedInvoice(null)} />
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-border shadow-sm p-8 md:p-12 text-center">
          <Receipt className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-textPrimary mb-1">No billing history</h3>
          <p className="text-xs text-textSecondary max-w-sm mx-auto">
            Invoices will appear here after you subscribe to a paid plan.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 md:px-6 md:py-4 border-b border-border flex items-center gap-2.5">
            <Receipt className="w-4 h-4 text-textSecondary" />
            <h3 className="text-xs md:text-sm font-semibold text-textPrimary">
              {invoices.length} Invoice{invoices.length !== 1 ? 's' : ''}
            </h3>
          </div>
          <div className="divide-y divide-border">
            {invoices.map(inv => (
              <button
                key={inv.id}
                onClick={() => setSelectedInvoice(inv)}
                className="w-full flex items-center justify-between px-4 py-3.5 md:px-6 md:py-4 active:bg-gray-50 md:hover:bg-gray-50 transition-colors text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-mono font-semibold text-textPrimary">{inv.invoiceNumber}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${STATUS_COLORS[inv.status] || STATUS_COLORS.PENDING}`}>
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-xs text-textSecondary">
                    {formatDate(inv.createdAt)} · <span className="capitalize">{inv.billingPeriod || '—'}</span>
                    {inv.periodStart && inv.periodEnd && (
                      <span className="hidden md:inline"> · {formatDate(inv.periodStart)} — {formatDate(inv.periodEnd)}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm md:text-base font-bold text-textPrimary">{formatCurrency(inv.total)}</span>
                  <Eye className="w-4 h-4 text-gray-300" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PlansPage() {
  const history = useHistory()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [processingPlan, setProcessingPlan] = useState(null)
  const [billingPeriod, setBillingPeriod] = useState('yearly') // 'monthly' or 'yearly'
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search)
    const tab = params.get('tab')
    return tab && PLANS_TABS.some(t => t.key === tab) ? tab : 'plans'
  })
  const tabsRef = useRef(null)

  const { data: planUsage, isLoading: usageLoading } = useQuery({
    queryKey: ['plans', 'usage'],
    queryFn: async () => {
      const response = await plansApi.getUsage()
      return response.data.data || response.data
    }
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
        description: `${selectedPlan?.displayName || 'Plan'} - ${order.billingPeriod === 'yearly' ? 'Yearly' : 'Monthly'} Subscription`,
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
            queryClient.invalidateQueries(['plans', 'subscription'])
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

  // Cancel subscription
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await plansApi.cancelSubscription({ reason: 'user_requested' })
      return res.data.data || res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['plans', 'usage'])
      queryClient.invalidateQueries(['plans', 'subscription'])
      setShowCancelConfirm(false)
    },
    onError: (err) => {
      alert(err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to cancel subscription.')
    }
  })

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
      {/* Mobile Header */}
      <div className="md:hidden px-3 py-2 border-b border-border bg-white shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => history.push('/settings')}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-textSecondary active:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-bold text-textPrimary">Plans & Billing</h1>
          </div>
        </div>
      </div>

      {/* Mobile Tab Bar — scrollable, like Settings */}
      <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-border bg-white overflow-x-auto no-scrollbar shrink-0">
        {PLANS_TABS.map((tab) => {
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                active
                  ? 'text-primary bg-blue-50 border border-blue-200'
                  : 'text-textSecondary active:text-textPrimary active:bg-gray-50 border border-border'
              }`}
            >
              <tab.icon className={`w-3.5 h-3.5 ${active ? 'text-primary' : 'text-gray-400'}`} />
              {tab.mobileLabel}
            </button>
          )
        })}
      </div>

      {/* Desktop Header — full PageToolbar with tabs */}
      <div className="hidden md:block">
        <PageToolbar
          title="Plans & Billing"
          subtitle="Simple pricing for your business"
          actions={
            <button
              onClick={() => history.push('/settings')}
              className="px-3 py-2 text-sm font-medium text-textSecondary md:hover:text-textPrimary md:hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Settings
            </button>
          }
        >
          {/* Tab Navigation — Desktop */}
          <div className="relative mt-2">
            <div
              ref={tabsRef}
              className="flex items-center gap-1 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar"
            >
              {PLANS_TABS.map((tab) => {
                const active = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                      active
                        ? 'text-primary bg-blue-50 border border-blue-100 shadow-sm'
                        : 'text-textSecondary hover:text-textPrimary hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <tab.icon className={`w-4 h-4 ${active ? 'text-primary' : 'text-gray-400'}`} />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>
        </PageToolbar>
      </div>

      {/* Content Area */}
      {activeTab === 'plans' && (
        <div className="flex-1 px-3 py-4 md:px-8 md:py-6 pb-mobile-nav overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-5 md:space-y-8">

            {/* Current Usage — compact on mobile */}
            <div className="bg-white rounded-xl border border-border shadow-sm p-4 md:p-6">
              <div className="flex items-start justify-between mb-3 md:mb-4 gap-2">
                <div className="min-w-0">
                  <h2 className="text-base md:text-lg font-semibold text-textPrimary">
                    Current Plan: {currentPlanName}
                  </h2>
                  {subscription?.status === 'ACTIVE' && !subscription?.cancelledAt && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1 flex-wrap">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      Active
                      {subscription?.billingPeriod && (
                        <span className="text-textSecondary capitalize">· {subscription.billingPeriod}</span>
                      )}
                      {subscription?.renewAt && (
                        <span className="text-textSecondary">
                          · Renews {new Date(subscription.renewAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </p>
                  )}
                  {subscription?.status === 'ACTIVE' && subscription?.cancelledAt && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1 flex-wrap">
                      <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                      Cancelling
                      {subscription?.renewAt && (
                        <span className="text-textSecondary">
                          · Active until {new Date(subscription.renewAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </p>
                  )}
                  {(subscription?.status === 'EXPIRED' || subscription?.status === 'CANCELLED') && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      {subscription.status === 'EXPIRED' ? 'Expired' : 'Cancelled'}
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

            {/* Subscription Management — only show for active paid subscriptions */}
            {subscription?.status === 'ACTIVE' && subscription?.amount > 0 && (
              <div className="bg-white rounded-xl border border-border shadow-sm p-4 md:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-4 h-4 text-textSecondary" />
                  <h3 className="text-xs md:text-sm font-semibold text-textPrimary">Subscription Management</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] text-textSecondary mb-0.5">Billing</p>
                    <p className="text-xs md:text-sm font-semibold text-textPrimary capitalize">{subscription.billingPeriod || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] text-textSecondary mb-0.5">Amount</p>
                    <p className="text-xs md:text-sm font-semibold text-textPrimary">₹{Number(subscription.amount || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] text-textSecondary mb-0.5">Started</p>
                    <p className="text-xs md:text-sm font-semibold text-textPrimary">
                      {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] text-textSecondary mb-0.5">{subscription.cancelledAt ? 'Expires' : 'Renews'}</p>
                    <p className="text-xs md:text-sm font-semibold text-textPrimary">
                      {subscription.renewAt ? new Date(subscription.renewAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {!subscription.cancelledAt ? (
                    <>
                      <button
                        onClick={() => handleSubscribe(currentPlanId)}
                        disabled={!!processingPlan}
                        className="px-3 py-2 text-xs font-medium text-primary active:bg-blue-50 md:hover:bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Renew Now
                      </button>
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        className="px-3 py-2 text-xs font-medium text-red-600 active:bg-red-50 md:hover:bg-red-50 rounded-lg border border-red-200 flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel Subscription
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <CalendarClock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <p className="text-xs text-amber-700">
                        Your subscription will remain active until{' '}
                        <span className="font-semibold">
                          {subscription.renewAt ? new Date(subscription.renewAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'end of period'}
                        </span>
                        . After that, you'll be moved to the Free plan.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                <div>
                  <p className="text-xs md:text-sm font-medium text-textPrimary">How do I cancel my subscription?</p>
                  <p className="text-[11px] md:text-xs text-textSecondary mt-0.5">You can cancel anytime from the Subscription Management section above. Your plan stays active until the end of the current billing period — no partial refunds.</p>
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-textPrimary">What happens after cancellation?</p>
                  <p className="text-[11px] md:text-xs text-textSecondary mt-0.5">After your billing period ends, you'll be moved to the Free plan. Your data is never deleted — you can re-subscribe anytime.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing History Tab */}
      {activeTab === 'billing' && (
        <div className="flex-1 px-3 py-4 md:px-8 md:py-6 pb-mobile-nav overflow-y-auto">
          <BillingHistoryTab />
        </div>
      )}

      {/* Cancel Subscription Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowCancelConfirm(false)}>
          <div
            className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-bold text-textPrimary">Cancel Subscription?</h3>
                <p className="text-xs text-textSecondary mt-0.5">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-amber-800">
                Your <span className="font-semibold">{currentPlanName}</span> plan will remain active until{' '}
                <span className="font-semibold">
                  {subscription?.renewAt
                    ? new Date(subscription.renewAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'the end of your billing period'}
                </span>
                . After that, you'll be moved to the Free plan with limited features.
              </p>
            </div>

            <div className="space-y-1.5 mb-5">
              <p className="text-xs text-textSecondary">After cancellation:</p>
              <ul className="text-xs text-textSecondary space-y-1 ml-3">
                <li className="flex items-start gap-1.5">
                  <span className="text-red-400 mt-0.5">•</span>
                  Invoice limit will drop to 10/month
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-400 mt-0.5">•</span>
                  Template access will be limited
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-green-500 mt-0.5">•</span>
                  Your existing data will be preserved
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-green-500 mt-0.5">•</span>
                  You can re-subscribe anytime
                </li>
              </ul>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2.5 text-xs md:text-sm font-semibold text-textPrimary bg-gray-100 active:bg-gray-200 md:hover:bg-gray-200 rounded-lg transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="flex-1 py-2.5 text-xs md:text-sm font-semibold text-white bg-red-600 active:bg-red-700 md:hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {cancelMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Yes, Cancel'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
