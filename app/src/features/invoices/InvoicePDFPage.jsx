import { useState, useEffect } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { Download, Printer, Share2, MessageCircle, Plus, CheckCircle, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { invoiceApi, templateApi } from '../../lib/api'
import { generatePDF, downloadPDF } from './utils/pdfGenerator.jsx'
import { PageHeader } from '../../components/layout'

export default function InvoicePDFPage() {
  const { id } = useParams()
  const history = useHistory()
  const [pdfBlob, setPdfBlob] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

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
      return response.data.data?.customConfig || response.data?.customConfig || null
    }
  })

  useEffect(() => {
    const generate = async () => {
      if (invoice && !pdfBlob) {
        setIsGenerating(true)
        try {
          const config = invoice.templateConfigSnapshot?.customConfig || templateConfig
          const blob = await generatePDF(invoice, config)
          setPdfBlob(blob)
        } catch (err) {
          console.error('PDF generation failed:', err)
        } finally {
          setIsGenerating(false)
        }
      }
    }
    generate()
  }, [invoice, templateConfig, pdfBlob])

  const handleDownload = async () => {
    if (!pdfBlob || !invoice) return
    try {
      await downloadPDF(pdfBlob, `Invoice-${invoice.invoiceNumber}.pdf`)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  const handleShare = async () => {
    if (!pdfBlob || !invoice) return
    try {
      if (navigator.share && navigator.canShare) {
        const file = new File([pdfBlob], `Invoice-${invoice.invoiceNumber}.pdf`, { type: 'application/pdf' })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Invoice ${invoice.invoiceNumber}`,
            text: `Please find attached Invoice #${invoice.invoiceNumber}`,
            files: [file]
          })
          return
        }
      }
      await handleDownload()
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Share failed:', err)
    }
  }

  const handleWhatsAppShare = async () => {
    if (!invoice) return
    const message = encodeURIComponent(
      `Invoice #${invoice.invoiceNumber}\nAmount: ₹${invoice.total.toLocaleString('en-IN')}\nDate: ${new Date(invoice.date).toLocaleDateString('en-IN')}`
    )
    window.open(`https://wa.me/?text=${message}`, '_blank')
    await handleDownload()
  }

  const handlePrint = () => {
    if (!pdfBlob) return
    const url = URL.createObjectURL(pdfBlob)
    const printWindow = window.open(url, '_blank')
    if (printWindow) {
      printWindow.onload = () => printWindow.print()
    }
  }

  if (isLoading || isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-textSecondary">{isGenerating ? 'Generating PDF...' : 'Loading invoice...'}</p>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 text-center py-20">
        <h2 className="text-xl font-semibold text-textPrimary mb-4">Failed to load invoice</h2>
        <button onClick={() => history.push('/invoices/new')} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium">
          Create New Invoice
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <PageHeader title={`Invoice #${invoice.invoiceNumber}`} backTo="/invoices/new" />

      {/* Success Banner */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mb-6">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-green-800 mb-1">Invoice Issued!</h2>
        <p className="text-sm text-green-700">Invoice #{invoice.invoiceNumber} is ready to share</p>
      </div>

      {/* Invoice Summary */}
      <div className="bg-bgSecondary rounded-xl border border-border shadow-card p-6 mb-6">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-textSecondary">Customer</span>
            <strong className="text-textPrimary">{invoice.customer?.name || 'N/A'}</strong>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-textSecondary">Date</span>
            <span className="text-textPrimary">{new Date(invoice.date).toLocaleDateString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-textSecondary">Items</span>
            <span className="text-textPrimary">{invoice.lineItems?.length || 0} items</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-border">
            <strong className="text-lg text-textPrimary">Total</strong>
            <strong className="text-xl text-primary">₹{invoice.total?.toLocaleString('en-IN')}</strong>
          </div>
        </div>
      </div>

      {/* WhatsApp Share */}
      <button
        onClick={handleWhatsAppShare}
        className="w-full py-3.5 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm mb-4 transition-colors"
      >
        <MessageCircle className="w-5 h-5" />
        Share on WhatsApp
      </button>

      {/* Secondary Actions */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button
          onClick={handleDownload}
          className="py-3 border border-border bg-bgSecondary hover:bg-bgPrimary rounded-xl text-sm font-medium text-textSecondary flex items-center justify-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
        <button
          onClick={handlePrint}
          className="py-3 border border-border bg-bgSecondary hover:bg-bgPrimary rounded-xl text-sm font-medium text-textSecondary flex items-center justify-center gap-2 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
        <button
          onClick={handleShare}
          className="py-3 border border-border bg-bgSecondary hover:bg-bgPrimary rounded-xl text-sm font-medium text-textSecondary flex items-center justify-center gap-2 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      {/* Create Another */}
      <div className="text-center">
        <button
          onClick={() => history.push('/invoices/new')}
          className="text-sm text-primary hover:underline font-medium flex items-center gap-1 mx-auto"
        >
          <Plus className="w-4 h-4" />
          Create Another Invoice
        </button>
      </div>
    </div>
  )
}
