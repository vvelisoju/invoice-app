import { useState } from 'react'
import { useHistory } from 'react-router-dom'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonText,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonAccordion,
  IonAccordionGroup,
  IonSpinner,
  IonFab,
  IonFabButton,
  useIonToast,
  useIonActionSheet
} from '@ionic/react'
import { addOutline, documentTextOutline, chevronDownOutline } from 'ionicons/icons'
import { useMutation } from '@tanstack/react-query'
import { useInvoiceForm } from './hooks/useInvoiceForm'
import CustomerTypeahead from './components/CustomerTypeahead'
import LineItemRow from './components/LineItemRow'
import TotalsSummary from './components/TotalsSummary'
import { invoiceApi } from '../../lib/api'

export default function NewInvoicePage() {
  const history = useHistory()
  const [present] = useIonToast()
  const [presentActionSheet] = useIonActionSheet()
  const [showAdvanced, setShowAdvanced] = useState(false)

  const {
    invoice,
    isDirty,
    isSaving,
    lastSaved,
    updateField,
    updateLineItem,
    addLineItem,
    removeLineItem,
    setCustomer,
    setProductForLineItem,
    saveToLocal,
    resetForm
  } = useInvoiceForm()

  // Issue invoice mutation
  const issueMutation = useMutation({
    mutationFn: async () => {
      // First sync to server
      const response = await invoiceApi.create({
        id: invoice.id,
        customerId: invoice.customerId,
        date: invoice.date,
        dueDate: invoice.dueDate,
        lineItems: invoice.lineItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          rate: item.rate,
          productServiceId: item.productServiceId
        })),
        discountTotal: invoice.discountTotal,
        taxRate: invoice.taxRate,
        customerStateCode: invoice.customerStateCode,
        notes: invoice.notes,
        terms: invoice.terms
      })

      // Then issue it
      const issued = await invoiceApi.issue(response.data.id, {
        templateBaseId: null,
        templateConfigSnapshot: null,
        templateVersion: null
      })

      return issued.data
    },
    onSuccess: (data) => {
      present({
        message: 'Invoice issued successfully!',
        duration: 2000,
        color: 'success'
      })
      // Navigate to PDF preview
      history.push(`/invoices/${data.id}/pdf`)
    },
    onError: (error) => {
      present({
        message: error.response?.data?.error?.message || 'Failed to issue invoice',
        duration: 3000,
        color: 'danger'
      })
    }
  })

  const handleGeneratePDF = () => {
    // Validate minimum requirements
    if (!invoice.customerName && !invoice.customerId) {
      present({
        message: 'Please add a customer',
        duration: 2000,
        color: 'warning'
      })
      return
    }

    const validItems = invoice.lineItems.filter(item => item.name && item.rate > 0)
    if (validItems.length === 0) {
      present({
        message: 'Please add at least one item with a name and rate',
        duration: 2000,
        color: 'warning'
      })
      return
    }

    issueMutation.mutate()
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>New Invoice</IonTitle>
          {isSaving && (
            <IonSpinner slot="end" name="dots" style={{ marginRight: '16px' }} />
          )}
          {!isSaving && lastSaved && (
            <IonText slot="end" color="medium" style={{ marginRight: '16px', fontSize: '12px' }}>
              Saved
            </IonText>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Invoice Number & Date */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '16px',
          padding: '12px',
          background: '#f0f4ff',
          borderRadius: '8px'
        }}>
          <div>
            <IonText color="medium" style={{ fontSize: '12px' }}>Invoice #</IonText>
            <div style={{ fontWeight: '600' }}>{invoice.invoiceNumber || 'Auto-generated'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <IonText color="medium" style={{ fontSize: '12px' }}>Date</IonText>
            <div style={{ fontWeight: '600' }}>{formatDate(invoice.date)}</div>
          </div>
        </div>

        {/* Customer Section */}
        <div style={{ marginBottom: '24px' }}>
          <CustomerTypeahead
            value={invoice.customerName}
            onChange={(value) => updateField('customerName', value)}
            onSelect={setCustomer}
          />
        </div>

        {/* Line Items */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Items</h3>
            <IonButton fill="clear" size="small" onClick={addLineItem}>
              <IonIcon icon={addOutline} slot="start" />
              Add Item
            </IonButton>
          </div>

          {invoice.lineItems.map((item, index) => (
            <LineItemRow
              key={item.id}
              item={item}
              index={index}
              onUpdate={updateLineItem}
              onRemove={removeLineItem}
              onProductSelect={setProductForLineItem}
              canRemove={invoice.lineItems.length > 1}
            />
          ))}
        </div>

        {/* Totals */}
        <TotalsSummary
          subtotal={invoice.subtotal}
          discountTotal={invoice.discountTotal}
          taxRate={invoice.taxRate}
          taxTotal={invoice.taxTotal}
          total={invoice.total}
        />

        {/* Advanced Details (Collapsed) */}
        <IonAccordionGroup style={{ marginTop: '24px' }}>
          <IonAccordion value="advanced">
            <IonItem slot="header" color="light">
              <IonLabel>Add Details</IonLabel>
              <IonIcon icon={chevronDownOutline} slot="end" />
            </IonItem>
            <div slot="content" style={{ padding: '16px' }}>
              {/* Discount */}
              <IonItem>
                <IonLabel position="stacked">Discount (₹)</IonLabel>
                <IonInput
                  type="number"
                  inputmode="decimal"
                  value={invoice.discountTotal}
                  onIonInput={(e) => updateField('discountTotal', parseFloat(e.detail.value) || 0)}
                  placeholder="0"
                />
              </IonItem>

              {/* Tax Rate */}
              <IonItem>
                <IonLabel position="stacked">Tax Rate (%)</IonLabel>
                <IonInput
                  type="number"
                  inputmode="decimal"
                  value={invoice.taxRate || ''}
                  onIonInput={(e) => updateField('taxRate', parseFloat(e.detail.value) || null)}
                  placeholder="e.g., 18"
                />
              </IonItem>

              {/* Due Date */}
              <IonItem>
                <IonLabel position="stacked">Due Date</IonLabel>
                <IonInput
                  type="date"
                  value={invoice.dueDate || ''}
                  onIonInput={(e) => updateField('dueDate', e.detail.value)}
                />
              </IonItem>

              {/* Notes */}
              <IonItem>
                <IonLabel position="stacked">Notes</IonLabel>
                <IonTextarea
                  value={invoice.notes}
                  onIonInput={(e) => updateField('notes', e.detail.value)}
                  placeholder="Add notes for the customer"
                  rows={3}
                />
              </IonItem>

              {/* Terms */}
              <IonItem>
                <IonLabel position="stacked">Terms & Conditions</IonLabel>
                <IonTextarea
                  value={invoice.terms}
                  onIonInput={(e) => updateField('terms', e.detail.value)}
                  placeholder="Payment terms, etc."
                  rows={3}
                />
              </IonItem>
            </div>
          </IonAccordion>
        </IonAccordionGroup>

        {/* Spacer for FAB */}
        <div style={{ height: '100px' }} />
      </IonContent>

      {/* Generate PDF FAB */}
      <IonFab vertical="bottom" horizontal="end" slot="fixed">
        <IonFabButton
          onClick={handleGeneratePDF}
          disabled={issueMutation.isPending}
          style={{ '--background': 'var(--ion-color-primary)' }}
        >
          {issueMutation.isPending ? (
            <IonSpinner name="crescent" />
          ) : (
            <IonIcon icon={documentTextOutline} />
          )}
        </IonFabButton>
      </IonFab>

      {/* Bottom Action Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '12px 16px',
        background: 'white',
        borderTop: '1px solid #eee',
        display: 'flex',
        gap: '12px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))'
      }}>
        <IonButton
          expand="block"
          fill="outline"
          style={{ flex: 1 }}
          onClick={saveToLocal}
          disabled={!isDirty || isSaving}
        >
          Save Draft
        </IonButton>
        <IonButton
          expand="block"
          style={{ flex: 2 }}
          onClick={handleGeneratePDF}
          disabled={issueMutation.isPending}
        >
          {issueMutation.isPending ? (
            <IonSpinner name="crescent" />
          ) : (
            <>
              <IonIcon icon={documentTextOutline} slot="start" />
              Generate PDF
            </>
          )}
        </IonButton>
      </div>
    </IonPage>
  )
}
