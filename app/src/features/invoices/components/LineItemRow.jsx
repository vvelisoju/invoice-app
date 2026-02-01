import {
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react'
import { trashOutline } from 'ionicons/icons'
import ProductTypeahead from './ProductTypeahead'

export default function LineItemRow({
  item,
  index,
  onUpdate,
  onRemove,
  onProductSelect,
  canRemove
}) {
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
      background: '#f9f9f9',
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '12px'
    }}>
      <IonGrid style={{ padding: 0 }}>
        <IonRow>
          <IonCol size="12">
            <ProductTypeahead
              value={item.name}
              onChange={(value) => onUpdate(index, 'name', value)}
              onSelect={(product) => onProductSelect(index, product)}
            />
          </IonCol>
        </IonRow>
        
        <IonRow style={{ marginTop: '8px' }}>
          <IonCol size="4">
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Qty</div>
            <IonInput
              type="number"
              inputmode="decimal"
              value={item.quantity}
              onIonInput={(e) => onUpdate(index, 'quantity', e.detail.value)}
              style={{
                '--background': 'white',
                '--padding-start': '8px',
                '--padding-end': '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
          </IonCol>
          
          <IonCol size="4">
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Rate (₹)</div>
            <IonInput
              type="number"
              inputmode="decimal"
              value={item.rate}
              onIonInput={(e) => onUpdate(index, 'rate', e.detail.value)}
              style={{
                '--background': 'white',
                '--padding-start': '8px',
                '--padding-end': '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
          </IonCol>
          
          <IonCol size="4" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Total</div>
              <div style={{ fontWeight: '600', fontSize: '16px' }}>
                {formatCurrency(item.lineTotal)}
              </div>
            </div>
            
            {canRemove && (
              <IonButton
                fill="clear"
                color="danger"
                size="small"
                onClick={() => onRemove(index)}
                style={{ '--padding-start': '4px', '--padding-end': '4px' }}
              >
                <IonIcon icon={trashOutline} />
              </IonButton>
            )}
          </IonCol>
        </IonRow>
      </IonGrid>
    </div>
  )
}
