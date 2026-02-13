import { useEffect, useRef } from 'react'
import { useHistory } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { isFirebaseConfigured, initFirebaseMessaging, requestPushPermission, onForegroundMessage } from '../../lib/firebase'
import { isNativePlatform, initCapacitorPush } from '../../lib/capacitorPush'

/**
 * Hook to initialize push notifications for authenticated users.
 * - Native (iOS/Android): Uses Capacitor PushNotifications plugin.
 * - Web: Uses Firebase Cloud Messaging with service worker.
 * - Requests permission + registers FCM token on first mount.
 * - Listens for foreground messages and refetches notification queries.
 * - Handles notification click deep-linking.
 */
export function usePushNotifications() {
  const history = useHistory()
  const queryClient = useQueryClient()
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    let unsubMessage = () => {}

    async function setup() {
      // ── Native (Capacitor) ──────────────────────────────────────
      if (isNativePlatform()) {
        await initCapacitorPush({
          onNotificationReceived: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
          },
          onNotificationTapped: (data) => {
            if (data?.route) history.push(data.route)
          },
        })
        return
      }

      // ── Web (Firebase) ──────────────────────────────────────────
      if (!isFirebaseConfigured()) return

      const ok = await initFirebaseMessaging()
      if (!ok) return

      // Request permission (shows browser prompt)
      await requestPushPermission()

      // Listen for foreground messages → refetch notification data
      unsubMessage = onForegroundMessage(() => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
      })
    }

    setup()

    // Listen for notification click messages from service worker (web only)
    function handleSWMessage(event) {
      if (event.data?.type === 'NOTIFICATION_CLICK' && event.data.route) {
        history.push(event.data.route)
      }
    }
    if (!isNativePlatform()) {
      navigator.serviceWorker?.addEventListener('message', handleSWMessage)
    }

    return () => {
      unsubMessage()
      if (!isNativePlatform()) {
        navigator.serviceWorker?.removeEventListener('message', handleSWMessage)
      }
    }
  }, [history, queryClient])
}
