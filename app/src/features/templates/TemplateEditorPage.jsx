import { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonToggle,
  IonAccordion,
  IonAccordionGroup,
  IonIcon,
  IonSpinner,
  useIonToast
} from '@ionic/react'
import {
  colorPaletteOutline,
  imageOutline,
  businessOutline,
  personOutline,
  listOutline,
  calculatorOutline,
  documentTextOutline,
  textOutline
} from 'ionicons/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { templateApi } from '../../lib/api'

export default function TemplateEditorPage() {
  const history = useHistory()
  const [present] = useIonToast()
  const queryClient = useQueryClient()
  const [config, setConfig] = useState(null)
  const [isDirty, setIsDirty] = useState(false)

  const { data: currentConfig, isLoading } = useQuery({
    queryKey: ['templates', 'config'],
    queryFn: async () => {
      const response = await templateApi.getConfig()
      return response.data.data || response.data
    }
  })

  useEffect(() => {
    if (currentConfig?.customConfig) {
      setConfig(currentConfig.customConfig)
    }
  }, [currentConfig])

  const saveMutation = useMutation({
    mutationFn: () => templateApi.updateConfig({
      baseTemplateId: currentConfig?.baseTemplateId,
      customConfig: config
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates', 'config'])
      setIsDirty(false)
      present({
        message: 'Template saved',
        duration: 2000,
        color: 'success'
      })
    },
    onError: (error) => {
      present({
        message: error.response?.data?.error?.message || 'Failed to save template',
        duration: 3000,
        color: 'danger'
      })
    }
  })

  const updateConfig = (path, value) => {
    setConfig(prev => {
      const newConfig = { ...prev }
      const keys = path.split('.')
      let current = newConfig
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
      return newConfig
    })
    setIsDirty(true)
  }

  if (isLoading || !config) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/templates" />
            </IonButtons>
            <IonTitle>Template Editor</IonTitle>
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/templates" />
          </IonButtons>
          <IonTitle>Customize Template</IonTitle>
          {isDirty && (
            <IonButton
              slot="end"
              fill="clear"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <IonSpinner name="dots" /> : 'Save'}
            </IonButton>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonAccordionGroup multiple={true} value={['colors']}>
          {/* Colors */}
          <IonAccordion value="colors">
            <IonItem slot="header" color="light">
              <IonIcon icon={colorPaletteOutline} slot="start" />
              <IonLabel>Colors</IonLabel>
            </IonItem>
            <div slot="content">
              <IonList>
                <IonItem>
                  <IonLabel>Primary Color</IonLabel>
                  <input
                    type="color"
                    value={config.colors?.primary || '#3880ff'}
                    onChange={(e) => updateConfig('colors.primary', e.target.value)}
                    style={{ width: '40px', height: '40px', border: 'none', cursor: 'pointer' }}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel>Secondary Color</IonLabel>
                  <input
                    type="color"
                    value={config.colors?.secondary || '#666666'}
                    onChange={(e) => updateConfig('colors.secondary', e.target.value)}
                    style={{ width: '40px', height: '40px', border: 'none', cursor: 'pointer' }}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel>Accent Color</IonLabel>
                  <input
                    type="color"
                    value={config.colors?.accent || '#f5f5f5'}
                    onChange={(e) => updateConfig('colors.accent', e.target.value)}
                    style={{ width: '40px', height: '40px', border: 'none', cursor: 'pointer' }}
                  />
                </IonItem>
              </IonList>
            </div>
          </IonAccordion>

          {/* Logo */}
          <IonAccordion value="logo">
            <IonItem slot="header" color="light">
              <IonIcon icon={imageOutline} slot="start" />
              <IonLabel>Logo</IonLabel>
            </IonItem>
            <div slot="content">
              <IonList>
                <IonItem>
                  <IonLabel>Show Logo</IonLabel>
                  <IonToggle
                    checked={config.logo?.show !== false}
                    onIonChange={(e) => updateConfig('logo.show', e.detail.checked)}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Logo Position</IonLabel>
                  <select
                    value={config.logo?.position || 'left'}
                    onChange={(e) => updateConfig('logo.position', e.target.value)}
                    style={{ width: '100%', padding: '10px', marginTop: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </IonItem>
              </IonList>
            </div>
          </IonAccordion>

          {/* Header (Business Info) */}
          <IonAccordion value="header">
            <IonItem slot="header" color="light">
              <IonIcon icon={businessOutline} slot="start" />
              <IonLabel>Business Info</IonLabel>
            </IonItem>
            <div slot="content">
              <IonList>
                <IonItem>
                  <IonLabel>Show Business Name</IonLabel>
                  <IonToggle
                    checked={config.header?.showBusinessName !== false}
                    onIonChange={(e) => updateConfig('header.showBusinessName', e.detail.checked)}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel>Show Address</IonLabel>
                  <IonToggle
                    checked={config.header?.showBusinessAddress !== false}
                    onIonChange={(e) => updateConfig('header.showBusinessAddress', e.detail.checked)}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel>Show GSTIN</IonLabel>
                  <IonToggle
                    checked={config.header?.showBusinessGSTIN !== false}
                    onIonChange={(e) => updateConfig('header.showBusinessGSTIN', e.detail.checked)}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel>Show Phone</IonLabel>
                  <IonToggle
                    checked={config.header?.showBusinessPhone !== false}
                    onIonChange={(e) => updateConfig('header.showBusinessPhone', e.detail.checked)}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel>Show Email</IonLabel>
                  <IonToggle
                    checked={config.header?.showBusinessEmail !== false}
                    onIonChange={(e) => updateConfig('header.showBusinessEmail', e.detail.checked)}
                  />
                </IonItem>
              </IonList>
            </div>
          </IonAccordion>

          {/* Customer Info */}
          <IonAccordion value="customer">
            <IonItem slot="header" color="light">
              <IonIcon icon={personOutline} slot="start" />
              <IonLabel>Customer Info</IonLabel>
            </IonItem>
            <div slot="content">
              <IonList>
                <IonItem>
                  <IonLabel>Show Phone</IonLabel>
                  <IonToggle
                    checked={config.customer?.showPhone !== false}
                    onIonChange={(e) => updateConfig('customer.showPhone', e.detail.checked)}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel>Show Email</IonLabel>
                  <IonToggle
                    checked={config.customer?.showEmail !== false}
                    onIonChange={(e) => updateConfig('customer.showEmail', e.detail.checked)}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel>Show Address</IonLabel>
                  <IonToggle
                    checked={config.customer?.showAddress !== false}
                    onIonChange={(e) => updateConfig('customer.showAddress', e.detail.checked)}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel>Show GSTIN</IonLabel>
                  <IonToggle
                    checked={config.customer?.showGSTIN !== false}
                    onIonChange={(e) => updateConfig('customer.showGSTIN', e.detail.checked)}
                  />
                </IonItem>
              </IonList>
            </div>
          </IonAccordion>

          {/* Totals */}
          <IonAccordion value="totals">
            <IonItem slot="header" color="light">
              <IonIcon icon={calculatorOutline} slot="start" />
              <IonLabel>Totals Section</IonLabel>
            </IonItem>
            <div slot="content">
              <IonList>
                <IonItem>
                  <IonLabel>Show Subtotal</IonLabel>
                  <IonToggle
                    checked={config.totals?.showSubtotal !== false}
                    onIonChange={(e) => updateConfig('totals.showSubtotal', e.detail.checked)}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel>Show Discount</IonLabel>
                  <IonToggle
                    checked={config.totals?.showDiscount !== false}
                    onIonChange={(e) => updateConfig('totals.showDiscount', e.detail.checked)}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel>Show Tax Breakup</IonLabel>
                  <IonToggle
                    checked={config.totals?.showTaxBreakup !== false}
                    onIonChange={(e) => updateConfig('totals.showTaxBreakup', e.detail.checked)}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel>Show Amount in Words</IonLabel>
                  <IonToggle
                    checked={config.totals?.showAmountInWords === true}
                    onIonChange={(e) => updateConfig('totals.showAmountInWords', e.detail.checked)}
                  />
                </IonItem>
              </IonList>
            </div>
          </IonAccordion>

          {/* Footer */}
          <IonAccordion value="footer">
            <IonItem slot="header" color="light">
              <IonIcon icon={documentTextOutline} slot="start" />
              <IonLabel>Footer Section</IonLabel>
            </IonItem>
            <div slot="content">
              <IonList>
                <IonItem>
                  <IonLabel>Show Bank Details</IonLabel>
                  <IonToggle
                    checked={config.footer?.showBankDetails !== false}
                    onIonChange={(e) => updateConfig('footer.showBankDetails', e.detail.checked)}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel>Show UPI</IonLabel>
                  <IonToggle
                    checked={config.footer?.showUPI !== false}
                    onIonChange={(e) => updateConfig('footer.showUPI', e.detail.checked)}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel>Show Signature</IonLabel>
                  <IonToggle
                    checked={config.footer?.showSignature !== false}
                    onIonChange={(e) => updateConfig('footer.showSignature', e.detail.checked)}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel>Show Terms</IonLabel>
                  <IonToggle
                    checked={config.footer?.showTerms !== false}
                    onIonChange={(e) => updateConfig('footer.showTerms', e.detail.checked)}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel>Show Notes</IonLabel>
                  <IonToggle
                    checked={config.footer?.showNotes !== false}
                    onIonChange={(e) => updateConfig('footer.showNotes', e.detail.checked)}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Custom Footer Text</IonLabel>
                  <IonInput
                    value={config.footer?.customFooterText || ''}
                    onIonInput={(e) => updateConfig('footer.customFooterText', e.detail.value)}
                    placeholder="e.g., Thank you for your business!"
                  />
                </IonItem>
              </IonList>
            </div>
          </IonAccordion>

          {/* Labels */}
          <IonAccordion value="labels">
            <IonItem slot="header" color="light">
              <IonIcon icon={textOutline} slot="start" />
              <IonLabel>Custom Labels</IonLabel>
            </IonItem>
            <div slot="content">
              <IonList>
                <IonItem>
                  <IonLabel position="stacked">Invoice Title</IonLabel>
                  <IonInput
                    value={config.labels?.invoiceTitle || 'INVOICE'}
                    onIonInput={(e) => updateConfig('labels.invoiceTitle', e.detail.value)}
                    placeholder="INVOICE"
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Bill To Label</IonLabel>
                  <IonInput
                    value={config.labels?.billTo || 'Bill To'}
                    onIonInput={(e) => updateConfig('labels.billTo', e.detail.value)}
                    placeholder="Bill To"
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Description Column</IonLabel>
                  <IonInput
                    value={config.labels?.itemDescription || 'Description'}
                    onIonInput={(e) => updateConfig('labels.itemDescription', e.detail.value)}
                    placeholder="Description"
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Quantity Column</IonLabel>
                  <IonInput
                    value={config.labels?.quantity || 'Qty'}
                    onIonInput={(e) => updateConfig('labels.quantity', e.detail.value)}
                    placeholder="Qty"
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Rate Column</IonLabel>
                  <IonInput
                    value={config.labels?.rate || 'Rate'}
                    onIonInput={(e) => updateConfig('labels.rate', e.detail.value)}
                    placeholder="Rate"
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Amount Column</IonLabel>
                  <IonInput
                    value={config.labels?.amount || 'Amount'}
                    onIonInput={(e) => updateConfig('labels.amount', e.detail.value)}
                    placeholder="Amount"
                  />
                </IonItem>
              </IonList>
            </div>
          </IonAccordion>
        </IonAccordionGroup>

        {/* Save Button (sticky at bottom) */}
        <div style={{ padding: '20px' }}>
          <IonButton
            expand="block"
            onClick={() => saveMutation.mutate()}
            disabled={!isDirty || saveMutation.isPending}
          >
            {saveMutation.isPending ? <IonSpinner name="crescent" /> : 'Save Changes'}
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  )
}
