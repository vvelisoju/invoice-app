import { useState } from 'react'
import { useHistory } from 'react-router-dom'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonToggle,
  IonButton,
  IonIcon,
  IonSpinner,
  IonAccordion,
  IonAccordionGroup,
  useIonToast
} from '@ionic/react'
import {
  businessOutline,
  receiptOutline,
  cardOutline,
  documentTextOutline,
  colorPaletteOutline,
  chevronForwardOutline,
  logOutOutline
} from 'ionicons/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { businessApi, plansApi } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import PlanUsageCard from '../../components/PlanUsageCard'
import UpgradePrompt from '../../components/UpgradePrompt'

export default function SettingsPage() {
  const history = useHistory()
  const [present] = useIonToast()
  const queryClient = useQueryClient()
  const logout = useAuthStore((state) => state.logout)
  const [formData, setFormData] = useState({})
  const [isDirty, setIsDirty] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const { data: planUsage } = useQuery({
    queryKey: ['plans', 'usage'],
    queryFn: async () => {
      const response = await plansApi.getUsage()
      return response.data.data || response.data
    }
  })

  const { data: business, isLoading } = useQuery({
    queryKey: ['business'],
    queryFn: async () => {
      const response = await businessApi.getProfile()
      setFormData(response.data.data || response.data)
      return response.data.data || response.data
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data) => businessApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['business'])
      setIsDirty(false)
      present({
        message: 'Settings saved',
        duration: 2000,
        color: 'success'
      })
    },
    onError: (error) => {
      present({
        message: error.response?.data?.error?.message || 'Failed to save settings',
        duration: 3000,
        color: 'danger'
      })
    }
  })

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const handleSave = () => {
    updateMutation.mutate(formData)
  }

  const handleLogout = () => {
    logout()
    history.replace('/auth/phone')
  }

  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Settings</IonTitle>
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
          <IonTitle>Settings</IonTitle>
          {isDirty && (
            <IonButton
              slot="end"
              fill="clear"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <IonSpinner name="dots" /> : 'Save'}
            </IonButton>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Plan Usage Card */}
        <div style={{ padding: '16px 16px 0 16px' }}>
          <PlanUsageCard 
            usage={planUsage} 
            onUpgradeClick={() => setShowUpgrade(true)} 
          />
        </div>

        {/* Template Customization Link */}
        <IonList style={{ marginBottom: '16px' }}>
          <IonItem button onClick={() => history.push('/templates')} detail>
            <IonIcon icon={colorPaletteOutline} slot="start" color="primary" />
            <IonLabel>
              <h2>Invoice Template</h2>
              <p>Customize colors, layout, and labels</p>
            </IonLabel>
          </IonItem>
        </IonList>

        <IonAccordionGroup multiple={true} value={['business']}>
          {/* Business Info */}
          <IonAccordion value="business">
            <IonItem slot="header" color="light">
              <IonIcon icon={businessOutline} slot="start" />
              <IonLabel>Business Information</IonLabel>
            </IonItem>
            <div slot="content">
              <IonList>
                <IonItem>
                  <IonLabel position="stacked">Business Name</IonLabel>
                  <IonInput
                    value={formData.name || ''}
                    onIonInput={(e) => handleChange('name', e.detail.value)}
                    placeholder="Your business name"
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Phone</IonLabel>
                  <IonInput
                    value={formData.phone || ''}
                    onIonInput={(e) => handleChange('phone', e.detail.value)}
                    placeholder="Business phone number"
                    type="tel"
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Email</IonLabel>
                  <IonInput
                    value={formData.email || ''}
                    onIonInput={(e) => handleChange('email', e.detail.value)}
                    placeholder="Business email"
                    type="email"
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Address</IonLabel>
                  <IonTextarea
                    value={formData.address || ''}
                    onIonInput={(e) => handleChange('address', e.detail.value)}
                    placeholder="Business address"
                    rows={3}
                  />
                </IonItem>
              </IonList>
            </div>
          </IonAccordion>

          {/* GST Settings */}
          <IonAccordion value="gst">
            <IonItem slot="header" color="light">
              <IonIcon icon={receiptOutline} slot="start" />
              <IonLabel>GST Settings</IonLabel>
            </IonItem>
            <div slot="content">
              <IonList>
                <IonItem>
                  <IonLabel>Enable GST</IonLabel>
                  <IonToggle
                    checked={formData.gstEnabled || false}
                    onIonChange={(e) => handleChange('gstEnabled', e.detail.checked)}
                  />
                </IonItem>
                {formData.gstEnabled && (
                  <>
                    <IonItem>
                      <IonLabel position="stacked">GSTIN</IonLabel>
                      <IonInput
                        value={formData.gstin || ''}
                        onIonInput={(e) => handleChange('gstin', e.detail.value?.toUpperCase())}
                        placeholder="15-digit GSTIN"
                        maxlength={15}
                      />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">State Code</IonLabel>
                      <IonInput
                        value={formData.stateCode || ''}
                        onIonInput={(e) => handleChange('stateCode', e.detail.value)}
                        placeholder="e.g., MH, KA, DL"
                        maxlength={2}
                      />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Default Tax Rate (%)</IonLabel>
                      <IonInput
                        value={formData.defaultTaxRate || ''}
                        onIonInput={(e) => handleChange('defaultTaxRate', parseFloat(e.detail.value) || null)}
                        placeholder="e.g., 18"
                        type="number"
                      />
                    </IonItem>
                  </>
                )}
              </IonList>
            </div>
          </IonAccordion>

          {/* Bank Details */}
          <IonAccordion value="bank">
            <IonItem slot="header" color="light">
              <IonIcon icon={cardOutline} slot="start" />
              <IonLabel>Bank & Payment Details</IonLabel>
            </IonItem>
            <div slot="content">
              <IonList>
                <IonItem>
                  <IonLabel position="stacked">Bank Name</IonLabel>
                  <IonInput
                    value={formData.bankName || ''}
                    onIonInput={(e) => handleChange('bankName', e.detail.value)}
                    placeholder="Bank name"
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Account Number</IonLabel>
                  <IonInput
                    value={formData.accountNumber || ''}
                    onIonInput={(e) => handleChange('accountNumber', e.detail.value)}
                    placeholder="Account number"
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">IFSC Code</IonLabel>
                  <IonInput
                    value={formData.ifscCode || ''}
                    onIonInput={(e) => handleChange('ifscCode', e.detail.value?.toUpperCase())}
                    placeholder="IFSC code"
                    maxlength={11}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">UPI ID</IonLabel>
                  <IonInput
                    value={formData.upiId || ''}
                    onIonInput={(e) => handleChange('upiId', e.detail.value)}
                    placeholder="yourname@upi"
                  />
                </IonItem>
              </IonList>
            </div>
          </IonAccordion>

          {/* Invoice Defaults */}
          <IonAccordion value="invoice">
            <IonItem slot="header" color="light">
              <IonIcon icon={documentTextOutline} slot="start" />
              <IonLabel>Invoice Defaults</IonLabel>
            </IonItem>
            <div slot="content">
              <IonList>
                <IonItem>
                  <IonLabel position="stacked">Invoice Prefix</IonLabel>
                  <IonInput
                    value={formData.invoicePrefix || ''}
                    onIonInput={(e) => handleChange('invoicePrefix', e.detail.value)}
                    placeholder="e.g., INV-"
                    maxlength={10}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Next Invoice Number</IonLabel>
                  <IonInput
                    value={formData.nextInvoiceNumber || ''}
                    onIonInput={(e) => handleChange('nextInvoiceNumber', parseInt(e.detail.value) || null)}
                    placeholder="e.g., 1"
                    type="number"
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Default Notes</IonLabel>
                  <IonTextarea
                    value={formData.defaultNotes || ''}
                    onIonInput={(e) => handleChange('defaultNotes', e.detail.value)}
                    placeholder="Notes to appear on every invoice"
                    rows={3}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Default Terms</IonLabel>
                  <IonTextarea
                    value={formData.defaultTerms || ''}
                    onIonInput={(e) => handleChange('defaultTerms', e.detail.value)}
                    placeholder="Terms & conditions"
                    rows={3}
                  />
                </IonItem>
              </IonList>
            </div>
          </IonAccordion>
        </IonAccordionGroup>

        {/* Logout */}
        <div style={{ padding: '20px' }}>
          <IonButton
            expand="block"
            fill="outline"
            color="danger"
            onClick={handleLogout}
          >
            <IonIcon icon={logOutOutline} slot="start" />
            Logout
          </IonButton>
        </div>
      </IonContent>

      {/* Upgrade Prompt Modal */}
      <UpgradePrompt 
        isOpen={showUpgrade} 
        onClose={() => setShowUpgrade(false)}
        usage={planUsage}
      />
    </IonPage>
  )
}
