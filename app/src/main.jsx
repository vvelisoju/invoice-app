import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import { initCapacitor } from './lib/capacitor.js'

// Initialize native Capacitor plugins before React mounts.
// No-ops gracefully on web — all calls are gated behind isNativePlatform().
initCapacitor({
  onAppStateChange: ({ isActive }) => {
    // Refetch stale data when app returns to foreground
    if (isActive) {
      document.dispatchEvent(new CustomEvent('app:resume'))
    }
  },
  onDeepLink: ({ url }) => {
    // Extract path from deep link URL (e.g. invoicebaba://invoices/123 → /invoices/123)
    try {
      const parsed = new URL(url)
      const path = parsed.pathname || parsed.hash?.replace('#', '') || '/'
      // Push to React Router via custom event (picked up in App.jsx)
      document.dispatchEvent(new CustomEvent('app:deeplink', { detail: { path } }))
    } catch {
      // Ignore malformed URLs
    }
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)
