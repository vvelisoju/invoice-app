import { IonCard, IonCardContent, IonIcon, IonText, IonProgressBar } from '@ionic/react'
import { documentTextOutline, warningOutline } from 'ionicons/icons'

export default function PlanUsageCard({ usage, onUpgradeClick }) {
  if (!usage) return null

  const { plan, usage: usageData } = usage
  const percentage = plan?.monthlyInvoiceLimit 
    ? (usageData?.invoicesIssued / plan.monthlyInvoiceLimit) 
    : 0
  const isNearLimit = percentage >= 0.8
  const isAtLimit = percentage >= 1

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num || 0)
  }

  return (
    <IonCard style={{ margin: '0 0 16px 0' }}>
      <IonCardContent>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <IonIcon icon={documentTextOutline} color="primary" />
              <span style={{ fontWeight: '600' }}>{plan?.name || 'Free'} Plan</span>
            </div>
            <IonText color="medium" style={{ fontSize: '13px' }}>
              {formatNumber(usageData?.invoicesIssued)} of {formatNumber(plan?.monthlyInvoiceLimit)} invoices used
            </IonText>
          </div>
          
          {isNearLimit && (
            <IonIcon 
              icon={warningOutline} 
              color={isAtLimit ? 'danger' : 'warning'} 
              style={{ fontSize: '24px' }}
            />
          )}
        </div>

        <IonProgressBar 
          value={Math.min(percentage, 1)} 
          color={isAtLimit ? 'danger' : isNearLimit ? 'warning' : 'primary'}
          style={{ height: '8px', borderRadius: '4px' }}
        />

        {isAtLimit && (
          <div 
            style={{ 
              marginTop: '12px', 
              padding: '8px 12px', 
              background: '#ffebee', 
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <IonText color="danger" style={{ fontSize: '13px' }}>
              Limit reached. Upgrade to continue.
            </IonText>
            <a 
              onClick={onUpgradeClick}
              style={{ 
                color: 'var(--ion-color-primary)', 
                fontWeight: '600', 
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Upgrade
            </a>
          </div>
        )}

        {isNearLimit && !isAtLimit && (
          <div style={{ marginTop: '8px' }}>
            <IonText color="warning" style={{ fontSize: '12px' }}>
              {formatNumber(usageData?.invoicesRemaining)} invoices remaining this month
            </IonText>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  )
}
