import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'

/**
 * Open an external URL in the appropriate browser.
 * - Native (iOS/Android): Opens in-app browser via @capacitor/browser
 * - Web: Opens in a new tab via window.open
 *
 * @param {string} url - The URL to open
 * @param {object} [options]
 * @param {string} [options.windowTarget] - window.open target (web only, default '_blank')
 */
export async function openExternalUrl(url, options = {}) {
  if (!url) return

  if (Capacitor.isNativePlatform()) {
    try {
      await Browser.open({ url, presentationStyle: 'popover' })
    } catch (err) {
      console.error('[NativeBrowser] Failed to open URL:', err.message)
    }
    return
  }

  // Web fallback
  window.open(url, options.windowTarget || '_blank')
}

/**
 * Open a print preview window with HTML content.
 * On native, this is a no-op (print is handled via share sheet for PDFs).
 * On web, opens a new window with the HTML and triggers print.
 *
 * @param {string} html - Full HTML document string
 * @param {object} [options]
 * @param {number} [options.width] - Window width (default 900)
 * @param {number} [options.height] - Window height (default 700)
 * @param {boolean} [options.autoPrint] - Auto-trigger print (default true)
 * @param {boolean} [options.autoClose] - Auto-close after print (default false)
 */
export function openPrintWindow(html, options = {}) {
  if (Capacitor.isNativePlatform()) {
    // On native, report printing is not supported via window.open.
    // Users should export to CSV and share instead.
    console.info('[NativeBrowser] Print window not available on native — use CSV export')
    return null
  }

  const width = options.width || 900
  const height = options.height || 700
  const w = window.open('', '_blank', `width=${width},height=${height}`)
  if (!w) return null

  w.document.write(html)
  w.document.close()
  w.focus()

  if (options.autoPrint !== false) {
    setTimeout(() => {
      w.print()
      if (options.autoClose) w.close()
    }, 400)
  }

  return w
}
