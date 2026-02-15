import { logger } from '../../common/logger.js'
import { processExpiredSubscriptions } from './service.js'

let cronInterval = null

/**
 * Start the subscription expiry cron job.
 * Runs every hour to check for expired subscriptions and downgrade them.
 */
export function startSubscriptionCron() {
  if (cronInterval) return

  // Run immediately on startup
  runExpiryCheck()

  // Then run every hour
  cronInterval = setInterval(runExpiryCheck, 60 * 60 * 1000)
  logger.info('[SubscriptionCron] Started — checking every hour')
}

export function stopSubscriptionCron() {
  if (cronInterval) {
    clearInterval(cronInterval)
    cronInterval = null
    logger.info('[SubscriptionCron] Stopped')
  }
}

async function runExpiryCheck() {
  try {
    const result = await processExpiredSubscriptions()
    if (result.processed > 0) {
      logger.info({ processed: result.processed }, '[SubscriptionCron] Processed expired subscriptions')
    }
  } catch (err) {
    logger.error({ err: err.message }, '[SubscriptionCron] Failed to process expired subscriptions')
  }
}
