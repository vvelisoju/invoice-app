import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'
import { isNative, getNetworkStatus, onNetworkChange } from '../lib/capacitor'

/**
 * Shows a persistent banner when the device is offline.
 * On native: uses Capacitor Network plugin (real-time updates).
 * On web: uses navigator.onLine + online/offline events.
 */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(() => {
    if (isNative()) return !getNetworkStatus().connected
    return typeof navigator !== 'undefined' ? !navigator.onLine : false
  })

  useEffect(() => {
    if (isNative()) {
      // Capacitor Network listener
      const unsubscribe = onNetworkChange((status) => {
        setOffline(!status.connected)
      })
      return unsubscribe
    }

    // Web fallback
    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="bg-amber-500 text-white px-3 py-1.5 flex items-center justify-center gap-2 text-xs font-medium z-50 shrink-0">
      <WifiOff className="w-3.5 h-3.5" />
      You are offline. Some features may be unavailable.
    </div>
  )
}
