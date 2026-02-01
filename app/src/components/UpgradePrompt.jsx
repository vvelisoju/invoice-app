import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonText,
  IonList,
  IonItem,
  IonLabel,
  IonButtons
} from '@ionic/react'
import { closeOutline, rocketOutline, checkmarkCircle } from 'ionicons/icons'

export default function UpgradePrompt({ isOpen, onClose, usage }) {
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num || 0)
  }

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Upgrade Your Plan</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Limit Reached Message */}
        <div style={{
          textAlign: 'center',
          padding: '24px',
          background: '#fff3cd',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <IonIcon
            icon={rocketOutline}
            style={{ fontSize: '48px', color: '#856404', marginBottom: '12px' }}
          />
          <h2 style={{ margin: '0 0 8px 0', color: '#856404' }}>
            Monthly Limit Reached
          </h2>
          <IonText color="medium">
            <p style={{ margin: 0 }}>
              You've issued {formatNumber(usage?.invoicesIssued)} of {formatNumber(usage?.plan?.monthlyInvoiceLimit)} invoices this month.
            </p>
          </IonText>
        </div>

        {/* Current Plan */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            Current Plan
          </h3>
          <div style={{
            padding: '16px',
            background: '#f5f5f5',
            borderRadius: '8px'
          }}>
            <div style={{ fontWeight: '600', fontSize: '18px' }}>
              {usage?.plan?.name || 'Free'}
            </div>
            <IonText color="medium">
              <p style={{ margin: '4px 0 0 0' }}>
                {formatNumber(usage?.plan?.monthlyInvoiceLimit)} invoices/month
              </p>
            </IonText>
          </div>
        </div>

        {/* Upgrade Options */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            Upgrade Options
          </h3>
          
          <IonList style={{ borderRadius: '8px', overflow: 'hidden' }}>
            {/* Pro Plan */}
            <IonItem button detail>
              <IonLabel>
                <h2 style={{ fontWeight: '600' }}>Pro Plan</h2>
                <p>100 invoices/month</p>
              </IonLabel>
              <div slot="end" style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '600', color: 'var(--ion-color-primary)' }}>
                  ₹299/mo
                </div>
              </div>
            </IonItem>

            {/* Business Plan */}
            <IonItem button detail>
              <IonLabel>
                <h2 style={{ fontWeight: '600' }}>Business Plan</h2>
                <p>Unlimited invoices</p>
              </IonLabel>
              <div slot="end" style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '600', color: 'var(--ion-color-primary)' }}>
                  ₹599/mo
                </div>
              </div>
            </IonItem>
          </IonList>
        </div>

        {/* Benefits */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            Pro Benefits
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              'More invoices per month',
              'Priority support',
              'Custom branding',
              'Advanced reports'
            ].map((benefit, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IonIcon icon={checkmarkCircle} color="success" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <IonButton expand="block" size="large">
          Upgrade Now
        </IonButton>

        <IonButton expand="block" fill="clear" onClick={onClose}>
          Maybe Later
        </IonButton>
      </IonContent>
    </IonModal>
  )
}
