import { useState, useEffect } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonActionSheet,
  useIonToast
} from '@ionic/react'
import {
  shareOutline,
  downloadOutline,
  printOutline,
  logoWhatsapp,
  closeOutline
} from 'ionicons/icons'
import { useQuery } from '@tanstack/react-query'
import { invoiceApi, templateApi } from '../../lib/api'
import { generatePDF, downloadPDF } from './utils/pdfGenerator.jsx'

export default function InvoicePDFPage() {
  const { id } = useParams()
  const history = useHistory()
  const [present] = useIonToast()
  const [showActions, setShowActions] = useState(false)
  const [pdfBlob, setPdfBlob] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Fetch invoice data
  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const response = await invoiceApi.get(id)
      return response.data
    }
  })

  // Fetch template config
  const { data: templateConfig } = useQuery({
    queryKey: ['templates', 'config'],
    queryFn: async () => {
      const response = await templateApi.getConfig()
      return response.data.data?.customConfig || response.data?.customConfig || null
    }
  })

  // Generate PDF when invoice and template loads
  useEffect(() => {
    const generate = async () => {
      if (invoice && !pdfBlob) {
        setIsGenerating(true)
        try {
          // Use template snapshot from invoice if available, otherwise use current config
          const config = invoice.templateConfigSnapshot?.customConfig || templateConfig
          const blob = await generatePDF(invoice, config)
          setPdfBlob(blob)
        } catch (err) {
          console.error('PDF generation failed:', err)
          present({
            message: 'Failed to generate PDF',
            duration: 3000,
            color: 'danger'
          })
        } finally {
          setIsGenerating(false)
        }
      }
    }
    generate()
  }, [invoice, templateConfig, pdfBlob, present])

  const handleDownload = async () => {
    if (!pdfBlob || !invoice) return

    try {
      await downloadPDF(pdfBlob, `Invoice-${invoice.invoiceNumber}.pdf`)
      present({
        message: 'Invoice downloaded successfully',
        duration: 2000,
        color: 'success'
      })
    } catch (err) {
      present({
        message: 'Failed to download invoice',
        duration: 3000,
        color: 'danger'
      })
    }
  }

  const handleShare = async () => {
    if (!pdfBlob || !invoice) return

    try {
      // Check if Web Share API is available
      if (navigator.share && navigator.canShare) {
        const file = new File([pdfBlob], `Invoice-${invoice.invoiceNumber}.pdf`, {
          type: 'application/pdf'
        })

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Invoice ${invoice.invoiceNumber}`,
            text: `Please find attached Invoice #${invoice.invoiceNumber}`,
            files: [file]
          })
          return
        }
      }

      // Fallback: download and show message
      await handleDownload()
      present({
        message: 'PDF downloaded. You can share it via WhatsApp manually.',
        duration: 3000,
        color: 'primary'
      })
    } catch (err) {
      if (err.name !== 'AbortError') {
        present({
          message: 'Failed to share invoice',
          duration: 3000,
          color: 'danger'
        })
      }
    }
  }

  const handleWhatsAppShare = async () => {
    if (!invoice) return

    // Generate WhatsApp message
    const message = encodeURIComponent(
      `Invoice #${invoice.invoiceNumber}\n` +
      `Amount: ₹${invoice.total.toLocaleString('en-IN')}\n` +
      `Date: ${new Date(invoice.date).toLocaleDateString('en-IN')}`
    )

    // Open WhatsApp with pre-filled message
    window.open(`https://wa.me/?text=${message}`, '_blank')

    // Also trigger download so user can attach
    await handleDownload()
  }

  const handlePrint = () => {
    if (!pdfBlob) return

    const url = URL.createObjectURL(pdfBlob)
    const printWindow = window.open(url, '_blank')
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  const handleNewInvoice = () => {
    history.push('/invoices/new')
  }

  if (isLoading || isGenerating) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/invoices/new" />
            </IonButtons>
            <IonTitle>Invoice</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '16px'
          }}>
            <IonSpinner name="crescent" />
            <p>{isGenerating ? 'Generating PDF...' : 'Loading invoice...'}</p>
          </div>
        </IonContent>
      </IonPage>
    )
  }

  if (error || !invoice) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/invoices/new" />
            </IonButtons>
            <IonTitle>Error</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{ textAlign: 'center', paddingTop: '40px' }}>
            <h2>Failed to load invoice</h2>
            <IonButton onClick={() => history.push('/invoices/new')}>
              Create New Invoice
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    )
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/invoices/new" />
          </IonButtons>
          <IonTitle>Invoice #{invoice.invoiceNumber}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Success Message */}
        <div style={{
          background: '#e8f5e9',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>✓</div>
          <h2 style={{ margin: '0 0 8px 0', color: '#2e7d32' }}>Invoice Issued!</h2>
          <p style={{ margin: 0, color: '#666' }}>
            Invoice #{invoice.invoiceNumber} is ready to share
          </p>
        </div>

        {/* Invoice Summary */}
        <div style={{
          background: '#f5f5f5',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: '#666' }}>Customer</span>
            <strong>{invoice.customer?.name || 'N/A'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: '#666' }}>Date</span>
            <span>{new Date(invoice.date).toLocaleDateString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: '#666' }}>Items</span>
            <span>{invoice.lineItems?.length || 0} items</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid #ddd'
          }}>
            <strong style={{ fontSize: '18px' }}>Total</strong>
            <strong style={{ fontSize: '20px', color: 'var(--ion-color-primary)' }}>
              ₹{invoice.total?.toLocaleString('en-IN')}
            </strong>
          </div>
        </div>

        {/* Primary Action - WhatsApp Share */}
        <IonButton
          expand="block"
          size="large"
          onClick={handleWhatsAppShare}
          style={{ marginBottom: '12px', '--background': '#25D366' }}
        >
          <IonIcon icon={logoWhatsapp} slot="start" />
          Share on WhatsApp
        </IonButton>

        {/* Secondary Actions */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <IonButton
            expand="block"
            fill="outline"
            onClick={handleDownload}
            style={{ flex: 1 }}
          >
            <IonIcon icon={downloadOutline} slot="start" />
            Download
          </IonButton>
          <IonButton
            expand="block"
            fill="outline"
            onClick={handlePrint}
            style={{ flex: 1 }}
          >
            <IonIcon icon={printOutline} slot="start" />
            Print
          </IonButton>
        </div>

        {/* More Options */}
        <IonButton
          expand="block"
          fill="clear"
          onClick={() => setShowActions(true)}
        >
          <IonIcon icon={shareOutline} slot="start" />
          More Share Options
        </IonButton>

        {/* Create Another */}
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <IonButton fill="clear" onClick={handleNewInvoice}>
            Create Another Invoice
          </IonButton>
        </div>
      </IonContent>

      {/* Action Sheet for more options */}
      <IonActionSheet
        isOpen={showActions}
        onDidDismiss={() => setShowActions(false)}
        header="Share Invoice"
        buttons={[
          {
            text: 'Share via Apps',
            icon: shareOutline,
            handler: handleShare
          },
          {
            text: 'Download PDF',
            icon: downloadOutline,
            handler: handleDownload
          },
          {
            text: 'Print',
            icon: printOutline,
            handler: handlePrint
          },
          {
            text: 'Cancel',
            icon: closeOutline,
            role: 'cancel'
          }
        ]}
      />
    </IonPage>
  )
}
