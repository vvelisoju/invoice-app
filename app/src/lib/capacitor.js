import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { Keyboard } from '@capacitor/keyboard'
import { Network } from '@capacitor/network'

/**
 * Centralized Capacitor native plugin initialization.
 * All native-only code is gated behind isNativePlatform() checks.
 * Safe to call on web — every function no-ops gracefully.
 */

let _networkStatus = { connected: true, connectionType: 'wifi' }
let _networkListeners = []

// ── Public helpers ──────────────────────────────────────────────────

export function isNative() {
  return Capacitor.isNativePlatform()
}

export function getPlatform() {
  return Capacitor.getPlatform() // 'ios' | 'android' | 'web'
}

/**
 * Current network status (reactive via listeners).
 */
export function getNetworkStatus() {
  return _networkStatus
}

/**
 * Subscribe to network status changes.
 * Returns an unsubscribe function.
 */
export function onNetworkChange(callback) {
  _networkListeners.push(callback)
  return () => {
    _networkListeners = _networkListeners.filter(cb => cb !== callback)
  }
}

// ── Initialization ──────────────────────────────────────────────────

/**
 * Initialize all native Capacitor plugins.
 * Call once at app startup (main.jsx), before React renders.
 *
 * @param {object} options
 * @param {function} options.onBackButton - Called on Android hardware back press.
 *   Receives { canGoBack: boolean }. Return true to prevent default (exit).
 * @param {function} options.onAppStateChange - Called with { isActive: boolean }
 * @param {function} options.onDeepLink - Called with { url: string }
 */
export async function initCapacitor({ onBackButton, onAppStateChange, onDeepLink } = {}) {
  if (!isNative()) return

  // ── Status Bar ──────────────────────────────────────────────────
  try {
    await StatusBar.setStyle({ style: Style.Light })
    if (getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#FFFFFF' })
      await StatusBar.setOverlaysWebView({ overlay: true })
    }
  } catch (err) {
    console.warn('[Capacitor] StatusBar init failed:', err.message)
  }

  // ── Splash Screen ─────────────────────────────────────────────
  try {
    // Hide splash after a short delay to let the WebView render
    await SplashScreen.hide({ fadeOutDuration: 300 })
  } catch (err) {
    console.warn('[Capacitor] SplashScreen hide failed:', err.message)
  }

  // ── Keyboard (iOS) ────────────────────────────────────────────
  try {
    if (getPlatform() === 'ios') {
      await Keyboard.setAccessoryBarVisible({ isVisible: true })
      await Keyboard.setScroll({ isDisabled: false })
    }
  } catch (err) {
    console.warn('[Capacitor] Keyboard init failed:', err.message)
  }

  // ── Android Back Button ───────────────────────────────────────
  if (getPlatform() === 'android') {
    App.addListener('backButton', ({ canGoBack }) => {
      if (onBackButton) {
        const handled = onBackButton({ canGoBack })
        if (handled) return
      }
      if (canGoBack) {
        window.history.back()
      } else {
        App.exitApp()
      }
    })
  }

  // ── App State Change (foreground/background) ──────────────────
  App.addListener('appStateChange', ({ isActive }) => {
    onAppStateChange?.({ isActive })
  })

  // ── Deep Links (appUrlOpen) ───────────────────────────────────
  App.addListener('appUrlOpen', ({ url }) => {
    onDeepLink?.({ url })
  })

  // ── Network Status ────────────────────────────────────────────
  try {
    const status = await Network.getStatus()
    _networkStatus = status
    Network.addListener('networkStatusChange', (status) => {
      _networkStatus = status
      _networkListeners.forEach(cb => {
        try { cb(status) } catch {}
      })
    })
  } catch (err) {
    console.warn('[Capacitor] Network init failed:', err.message)
  }

  console.info(`[Capacitor] Initialized on ${getPlatform()}`)
}
