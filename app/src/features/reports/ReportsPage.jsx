import { useState } from 'react'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonItem,
  IonText,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonIcon
} from '@ionic/react'
import { cashOutline, receiptOutline, trendingUpOutline } from 'ionicons/icons'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../lib/api'

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('summary')
  const [dateRange, setDateRange] = useState({
    from: getFirstDayOfMonth(),
    to: new Date().toISOString().split('T')[0]
  })

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['reports', 'summary', dateRange],
    queryFn: async () => {
      const response = await reportsApi.getSummary({
        dateFrom: dateRange.from,
        dateTo: dateRange.to
      })
      return response.data.data || response.data
    },
    enabled: activeTab === 'summary'
  })

  const { data: gstSummary, isLoading: gstLoading, refetch: refetchGST } = useQuery({
    queryKey: ['reports', 'gst', dateRange],
    queryFn: async () => {
      const response = await reportsApi.getGSTSummary({
        dateFrom: dateRange.from,
        dateTo: dateRange.to
      })
      return response.data.data || response.data
    },
    enabled: activeTab === 'gst'
  })

  const { data: trend, isLoading: trendLoading, refetch: refetchTrend } = useQuery({
    queryKey: ['reports', 'trend'],
    queryFn: async () => {
      const response = await reportsApi.getMonthlyTrend(6)
      return response.data.data || response.data
    },
    enabled: activeTab === 'trend'
  })

  const handleRefresh = async (event) => {
    if (activeTab === 'summary') await refetchSummary()
    else if (activeTab === 'gst') await refetchGST()
    else await refetchTrend()
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

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-')
    const date = new Date(year, parseInt(month) - 1)
    return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Reports</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={activeTab} onIonChange={(e) => setActiveTab(e.detail.value)}>
            <IonSegmentButton value="summary">
              <IonLabel>Summary</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="gst">
              <IonLabel>GST</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="trend">
              <IonLabel>Trend</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="ion-padding">
            {summaryLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <IonSpinner />
              </div>
            ) : (
              <>
                {/* Total Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <IonCard style={{ margin: 0 }}>
                    <IonCardContent style={{ textAlign: 'center', padding: '16px' }}>
                      <IonIcon icon={receiptOutline} style={{ fontSize: '24px', color: 'var(--ion-color-primary)' }} />
                      <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '8px' }}>
                        {summary?.totals?.invoiceCount || 0}
                      </div>
                      <IonText color="medium"><p style={{ margin: 0, fontSize: '12px' }}>Invoices</p></IonText>
                    </IonCardContent>
                  </IonCard>

                  <IonCard style={{ margin: 0 }}>
                    <IonCardContent style={{ textAlign: 'center', padding: '16px' }}>
                      <IonIcon icon={cashOutline} style={{ fontSize: '24px', color: 'var(--ion-color-success)' }} />
                      <div style={{ fontSize: '20px', fontWeight: '700', marginTop: '8px', color: 'var(--ion-color-success)' }}>
                        {formatCurrency(summary?.totals?.total)}
                      </div>
                      <IonText color="medium"><p style={{ margin: 0, fontSize: '12px' }}>Total Revenue</p></IonText>
                    </IonCardContent>
                  </IonCard>
                </div>

                {/* Breakdown */}
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle style={{ fontSize: '16px' }}>Breakdown</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonList>
                      <IonItem>
                        <IonLabel>Subtotal</IonLabel>
                        <IonText slot="end">{formatCurrency(summary?.totals?.subtotal)}</IonText>
                      </IonItem>
                      <IonItem>
                        <IonLabel>Discounts</IonLabel>
                        <IonText slot="end" color="danger">-{formatCurrency(summary?.totals?.discountTotal)}</IonText>
                      </IonItem>
                      <IonItem>
                        <IonLabel>Tax Collected</IonLabel>
                        <IonText slot="end">{formatCurrency(summary?.totals?.taxTotal)}</IonText>
                      </IonItem>
                    </IonList>
                  </IonCardContent>
                </IonCard>

                {/* By Status */}
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle style={{ fontSize: '16px' }}>By Status</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonList>
                      {summary?.byStatus?.map((item) => (
                        <IonItem key={item.status}>
                          <IonLabel>
                            <h3>{item.status}</h3>
                            <p>{item.count} invoices</p>
                          </IonLabel>
                          <IonText slot="end" style={{ fontWeight: '600' }}>
                            {formatCurrency(item.total)}
                          </IonText>
                        </IonItem>
                      ))}
                    </IonList>
                  </IonCardContent>
                </IonCard>
              </>
            )}
          </div>
        )}

        {/* GST Tab */}
        {activeTab === 'gst' && (
          <div className="ion-padding">
            {gstLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <IonSpinner />
              </div>
            ) : (
              <>
                {/* GST Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <IonCard style={{ margin: 0 }}>
                    <IonCardContent style={{ textAlign: 'center', padding: '16px' }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Taxable Value</div>
                      <div style={{ fontSize: '18px', fontWeight: '700' }}>
                        {formatCurrency(gstSummary?.summary?.totalTaxableValue)}
                      </div>
                    </IonCardContent>
                  </IonCard>

                  <IonCard style={{ margin: 0 }}>
                    <IonCardContent style={{ textAlign: 'center', padding: '16px' }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Total GST</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--ion-color-primary)' }}>
                        {formatCurrency(gstSummary?.summary?.totalGST)}
                      </div>
                    </IonCardContent>
                  </IonCard>
                </div>

                {/* GST Breakup */}
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle style={{ fontSize: '16px' }}>GST Breakup</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonList>
                      <IonItem>
                        <IonLabel>CGST</IonLabel>
                        <IonText slot="end">{formatCurrency(gstSummary?.summary?.breakdown?.cgst)}</IonText>
                      </IonItem>
                      <IonItem>
                        <IonLabel>SGST</IonLabel>
                        <IonText slot="end">{formatCurrency(gstSummary?.summary?.breakdown?.sgst)}</IonText>
                      </IonItem>
                      <IonItem>
                        <IonLabel>IGST</IonLabel>
                        <IonText slot="end">{formatCurrency(gstSummary?.summary?.breakdown?.igst)}</IonText>
                      </IonItem>
                    </IonList>
                  </IonCardContent>
                </IonCard>

                {/* By Tax Rate */}
                {gstSummary?.byTaxRate?.length > 0 && (
                  <IonCard>
                    <IonCardHeader>
                      <IonCardTitle style={{ fontSize: '16px' }}>By Tax Rate</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <IonList>
                        {gstSummary.byTaxRate.map((item) => (
                          <IonItem key={item.taxRate}>
                            <IonLabel>
                              <h3>{item.taxRate}% GST</h3>
                              <p>{item.count} invoices • Taxable: {formatCurrency(item.taxableValue)}</p>
                            </IonLabel>
                            <IonText slot="end" style={{ fontWeight: '600' }}>
                              {formatCurrency(item.taxAmount)}
                            </IonText>
                          </IonItem>
                        ))}
                      </IonList>
                    </IonCardContent>
                  </IonCard>
                )}
              </>
            )}
          </div>
        )}

        {/* Trend Tab */}
        {activeTab === 'trend' && (
          <div className="ion-padding">
            {trendLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <IonSpinner />
              </div>
            ) : (
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle style={{ fontSize: '16px' }}>
                    <IonIcon icon={trendingUpOutline} style={{ marginRight: '8px' }} />
                    Last 6 Months
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    {trend?.map((item) => (
                      <IonItem key={item.month}>
                        <IonLabel>
                          <h3>{formatMonth(item.month)}</h3>
                          <p>{item.invoiceCount} invoices</p>
                        </IonLabel>
                        <div slot="end" style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '600' }}>{formatCurrency(item.totalAmount)}</div>
                          <IonText color="success" style={{ fontSize: '12px' }}>
                            Paid: {formatCurrency(item.paidAmount)}
                          </IonText>
                        </div>
                      </IonItem>
                    ))}
                  </IonList>
                </IonCardContent>
              </IonCard>
            )}
          </div>
        )}
      </IonContent>
    </IonPage>
  )
}

function getFirstDayOfMonth() {
  const date = new Date()
  date.setDate(1)
  return date.toISOString().split('T')[0]
}
