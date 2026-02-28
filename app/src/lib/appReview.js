import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'

const REVIEW_PROMPT_KEY = 'app_review_state'
const INVOICES_BEFORE_PROMPT = 5
const MIN_DAYS_BETWEEN_PROMPTS = 30

/**
 * Get the current review state from localStorage.
 */
function getReviewState() {
  try {
    const raw = localStorage.getItem(REVIEW_PROMPT_KEY)
    return raw ? JSON.parse(raw) : { invoiceCount: 0, lastPromptedAt: null, dismissed: false }
  } catch {
    return { invoiceCount: 0, lastPromptedAt: null, dismissed: false }
  }
}

function saveReviewState(state) {
  localStorage.setItem(REVIEW_PROMPT_KEY, JSON.stringify(state))
}

/**
 * Track an invoice creation event. Call this after a successful invoice save.
 * Returns true if the user should be prompted to review.
 */
export function trackInvoiceCreated() {
  if (!Capacitor.isNativePlatform()) return false

  const state = getReviewState()
  state.invoiceCount = (state.invoiceCount || 0) + 1
  saveReviewState(state)

  return shouldPromptReview()
}

/**
 * Check if conditions are met to prompt for a review.
 */
export function shouldPromptReview() {
  if (!Capacitor.isNativePlatform()) return false

  const state = getReviewState()

  // Don't prompt if user has permanently dismissed
  if (state.dismissed) return false

  // Need at least N invoices created
  if ((state.invoiceCount || 0) < INVOICES_BEFORE_PROMPT) return false

  // Don't prompt too frequently
  if (state.lastPromptedAt) {
    const daysSince = (Date.now() - state.lastPromptedAt) / (1000 * 60 * 60 * 24)
    if (daysSince < MIN_DAYS_BETWEEN_PROMPTS) return false
  }

  return true
}

/**
 * Mark that the review prompt was shown.
 */
export function markReviewPrompted() {
  const state = getReviewState()
  state.lastPromptedAt = Date.now()
  saveReviewState(state)
}

/**
 * Mark that the user permanently dismissed the review prompt.
 */
export function dismissReviewPermanently() {
  const state = getReviewState()
  state.dismissed = true
  saveReviewState(state)
}

/**
 * Open the app's store listing page for the user to leave a review.
 */
export async function openStoreListing() {
  const platform = Capacitor.getPlatform()

  if (platform === 'android') {
    await Browser.open({
      url: 'https://play.google.com/store/apps/details?id=com.codevel.invoicebaba',
      presentationStyle: 'popover',
    })
  } else if (platform === 'ios') {
    // Replace with actual App Store ID once available
    await Browser.open({
      url: 'https://apps.apple.com/app/invoice-baba/id0000000000',
      presentationStyle: 'popover',
    })
  }

  markReviewPrompted()
}
