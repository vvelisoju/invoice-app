import { useHistory } from 'react-router-dom'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonText,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonButtons
} from '@ionic/react'
import { addOutline, documentTextOutline, cashOutline, timeOutline } from 'ionicons/icons'
import { useQuery } from '@tanstack/react-query'
import { businessApi } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import SyncStatusBar, { SyncStatusChip } from '../../components/SyncStatusBar'

export default function HomePage() {
  const history = useHistory()
  const business = useAuthStore((state) => state.business)

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['business', 'stats'],
    queryFn: async () => {
      const response = await businessApi.getStats()
      return response.data.data || response.data
    }
  })

  const handleRefresh = async (event) => {
    await refetch()
    event.detail.complete()
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{business?.name || 'Invoice App'}</IonTitle>
          <IonButtons slot="end">
            <SyncStatusChip />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <SyncStatusBar />

      <IonContent className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Quick Action */}
        <IonButton
          expand="block"
          size="large"
          onClick={() => history.push('/invoices/new')}
          style={{ marginBottom: '24px' }}
        >
          <IonIcon icon={addOutline} slot="start" />
          New Invoice
        </IonButton>

        {/* Stats Cards */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <IonSpinner />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Total Invoices */}
            <IonCard style={{ margin: 0 }}>
              <IonCardContent style={{ textAlign: 'center', padding: '16px' }}>
                <IonIcon
                  icon={documentTextOutline}
                  style={{ fontSize: '28px', color: 'var(--ion-color-primary)', marginBottom: '8px' }}
                />
                <div style={{ fontSize: '24px', fontWeight: '700' }}>
                  {stats?.totalInvoices || 0}
                </div>
                <IonText color="medium">
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Total Invoices</p>
                </IonText>
              </IonCardContent>
            </IonCard>

            {/* Drafts */}
            <IonCard style={{ margin: 0 }}>
              <IonCardContent style={{ textAlign: 'center', padding: '16px' }}>
                <IonIcon
                  icon={timeOutline}
                  style={{ fontSize: '28px', color: 'var(--ion-color-medium)', marginBottom: '8px' }}
                />
                <div style={{ fontSize: '24px', fontWeight: '700' }}>
                  {stats?.draftCount || 0}
                </div>
                <IonText color="medium">
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Drafts</p>
                </IonText>
              </IonCardContent>
            </IonCard>

            {/* Paid */}
            <IonCard style={{ margin: 0 }}>
              <IonCardContent style={{ textAlign: 'center', padding: '16px' }}>
                <IonIcon
                  icon={cashOutline}
                  style={{ fontSize: '28px', color: 'var(--ion-color-success)', marginBottom: '8px' }}
                />
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--ion-color-success)' }}>
                  {formatCurrency(stats?.paidAmount)}
                </div>
                <IonText color="medium">
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                    Paid ({stats?.paidCount || 0})
                  </p>
                </IonText>
              </IonCardContent>
            </IonCard>

            {/* Unpaid */}
            <IonCard style={{ margin: 0 }}>
              <IonCardContent style={{ textAlign: 'center', padding: '16px' }}>
                <IonIcon
                  icon={cashOutline}
                  style={{ fontSize: '28px', color: 'var(--ion-color-warning)', marginBottom: '8px' }}
                />
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--ion-color-warning)' }}>
                  {formatCurrency(stats?.unpaidAmount)}
                </div>
                <IonText color="medium">
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                    Unpaid ({stats?.unpaidCount || 0})
                  </p>
                </IonText>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* Quick Links */}
        <div style={{ marginTop: '24px' }}>
          <IonButton
            expand="block"
            fill="outline"
            onClick={() => history.push('/invoices')}
          >
            View All Invoices
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  )
}
