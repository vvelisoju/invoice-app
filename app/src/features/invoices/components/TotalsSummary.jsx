import { IonText } from '@ionic/react'

export default function TotalsSummary({ subtotal, discountTotal, taxRate, taxTotal, total }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value || 0)
  }

  return (
    <div style={{
      background: '#f5f5f5',
      borderRadius: '8px',
      padding: '16px',
      marginTop: '16px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <IonText color="medium">Subtotal</IonText>
        <span>{formatCurrency(subtotal)}</span>
      </div>

      {discountTotal > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <IonText color="medium">Discount</IonText>
          <IonText color="danger">-{formatCurrency(discountTotal)}</IonText>
        </div>
      )}

      {taxRate > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <IonText color="medium">Tax ({taxRate}%)</IonText>
          <span>{formatCurrency(taxTotal)}</span>
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        paddingTop: '12px',
        borderTop: '1px solid #ddd',
        marginTop: '8px'
      }}>
        <strong style={{ fontSize: '18px' }}>Total</strong>
        <strong style={{ fontSize: '20px', color: 'var(--ion-color-primary)' }}>
          {formatCurrency(total)}
        </strong>
      </div>
    </div>
  )
}
