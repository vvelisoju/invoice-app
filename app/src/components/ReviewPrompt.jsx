import { useState } from 'react'
import { Star, X } from 'lucide-react'
import { openStoreListing, markReviewPrompted, dismissReviewPermanently } from '../lib/appReview'

/**
 * In-app review prompt modal.
 * Shows after the user has created enough invoices (controlled by appReview.js).
 * Offers: Rate Now, Later, Don't Ask Again.
 */
export default function ReviewPrompt({ isOpen, onClose }) {
  const [closing, setClosing] = useState(false)

  if (!isOpen) return null

  const handleRate = async () => {
    await openStoreListing()
    onClose()
  }

  const handleLater = () => {
    markReviewPrompted()
    onClose()
  }

  const handleDismiss = () => {
    dismissReviewPermanently()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={handleLater} />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in zoom-in-95 fade-in duration-200">
        <button
          onClick={handleLater}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-textSecondary active:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <Star className="w-7 h-7 text-amber-500" />
        </div>

        <h3 className="text-lg font-bold text-textPrimary mb-1">Enjoying Invoice Baba?</h3>
        <p className="text-sm text-textSecondary mb-6">
          Your feedback helps us improve. Would you mind taking a moment to rate us?
        </p>

        <div className="space-y-2">
          <button
            onClick={handleRate}
            className="w-full py-3 text-sm font-semibold text-white bg-primary active:bg-primaryHover md:hover:bg-primaryHover rounded-xl transition-colors"
          >
            Rate Now
          </button>
          <button
            onClick={handleLater}
            className="w-full py-3 text-sm font-medium text-textSecondary active:bg-gray-50 md:hover:bg-gray-50 rounded-xl transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={handleDismiss}
            className="w-full py-2 text-xs text-textSecondary/60 active:text-textSecondary transition-colors"
          >
            Don't ask again
          </button>
        </div>
      </div>
    </div>
  )
}
