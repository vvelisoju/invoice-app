import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import {
  Share2,
  CheckCircle,
  XCircle,
  Pencil,
  Trash2,
  MoreVertical,
  Loader2,
  ArrowLeft,
  Printer,
  Download,
  Copy,
  Send,
  CreditCard,
  Ban,
  RotateCcw,
  MessageCircle,
  Plus,
  Palette
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoiceApi, templateApi, businessApi } from '../../lib/api'
import { generatePDF, downloadPDF } from './utils/pdfGenerator.jsx'
import TemplateSelectModal from './components/TemplateSelectModal'
import PlanLimitModal from '../../components/PlanLimitModal'
import { DOCUMENT_TYPE_DEFAULTS, getDocTypeConfig } from '../../config/documentTypeDefaults'
import Portal from '../../components/Portal'
const MobilePdfViewer = lazy(() => import('../../components/MobilePdfViewer'))

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  ISSUED: { label: 'Issued', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  PAID: { label: 'Paid', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400' },
  VOID: { label: 'Void', bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' }
}

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const history = useHistory()
  const queryClient = useQueryClient()
  const [showMoreActions, setShowMoreActions] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showStatusConfirm, setShowStatusConfirm] = useState(false)
  const [pendingStatus, setPendingStatus] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [pdfBlob, setPdfBlob] = useState(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [showPlanLimit, setShowPlanLimit] = useState(false)
  const [planLimitData, setPlanLimitData] = useState(null)

  // Fetch business profile to check enableStatusWorkflow
  const { data: businessProfile } = useQuery({
    queryKey: ['business'],
    queryFn: async () => {
      const response = await businessApi.getProfile()
      return response.data?.data || response.data
    }
  })
  const statusWorkflow = businessProfile?.enableStatusWorkflow || false

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const response = await invoiceApi.get(id)
      return response.data
    }
  })

  const { data: templateConfig } = useQuery({
    queryKey: ['templates', 'config'],
    queryFn: async () => {
      const response = await templateApi.getConfig()
      const data = response.data.data || response.data
      return data || null
    }
  })

  // Fetch base templates to resolve name from ID
  const { data: baseTemplates } = useQuery({
    queryKey: ['templates', 'base'],
    queryFn: async () => {
      const response = await templateApi.listBase()
      return response.data.data || response.data || []
    }
  })

  // Resolve the active template ID (name) from config
  useEffect(() => {
    if (!templateConfig?.baseTemplateId || !baseTemplates?.length) return
    const match = baseTemplates.find(bt => bt.id === templateConfig.baseTemplateId)
    if (match?.name && match.name !== selectedTemplateId) {
      setSelectedTemplateId(match.name)
    }
  }, [templateConfig, baseTemplates])

  // Generate PDF client-side when invoice data or template changes
  useEffect(() => {
    let cancelled = false
    const generate = async () => {
      if (!invoice) return
      setIsGeneratingPdf(true)
      try {
        const config = invoice.templateConfigSnapshot?.customConfig || templateConfig?.customConfig || null
        const templateId = selectedTemplateId || 'clean'
        // Resolve document type config and attach to invoice for PDF templates
        const docTypeConfig = getDocTypeConfig(invoice.documentType || 'invoice', businessProfile?.documentTypeConfig)
        const invoiceWithDocType = { ...invoice, docTypeConfig }
        const blob = await generatePDF(invoiceWithDocType, config, templateId)
        if (cancelled) return
        setPdfBlob(blob)
        const url = URL.createObjectURL(blob)
        setPdfUrl(url)
      } catch (err) {
        console.error('PDF generation failed:', err)
      } finally {
        if (!cancelled) setIsGeneratingPdf(false)
      }
    }
    generate()
    return () => {
      cancelled = true
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    }
  }, [invoice, templateConfig, selectedTemplateId])

  const issueMutation = useMutation({
    mutationFn: () => invoiceApi.issue(id, {
      templateBaseId: null,
      templateConfigSnapshot: null,
      templateVersion: null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: (err) => {
      const errorData = err.response?.data?.error
      if (errorData?.code === 'PLAN_LIMIT_REACHED' || errorData?.details?.code === 'PLAN_LIMIT_REACHED') {
        setPlanLimitData(errorData.details?.usage || errorData.usage)
        setShowPlanLimit(true)
      }
    }
  })

  const statusMutation = useMutation({
    mutationFn: ({ status }) => invoiceApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setShowStatusConfirm(false)
      setPendingStatus(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: () => invoiceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      history.replace('/invoices')
    }
  })

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const handleDownload = useCallback(async () => {
    if (!pdfBlob || !invoice) return
    try {
      await downloadPDF(pdfBlob, `Invoice-${invoice.invoiceNumber}.pdf`)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }, [pdfBlob, invoice])

  const handlePrint = useCallback(() => {
    if (!pdfBlob) return
    const url = URL.createObjectURL(pdfBlob)
    const printWindow = window.open(url, '_blank')
    if (printWindow) {
      printWindow.onload = () => printWindow.print()
    }
  }, [pdfBlob])

  const handleShare = useCallback(async () => {
    if (!pdfBlob || !invoice) return
    try {
      if (navigator.share && navigator.canShare) {
        const file = new File([pdfBlob], `Invoice-${invoice.invoiceNumber}.pdf`, { type: 'application/pdf' })
        const shareText = `Invoice #${invoice.invoiceNumber}\nAmount: ₹${invoice.total.toLocaleString('en-IN')}\nDate: ${new Date(invoice.date).toLocaleDateString('en-IN')}`
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Invoice ${invoice.invoiceNumber}`,
            text: shareText,
            files: [file]
          })
          return
        }
      }
      await handleDownload()
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Share failed:', err)
    }
  }, [pdfBlob, invoice, handleDownload])

  const handleWhatsAppShare = useCallback(async () => {
    if (!invoice) return
    const message = encodeURIComponent(
      `Invoice #${invoice.invoiceNumber}\nAmount: ₹${invoice.total.toLocaleString('en-IN')}\nDate: ${new Date(invoice.date).toLocaleDateString('en-IN')}`
    )
    window.open(`https://wa.me/?text=${message}`, '_blank')
    await handleDownload()
  }, [invoice, handleDownload])

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href)
  }

  const handleCopyAndCreate = () => {
    if (!invoice) return
    // Pass invoice data as clone state — NewInvoicePage will populate fields
    history.push({
      pathname: '/invoices/new',
      state: {
        clone: {
          customerId: invoice.customerId,
          customerName: invoice.customer?.name || '',
          customerPhone: invoice.customer?.phone || '',
          customerStateCode: invoice.customerStateCode || null,
          fromAddress: invoice.fromAddress || '',
          billTo: invoice.billTo || '',
          shipTo: invoice.shipTo || '',
          lineItems: (invoice.lineItems || []).map(item => ({
            name: item.name,
            quantity: item.quantity,
            rate: item.rate,
            hsnCode: item.hsnCode || '',
            taxRate: item.taxRate || null,
            taxRateName: item.taxRateName || null,
            productServiceId: item.productServiceId || null
          })),
          discountTotal: invoice.discountTotal || 0,
          taxRate: invoice.taxRate || null,
          notes: invoice.notes || '',
          terms: invoice.terms || ''
        }
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-textSecondary">Loading invoice...</p>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 text-center py-20">
        <h2 className="text-xl font-semibold text-textPrimary mb-4">Invoice not found</h2>
        <button
          onClick={() => history.push('/invoices')}
          className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium"
        >
          Back to Invoices
        </button>
      </div>
    )
  }

  const status = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.DRAFT

  return (
    <div className="h-full flex flex-col">
      {/* Top Bar — Row 1: Back + Title + Status + More */}
      <div className="px-3 md:px-6 py-2 md:py-3 border-b border-border bg-white shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => history.push('/invoices')}
              className="w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-lg active:bg-bgPrimary md:hover:bg-bgPrimary text-textSecondary shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm md:text-base font-bold text-textPrimary truncate">
                  {(DOCUMENT_TYPE_DEFAULTS[invoice.documentType] || DOCUMENT_TYPE_DEFAULTS.invoice).label} #{invoice.invoiceNumber}
                </h1>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full shrink-0 ${status.bg} ${status.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>
              <span className="text-xs text-textSecondary">{formatDate(invoice.date)}</span>
            </div>
          </div>

          {/* Desktop-only action buttons */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            {statusWorkflow && invoice.status === 'DRAFT' && (
              <button
                onClick={() => issueMutation.mutate()}
                disabled={issueMutation.isPending}
                className="px-3.5 py-1.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-60"
              >
                {issueMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Issue
              </button>
            )}
            {statusWorkflow && invoice.status === 'ISSUED' && (
              <button
                onClick={() => { setPendingStatus('PAID'); setShowStatusConfirm(true) }}
                className="px-3.5 py-1.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Mark Paid
              </button>
            )}
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
            <div className="relative">
              <button
                onClick={() => setShowMoreActions(!showMoreActions)}
                className="w-10 h-10 flex items-center justify-center text-textSecondary hover:bg-bgPrimary rounded-lg border border-border transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showMoreActions && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMoreActions(false)} />
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-border rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                    <button
                      onClick={() => { setShowMoreActions(false); history.push(`/invoices/${id}/edit`) }}
                      className="w-full px-4 py-3 text-sm text-left text-textPrimary hover:bg-bgPrimary flex items-center gap-2.5"
                    >
                      <Pencil className="w-4 h-4 text-textSecondary" /> Edit Invoice
                    </button>
                    <button
                      onClick={() => { setShowMoreActions(false); setShowTemplateModal(true) }}
                      className="w-full px-4 py-3 text-sm text-left text-textPrimary hover:bg-bgPrimary flex items-center gap-2.5"
                    >
                      <Palette className="w-4 h-4 text-textSecondary" /> Change Template
                    </button>
                    <button
                      onClick={() => { setShowMoreActions(false); handleCopyLink() }}
                      className="w-full px-4 py-3 text-sm text-left text-textPrimary hover:bg-bgPrimary flex items-center gap-2.5"
                    >
                      <Copy className="w-4 h-4 text-textSecondary" /> Copy Link
                    </button>
                    <button
                      onClick={() => { setShowMoreActions(false); handleCopyAndCreate() }}
                      className="w-full px-4 py-3 text-sm text-left text-textPrimary hover:bg-bgPrimary flex items-center gap-2.5"
                    >
                      <Plus className="w-4 h-4 text-textSecondary" /> Copy & Create
                    </button>
                    {statusWorkflow && invoice.status === 'ISSUED' && (
                      <button
                        onClick={() => { setShowMoreActions(false); setPendingStatus('CANCELLED'); setShowStatusConfirm(true) }}
                        className="w-full px-4 py-3 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2.5"
                      >
                        <Ban className="w-4 h-4" /> Cancel Invoice
                      </button>
                    )}
                    {statusWorkflow && invoice.status === 'PAID' && (
                      <button
                        onClick={() => { setShowMoreActions(false); setPendingStatus('ISSUED'); setShowStatusConfirm(true) }}
                        className="w-full px-4 py-3 text-sm text-left text-textPrimary hover:bg-bgPrimary flex items-center gap-2.5"
                      >
                        <RotateCcw className="w-4 h-4 text-textSecondary" /> Mark as Unpaid
                      </button>
                    )}
                    {statusWorkflow && invoice.status === 'DRAFT' && (
                      <>
                        <div className="border-t border-border my-1" />
                        <button
                          onClick={() => { setShowMoreActions(false); setShowDeleteConfirm(true) }}
                          className="w-full px-4 py-3 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2.5"
                        >
                          <Trash2 className="w-4 h-4" /> Delete Invoice
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Action Bar — horizontal scroll, below header */}
      <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-border bg-white overflow-x-auto no-scrollbar shrink-0">
        {statusWorkflow && invoice.status === 'DRAFT' && (
          <button
            onClick={() => issueMutation.mutate()}
            disabled={issueMutation.isPending}
            className="px-3 py-2 text-xs font-semibold text-white bg-green-600 active:bg-green-700 rounded-lg flex items-center gap-1.5 shrink-0 disabled:opacity-60"
          >
            {issueMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Issue
          </button>
        )}
        {statusWorkflow && invoice.status === 'ISSUED' && (
          <button
            onClick={() => { setPendingStatus('PAID'); setShowStatusConfirm(true) }}
            className="px-3 py-2 text-xs font-semibold text-white bg-green-600 active:bg-green-700 rounded-lg flex items-center gap-1.5 shrink-0"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Mark Paid
          </button>
        )}
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
          onClick={handleShare}
          disabled={!pdfBlob}
          className="px-3 py-2 text-xs font-medium text-textSecondary active:bg-bgPrimary rounded-lg border border-border flex items-center gap-1.5 shrink-0 disabled:opacity-40"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>
        <button
          onClick={() => setShowMoreActions(!showMoreActions)}
          className="px-3 py-2 text-xs font-medium text-textSecondary active:bg-bgPrimary rounded-lg border border-border flex items-center gap-1.5 shrink-0"
        >
          <MoreVertical className="w-3.5 h-3.5" />
          More
        </button>
      </div>

      {/* PDF Viewer Area — fills remaining space */}
      <div className="flex-1 bg-gray-100 pb-mobile-nav overflow-auto">
        {isGeneratingPdf ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-textSecondary">Generating PDF preview...</p>
          </div>
        ) : pdfUrl ? (
          <>
            {/* Desktop: full iframe viewer */}
            <iframe
              src={pdfUrl}
              className="hidden md:block w-full h-full border-0"
              title={`Invoice ${invoice.invoiceNumber} PDF`}
            />
            {/* Mobile: canvas-based PDF viewer (iframes don't render blob PDFs on many mobile browsers) */}
            <div className="md:hidden w-full h-full">
              <Suspense fallback={
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <p className="text-xs text-textSecondary">Loading viewer...</p>
                </div>
              }>
                <MobilePdfViewer
                  blob={pdfBlob}
                  className="w-full h-full"
                />
              </Suspense>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-sm text-textSecondary">PDF preview unavailable</p>
          </div>
        )}
      </div>

      {/* Mobile More Actions — fixed bottom sheet */}
      {showMoreActions && (
        <Portal>
        <>
          <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setShowMoreActions(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white rounded-t-2xl shadow-2xl pb-safe animate-in slide-in-from-bottom">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-2" />
            <div className="px-2 pb-4 max-h-[60vh] overflow-y-auto">
              <button
                onClick={() => { setShowMoreActions(false); history.push(`/invoices/${id}/edit`) }}
                className="w-full px-4 py-3.5 text-sm text-left text-textPrimary active:bg-bgPrimary flex items-center gap-3 rounded-lg"
              >
                <Pencil className="w-4 h-4 text-textSecondary" /> Edit Invoice
              </button>
              <button
                onClick={() => { setShowMoreActions(false); setShowTemplateModal(true) }}
                className="w-full px-4 py-3.5 text-sm text-left text-textPrimary active:bg-bgPrimary flex items-center gap-3 rounded-lg"
              >
                <Palette className="w-4 h-4 text-textSecondary" /> Change Template
              </button>
              <button
                onClick={() => { setShowMoreActions(false); handleCopyLink() }}
                className="w-full px-4 py-3.5 text-sm text-left text-textPrimary active:bg-bgPrimary flex items-center gap-3 rounded-lg"
              >
                <Copy className="w-4 h-4 text-textSecondary" /> Copy Link
              </button>
              <button
                onClick={() => { setShowMoreActions(false); handleCopyAndCreate() }}
                className="w-full px-4 py-3.5 text-sm text-left text-textPrimary active:bg-bgPrimary flex items-center gap-3 rounded-lg"
              >
                <Plus className="w-4 h-4 text-textSecondary" /> Copy & Create
              </button>
              {statusWorkflow && invoice.status === 'ISSUED' && (
                <button
                  onClick={() => { setShowMoreActions(false); setPendingStatus('CANCELLED'); setShowStatusConfirm(true) }}
                  className="w-full px-4 py-3.5 text-sm text-left text-red-600 active:bg-red-50 flex items-center gap-3 rounded-lg"
                >
                  <Ban className="w-4 h-4" /> Cancel Invoice
                </button>
              )}
              {statusWorkflow && invoice.status === 'PAID' && (
                <button
                  onClick={() => { setShowMoreActions(false); setPendingStatus('ISSUED'); setShowStatusConfirm(true) }}
                  className="w-full px-4 py-3.5 text-sm text-left text-textPrimary active:bg-bgPrimary flex items-center gap-3 rounded-lg"
                >
                  <RotateCcw className="w-4 h-4 text-textSecondary" /> Mark as Unpaid
                </button>
              )}
              {statusWorkflow && invoice.status === 'DRAFT' && (
                <>
                  <div className="border-t border-border my-1 mx-4" />
                  <button
                    onClick={() => { setShowMoreActions(false); setShowDeleteConfirm(true) }}
                    className="w-full px-4 py-3.5 text-sm text-left text-red-600 active:bg-red-50 flex items-center gap-3 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Invoice
                  </button>
                </>
              )}
            </div>
          </div>
        </>
        </Portal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Portal>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-textPrimary text-center mb-2">Delete Invoice</h3>
            <p className="text-sm text-textSecondary text-center mb-6">Are you sure you want to delete this draft invoice? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-textSecondary hover:bg-bgPrimary rounded-lg border border-border transition-colors">Cancel</button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-60"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Template Select Modal */}
      <TemplateSelectModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onTemplateChange={(templateId) => setSelectedTemplateId(templateId)}
      />

      {/* Status Change Confirmation Modal */}
      {showStatusConfirm && (
        <Portal>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
              pendingStatus === 'PAID' ? 'bg-green-100' : pendingStatus === 'CANCELLED' ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              {pendingStatus === 'PAID' ? <CheckCircle className="w-6 h-6 text-green-600" /> :
               pendingStatus === 'CANCELLED' ? <XCircle className="w-6 h-6 text-red-500" /> :
               <RotateCcw className="w-6 h-6 text-blue-600" />}
            </div>
            <h3 className="text-lg font-semibold text-textPrimary text-center mb-2">
              {pendingStatus === 'PAID' ? 'Mark as Paid' :
               pendingStatus === 'CANCELLED' ? 'Cancel Invoice' :
               'Change Status'}
            </h3>
            <p className="text-sm text-textSecondary text-center mb-6">
              Are you sure you want to mark this invoice as {STATUS_CONFIG[pendingStatus]?.label || pendingStatus}?
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setShowStatusConfirm(false); setPendingStatus(null) }} className="flex-1 px-4 py-2.5 text-sm font-medium text-textSecondary hover:bg-bgPrimary rounded-lg border border-border transition-colors">Cancel</button>
              <button
                onClick={() => statusMutation.mutate({ status: pendingStatus })}
                disabled={statusMutation.isPending}
                className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-60 ${
                  pendingStatus === 'PAID' ? 'bg-green-600 hover:bg-green-700' :
                  pendingStatus === 'CANCELLED' ? 'bg-red-500 hover:bg-red-600' :
                  'bg-primary hover:bg-primaryHover'
                }`}
              >
                {statusMutation.isPending ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Plan Limit Modal */}
      <PlanLimitModal
        isOpen={showPlanLimit}
        onClose={() => setShowPlanLimit(false)}
        usage={planLimitData?.usage || planLimitData}
        plan={planLimitData?.plan || planLimitData}
      />
    </div>
  )
}
