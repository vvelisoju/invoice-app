import { useHistory } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { isNative } from '../lib/capacitor'

/**
 * Wrapper for legal/policy pages (Privacy, Terms, Refund, Contact).
 * On native: renders a simple header with back button (no LandingHeader/Footer).
 * On web: renders nothing — the page uses its own LandingHeader/Footer.
 */
export default function NativeLegalPageWrapper({ title, children }) {
  const history = useHistory()

  if (!isNative()) return null

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Native header with back button */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 safe-top">
        <div className="flex items-center h-14 px-3">
          <button
            onClick={() => history.goBack()}
            className="w-11 h-11 flex items-center justify-center rounded-lg text-textSecondary active:bg-gray-100 transition-colors -ml-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-textPrimary ml-1 truncate">{title}</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
