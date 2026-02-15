import admin from 'firebase-admin'
import { config } from './config.js'
import { logger } from './logger.js'

let firebaseApp = null
let messagingInstance = null

/**
 * Initialize Firebase Admin SDK.
 * Returns false if credentials are not configured (graceful degradation).
 */
export function initFirebase() {
  if (firebaseApp) return true

  const sa = config.firebase.serviceAccount
  if (!sa) {
    logger.info('[Firebase] No service account configured — push notifications disabled')
    return false
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(sa),
    })
    messagingInstance = admin.messaging(firebaseApp)
    logger.info('[Firebase] Admin SDK initialized successfully')
    return true
  } catch (err) {
    logger.error({ err: err.message }, '[Firebase] Failed to initialize Admin SDK')
    firebaseApp = null
    messagingInstance = null
    return false
  }
}

/**
 * Check if Firebase is available for push delivery.
 */
export function isFirebaseEnabled() {
  return !!messagingInstance
}

/**
 * Send push notification to a list of FCM tokens.
 * Uses sendEachForMulticast for batches up to 500 tokens.
 *
 * @param {string[]} tokens - FCM device tokens
 * @param {object} payload - { title, body, data }
 * @returns {{ successCount, failureCount, staleTokens }}
 */
export async function sendPushToTokens(tokens, payload) {
  if (!messagingInstance) {
    return { successCount: 0, failureCount: 0, staleTokens: [] }
  }

  if (!tokens || tokens.length === 0) {
    return { successCount: 0, failureCount: 0, staleTokens: [] }
  }

  let totalSuccess = 0
  let totalFailure = 0
  const staleTokens = []

  // FCM supports max 500 tokens per multicast
  const BATCH_SIZE = 500
  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE)

    const message = {
      tokens: batch,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data
        ? Object.fromEntries(
            Object.entries(payload.data).map(([k, v]) => [k, String(v)])
          )
        : undefined,
      android: {
        priority: 'high',
        notification: {
          channelId: 'invoice_baba_default',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      webpush: {
        headers: { Urgency: 'high' },
        notification: {
          icon: '/assets/brand/icon.png',
          badge: '/assets/brand/favicon.png',
        },
      },
    }

    try {
      const response = await messagingInstance.sendEachForMulticast(message)
      totalSuccess += response.successCount
      totalFailure += response.failureCount

      // Identify stale tokens for cleanup
      response.responses.forEach((resp, idx) => {
        if (resp.error) {
          const code = resp.error.code
          // These error codes indicate the token is no longer valid
          if (
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/registration-token-not-registered'
          ) {
            staleTokens.push(batch[idx])
          }
        }
      })
    } catch (err) {
      logger.error(
        { err: err.message, batchSize: batch.length },
        '[Firebase] sendEachForMulticast failed'
      )
      totalFailure += batch.length
    }
  }

  return { successCount: totalSuccess, failureCount: totalFailure, staleTokens }
}
