import { useState } from 'react'
import { useHistory } from 'react-router-dom'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonText,
  IonChip,
  IonIcon,
  IonFab,
  IonFabButton,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSegment,
  IonSegmentButton
} from '@ionic/react'
import { addOutline, documentTextOutline } from 'ionicons/icons'
import { useInfiniteQuery } from '@tanstack/react-query'
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

export default function InvoiceListPage() {
  const history = useHistory()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  } = useInfiniteQuery({
    queryKey: ['invoices', searchQuery, statusFilter],
    queryFn: async ({ pageParam = 0 }) => {
      const params = {
        limit: 20,
        offset: pageParam,
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      }
      const response = await invoiceApi.list(params)
      return response.data
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((sum, page) => sum + (page.data?.length || 0), 0)
      if (lastPage.data?.length < 20) return undefined
      return totalFetched
    },
    initialPageParam: 0
  })

  const invoices = data?.pages.flatMap(page => page.data || []) || []

  const handleRefresh = async (event) => {
    await refetch()
    event.detail.complete()
  }

  const handleInfiniteScroll = async (event) => {
    if (hasNextPage) {
      await fetchNextPage()
    }
    event.target.complete()
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short'
    })
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Invoices</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            value={searchQuery}
            onIonInput={(e) => setSearchQuery(e.detail.value)}
            placeholder="Search invoices..."
            debounce={300}
          />
        </IonToolbar>
        <IonToolbar>
          <IonSegment
            value={statusFilter}
            onIonChange={(e) => setStatusFilter(e.detail.value)}
          >
            <IonSegmentButton value="all">
              <IonLabel>All</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="DRAFT">
              <IonLabel>Draft</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="ISSUED">
              <IonLabel>Issued</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="PAID">
              <IonLabel>Paid</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <IonSpinner />
          </div>
        ) : invoices.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '60px 20px',
            textAlign: 'center'
          }}>
            <IonIcon 
              icon={documentTextOutline} 
              style={{ fontSize: '64px', color: '#ccc', marginBottom: '16px' }} 
            />
            <h2 style={{ margin: '0 0 8px 0', color: '#666' }}>No invoices yet</h2>
            <IonText color="medium">
              <p>Create your first invoice to get started</p>
            </IonText>
          </div>
        ) : (
          <IonList>
            {invoices.map((invoice) => (
              <IonItem
                key={invoice.id}
                button
                onClick={() => history.push(`/invoices/${invoice.id}`)}
                detail
              >
                <IonLabel>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h2 style={{ fontWeight: '600', margin: '0 0 4px 0' }}>
                        #{invoice.invoiceNumber}
                      </h2>
                      <p style={{ margin: '0 0 4px 0', color: '#666' }}>
                        {invoice.customer?.name || 'No customer'}
                      </p>
                      <IonText color="medium" style={{ fontSize: '12px' }}>
                        {formatDate(invoice.date)}
                      </IonText>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                        {formatCurrency(invoice.total)}
                      </div>
                      <IonBadge color={STATUS_COLORS[invoice.status]}>
                        {STATUS_LABELS[invoice.status]}
                      </IonBadge>
                    </div>
                  </div>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}

        <IonInfiniteScroll
          onIonInfinite={handleInfiniteScroll}
          threshold="100px"
          disabled={!hasNextPage}
        >
          <IonInfiniteScrollContent
            loadingSpinner="bubbles"
            loadingText="Loading more..."
          />
        </IonInfiniteScroll>
      </IonContent>

      <IonFab vertical="bottom" horizontal="end" slot="fixed">
        <IonFabButton onClick={() => history.push('/invoices/new')}>
          <IonIcon icon={addOutline} />
        </IonFabButton>
      </IonFab>
    </IonPage>
  )
}
