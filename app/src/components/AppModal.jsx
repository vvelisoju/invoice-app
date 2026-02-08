import { useEffect } from 'react'
import { X } from 'lucide-react'
import Portal from './Portal'

/**
 * Reusable modal — centered on desktop, bottom sheet on mobile.
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - title?: string
 * - children: ReactNode (modal body)
 * - actions?: ReactNode (footer buttons)
 * - maxWidth?: string (default 'max-w-md')
 */
export default function AppModal({ isOpen, onClose, title, children, actions, maxWidth = 'max-w-md' }) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <Portal>
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
      />

      {/* Desktop: centered modal */}
      <div className="hidden md:flex items-center justify-center absolute inset-0 p-4 pointer-events-none">
        <div className={`bg-white rounded-2xl shadow-xl w-full ${maxWidth} pointer-events-auto max-h-[90vh] flex flex-col`}>
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h2 className="text-lg font-semibold text-textPrimary">{title}</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-textSecondary hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
          {/* Footer actions */}
          {actions && (
            <div className="px-6 py-4 border-t border-border shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Mobile: bottom sheet */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 animate-slide-up" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}>
        <div className="bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col">
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
              <h3 className="text-base font-bold text-textPrimary">{title}</h3>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-textSecondary active:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {children}
          </div>
          {/* Footer actions */}
          {actions && (
            <div className="px-5 py-4 border-t border-border shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
    </Portal>
  )
}
