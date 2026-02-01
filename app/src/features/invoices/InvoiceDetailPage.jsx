import { useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonBadge,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonSpinner,
  IonActionSheet,
  IonAlert,
  useIonToast
} from '@ionic/react'
import {
  documentTextOutline,
  shareOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  createOutline,
  trashOutline,
  ellipsisVertical
} from 'ionicons/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoiceApi } from '../../lib/api'

const STATUS_COLORS = {
  DRAFT: 'medium',
  ISSUED: 'primary',
  PAID: 'success',
  CANCELLED: 'danger',
  VOID: 'dark'
}

const STATUS_LABELS = {
  DRAFT: 'Draft',
  ISSUED: 'Issued',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
  VOID: 'Void'
}

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const history = useHistory()
  const [present] = useIonToast()
  const queryClient = useQueryClient()
  const [showActions, setShowActions] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [showStatusAlert, setShowStatusAlert] = useState(false)
  const [pendingStatus, setPendingStatus] = useState(null)

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const response = await invoiceApi.get(id)
      return response.data
    }
  })

  const statusMutation = useMutation({
    mutationFn: ({ status }) => invoiceApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoice', id])
      queryClient.invalidateQueries(['invoices'])
      present({
        message: 'Invoice status updated',
        duration: 2000,
        color: 'success'
      })
    },
    onError: (error) => {
      present({
        message: error.response?.data?.error?.message || 'Failed to update status',
        duration: 3000,
        color: 'danger'
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: () => invoiceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices'])
      present({
        message: 'Invoice deleted',
        duration: 2000,
        color: 'success'
      })
      history.replace('/invoices')
    },
    onError: (error) => {
      present({
        message: error.response?.data?.error?.message || 'Failed to delete invoice',
        duration: 3000,
        color: 'danger'
      })
    }
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const handleStatusChange = (status) => {
    setPendingStatus(status)
    setShowStatusAlert(true)
  }

  const confirmStatusChange = () => {
    if (pendingStatus) {
      statusMutation.mutate({ status: pendingStatus })
    }
    setShowStatusAlert(false)
    setPendingStatus(null)
  }

  const getActionButtons = () => {
    if (!invoice) return []

    const buttons = []

    if (invoice.status === 'DRAFT') {
      buttons.push({
        text: 'Edit Invoice',
        icon: createOutline,
        handler: () => history.push(`/invoices/${id}/edit`)
      })
      buttons.push({
        text: 'Delete',
        icon: trashOutline,
        role: 'destructive',
        handler: () => setShowDeleteAlert(true)
      })
    }

    if (invoice.status === 'ISSUED') {
      buttons.push({
        text: 'Mark as Paid',
        icon: checkmarkCircleOutline,
        handler: () => handleStatusChange('PAID')
      })
      buttons.push({
        text: 'Cancel Invoice',
        icon: closeCircleOutline,
        role: 'destructive',
        handler: () => handleStatusChange('CANCELLED')
      })
    }

    if (invoice.status === 'PAID') {
      buttons.push({
        text: 'Mark as Unpaid',
        icon: closeCircleOutline,
        handler: () => handleStatusChange('ISSUED')
      })
    }

    buttons.push({
      text: 'Close',
      role: 'cancel'
    })

    return buttons
  }

  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/invoices" />
            </IonButtons>
            <IonTitle>Invoice</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <IonSpinner />
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
              <IonBackButton defaultHref="/invoices" />
            </IonButtons>
            <IonTitle>Error</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h2>Invoice not found</h2>
            <IonButton onClick={() => history.push('/invoices')}>
              Back to Invoices
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
            <IonBackButton defaultHref="/invoices" />
          </IonButtons>
          <IonTitle>#{invoice.invoiceNumber}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowActions(true)}>
              <IonIcon icon={ellipsisVertical} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Status & Amount Header */}
        <div style={{
          background: '#f5f5f5',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <IonBadge color={STATUS_COLORS[invoice.status]} style={{ marginBottom: '12px' }}>
            {STATUS_LABELS[invoice.status]}
          </IonBadge>
          <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--ion-color-primary)' }}>
            {formatCurrency(invoice.total)}
          </div>
          <IonText color="medium">
            <p style={{ margin: '8px 0 0 0' }}>{formatDate(invoice.date)}</p>
          </IonText>
        </div>

        {/* Customer Info */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '8px', textTransform: 'uppercase' }}>
            Customer
          </h3>
          <div style={{ background: 'white', borderRadius: '8px', padding: '12px', border: '1px solid #eee' }}>
            <div style={{ fontWeight: '600' }}>{invoice.customer?.name || 'No customer'}</div>
            {invoice.customer?.phone && (
              <IonText color="medium"><p style={{ margin: '4px 0 0 0' }}>{invoice.customer.phone}</p></IonText>
            )}
            {invoice.customer?.address && (
              <IonText color="medium"><p style={{ margin: '4px 0 0 0' }}>{invoice.customer.address}</p></IonText>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '8px', textTransform: 'uppercase' }}>
            Items ({invoice.lineItems?.length || 0})
          </h3>
          <IonList style={{ borderRadius: '8px', overflow: 'hidden' }}>
            {invoice.lineItems?.map((item, index) => (
              <IonItem key={index}>
                <IonLabel>
                  <h3>{item.name}</h3>
                  <p>{item.quantity} × {formatCurrency(item.rate)}</p>
                </IonLabel>
                <IonText slot="end" style={{ fontWeight: '600' }}>
                  {formatCurrency(item.lineTotal)}
                </IonText>
              </IonItem>
            ))}
          </IonList>
        </div>

        {/* Totals */}
        <div style={{
          background: '#f9f9f9',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <IonText color="medium">Subtotal</IonText>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          {invoice.discountTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <IonText color="medium">Discount</IonText>
              <IonText color="danger">-{formatCurrency(invoice.discountTotal)}</IonText>
            </div>
          )}
          {invoice.taxTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <IonText color="medium">Tax ({invoice.taxRate}%)</IonText>
              <span>{formatCurrency(invoice.taxTotal)}</span>
            </div>
          )}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid #ddd',
            marginTop: '8px'
          }}>
            <strong>Total</strong>
            <strong style={{ color: 'var(--ion-color-primary)' }}>{formatCurrency(invoice.total)}</strong>
          </div>
        </div>

        {/* Notes & Terms */}
        {(invoice.notes || invoice.terms) && (
          <div style={{ marginBottom: '20px' }}>
            {invoice.notes && (
              <div style={{ marginBottom: '12px' }}>
                <h4 style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Notes</h4>
                <p style={{ margin: 0, color: '#333' }}>{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <h4 style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Terms</h4>
                <p style={{ margin: 0, color: '#333' }}>{invoice.terms}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <IonButton
            expand="block"
            onClick={() => history.push(`/invoices/${id}/pdf`)}
            style={{ flex: 1 }}
          >
            <IonIcon icon={documentTextOutline} slot="start" />
            View PDF
          </IonButton>
          <IonButton
            expand="block"
            fill="outline"
            onClick={() => history.push(`/invoices/${id}/pdf`)}
            style={{ flex: 1 }}
          >
            <IonIcon icon={shareOutline} slot="start" />
            Share
          </IonButton>
        </div>
      </IonContent>

      {/* Action Sheet */}
      <IonActionSheet
        isOpen={showActions}
        onDidDismiss={() => setShowActions(false)}
        header="Invoice Actions"
        buttons={getActionButtons()}
      />

      {/* Delete Confirmation */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Delete Invoice"
        message="Are you sure you want to delete this draft invoice? This action cannot be undone."
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          {
            text: 'Delete',
            role: 'destructive',
            handler: () => deleteMutation.mutate()
          }
        ]}
      />

      {/* Status Change Confirmation */}
      <IonAlert
        isOpen={showStatusAlert}
        onDidDismiss={() => {
          setShowStatusAlert(false)
          setPendingStatus(null)
        }}
        header="Change Status"
        message={`Are you sure you want to mark this invoice as ${STATUS_LABELS[pendingStatus]}?`}
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          { text: 'Confirm', handler: confirmStatusChange }
        ]}
      />
    </IonPage>
  )
}
