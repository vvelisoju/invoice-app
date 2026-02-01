import { useEffect } from 'react'
import { IonChip, IonIcon, IonSpinner, IonText } from '@ionic/react'
import { cloudOutline, cloudOfflineOutline, syncOutline, checkmarkCircleOutline } from 'ionicons/icons'
import { useSyncStore } from '../store/syncStore'

export default function SyncStatusBar() {
  const { isOnline, isSyncing, lastSyncAt, pendingCount, init } = useSyncStore()

  useEffect(() => {
    init()
  }, [init])

  const formatLastSync = (dateStr) => {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    return date.toLocaleDateString()
  }

  if (!isOnline) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        background: '#fff3cd',
        borderBottom: '1px solid #ffc107'
      }}>
        <IonIcon icon={cloudOfflineOutline} style={{ marginRight: '8px', color: '#856404' }} />
        <IonText style={{ fontSize: '13px', color: '#856404' }}>
          Offline {pendingCount > 0 && `• ${pendingCount} pending`}
        </IonText>
      </div>
    )
  }

  if (isSyncing) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        background: '#e3f2fd',
        borderBottom: '1px solid #2196f3'
      }}>
        <IonSpinner name="crescent" style={{ width: '16px', height: '16px', marginRight: '8px' }} />
        <IonText style={{ fontSize: '13px', color: '#1565c0' }}>
          Syncing...
        </IonText>
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        background: '#fff8e1',
        borderBottom: '1px solid #ffb300'
      }}>
        <IonIcon icon={syncOutline} style={{ marginRight: '8px', color: '#ff8f00' }} />
        <IonText style={{ fontSize: '13px', color: '#ff8f00' }}>
          {pendingCount} changes pending sync
        </IonText>
      </div>
    )
  }

  // All synced - show minimal indicator
  return null
}

export function SyncStatusChip() {
  const { isOnline, isSyncing, lastSyncAt, pendingCount, init, triggerSync } = useSyncStore()

  useEffect(() => {
    init()
  }, [init])

  const formatLastSync = (dateStr) => {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    return date.toLocaleDateString()
  }

  if (!isOnline) {
    return (
      <IonChip color="warning" outline>
        <IonIcon icon={cloudOfflineOutline} />
        <span style={{ marginLeft: '4px' }}>Offline</span>
      </IonChip>
    )
  }

  if (isSyncing) {
    return (
      <IonChip color="primary" outline>
        <IonSpinner name="dots" style={{ width: '16px', height: '16px' }} />
        <span style={{ marginLeft: '4px' }}>Syncing</span>
      </IonChip>
    )
  }

  if (pendingCount > 0) {
    return (
      <IonChip color="warning" onClick={triggerSync}>
        <IonIcon icon={syncOutline} />
        <span style={{ marginLeft: '4px' }}>{pendingCount}</span>
      </IonChip>
    )
  }

  return (
    <IonChip color="success" outline onClick={triggerSync}>
      <IonIcon icon={checkmarkCircleOutline} />
      <span style={{ marginLeft: '4px' }}>{formatLastSync(lastSyncAt)}</span>
    </IonChip>
  )
}
