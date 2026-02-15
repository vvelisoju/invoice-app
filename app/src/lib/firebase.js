import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'
import { notificationApi } from './api'

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let app = null
let messaging = null
let initialized = false

/**
 * Check if Firebase Messaging is configured and supported.
 */
export function isFirebaseConfigured() {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId)
}

/**
 * Initialize Firebase app and messaging.
 * Returns false if not configured or not supported.
 */
export async function initFirebaseMessaging() {
  if (initialized) return !!messaging
  initialized = true

  if (!isFirebaseConfigured()) {
    console.info('[Firebase] Not configured — push notifications disabled')
    return false
  }

  try {
    const supported = await isSupported()
    if (!supported) {
      console.info('[Firebase] Messaging not supported in this browser')
      return false
    }

    app = initializeApp(firebaseConfig)
    messaging = getMessaging(app)
    console.info('[Firebase] Messaging initialized')
    return true
  } catch (err) {
    console.error('[Firebase] Init failed:', err.message)
    return false
  }
}

/**
 * Request notification permission and get FCM token.
 * Registers the token with the backend.
 * Returns the token string or null.
 */
export async function requestPushPermission() {
  if (!messaging) {
    const ok = await initFirebaseMessaging()
    if (!ok) return null
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.info('[Firebase] Notification permission denied')
      return null
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
    if (!vapidKey) {
      console.warn('[Firebase] VITE_FIREBASE_VAPID_KEY not set — cannot get token')
      return null
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js'),
    })

    if (token) {
      // Register with backend
      try {
        await notificationApi.registerDeviceToken({ token, platform: 'web' })
        console.info('[Firebase] Token registered with backend')
      } catch (err) {
        console.error('[Firebase] Failed to register token with backend:', err.message)
      }
    }

    return token
  } catch (err) {
    console.error('[Firebase] requestPushPermission failed:', err.message)
    return null
  }
}

/**
 * Listen for foreground push messages.
 * Calls the callback with the message payload.
 * Returns an unsubscribe function.
 */
export function onForegroundMessage(callback) {
  if (!messaging) return () => {}
  return onMessage(messaging, (payload) => {
    console.info('[Firebase] Foreground message received:', payload)
    callback(payload)
  })
}

/**
 * Unregister device token on logout.
 */
export async function unregisterPushToken() {
  try {
    await notificationApi.removeDeviceToken({})
  } catch {
    // Non-critical
  }
}
