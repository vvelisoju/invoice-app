import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { notificationApi } from './api'

/**
 * Check if running on a native platform (iOS/Android).
 */
export function isNativePlatform() {
  return Capacitor.isNativePlatform()
}

/**
 * Initialize Capacitor push notifications for native platforms.
 * Requests permission, registers for push, and sends the FCM token to the backend.
 * Also sets up listeners for notification received/tapped events.
 *
 * @param {object} options
 * @param {function} options.onNotificationReceived - Called when a push is received in foreground
 * @param {function} options.onNotificationTapped - Called when user taps a notification (with data)
 */
export async function initCapacitorPush({ onNotificationReceived, onNotificationTapped } = {}) {
  if (!isNativePlatform()) return false

  try {
    // Check / request permission
    let permStatus = await PushNotifications.checkPermissions()
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions()
    }
    if (permStatus.receive !== 'granted') {
      console.info('[CapacitorPush] Permission not granted')
      return false
    }

    // Register with APNs / FCM
    await PushNotifications.register()

    // Listen for registration success → send token to backend
    PushNotifications.addListener('registration', async (token) => {
      const platform = Capacitor.getPlatform() // 'ios' or 'android'
      try {
        await notificationApi.registerDeviceToken({ token: token.value, platform })
        console.info('[CapacitorPush] Token registered:', platform)
      } catch (err) {
        console.error('[CapacitorPush] Failed to register token:', err.message)
      }
    })

    // Listen for registration errors
    PushNotifications.addListener('registrationError', (err) => {
      console.error('[CapacitorPush] Registration error:', err)
    })

    // Foreground notification received
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.info('[CapacitorPush] Foreground notification:', notification)
      onNotificationReceived?.(notification)
    })

    // Notification tapped (from background or killed state)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.info('[CapacitorPush] Notification tapped:', action)
      const data = action.notification?.data || {}
      onNotificationTapped?.(data)
    })

    console.info('[CapacitorPush] Initialized successfully')
    return true
  } catch (err) {
    console.error('[CapacitorPush] Init failed:', err.message)
    return false
  }
}

/**
 * Remove all Capacitor push listeners (call on logout).
 */
export async function removeCapacitorPushListeners() {
  if (!isNativePlatform()) return
  try {
    await PushNotifications.removeAllListeners()
  } catch {
    // Non-critical
  }
}
