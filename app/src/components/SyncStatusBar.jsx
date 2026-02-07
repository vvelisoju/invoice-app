import { useEffect } from 'react'
import { CloudOff, RefreshCw, CheckCircle, Loader2 } from 'lucide-react'
import { useSyncStore } from '../store/syncStore'

export default function SyncStatusBar() {
  const { isOnline, isSyncing, pendingCount, init } = useSyncStore()

  useEffect(() => {
    init()
  }, [init])

  if (!isOnline) {
    return (
      <div className="flex items-center justify-center gap-2 py-2 bg-yellow-50 border-b border-yellow-300 text-yellow-700 text-xs">
        <CloudOff className="w-3.5 h-3.5" />
        Offline {pendingCount > 0 && `• ${pendingCount} pending`}
      </div>
    )
  }

  if (isSyncing) {
    return (
      <div className="flex items-center justify-center gap-2 py-2 bg-blue-50 border-b border-blue-300 text-blue-700 text-xs">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Syncing...
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-2 bg-amber-50 border-b border-amber-300 text-amber-700 text-xs">
        <RefreshCw className="w-3.5 h-3.5" />
        {pendingCount} changes pending sync
      </div>
    )
  }

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
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
        <CloudOff className="w-3 h-3" /> Offline
      </span>
    )
  }

  if (isSyncing) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
        <Loader2 className="w-3 h-3 animate-spin" /> Syncing
      </span>
    )
  }

  if (pendingCount > 0) {
    return (
      <button onClick={triggerSync} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200 hover:bg-yellow-200 transition-colors">
        <RefreshCw className="w-3 h-3" /> {pendingCount}
      </button>
    )
  }

  return (
    <button onClick={triggerSync} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 transition-colors">
      <CheckCircle className="w-3 h-3" /> {formatLastSync(lastSyncAt)}
    </button>
  )
}
