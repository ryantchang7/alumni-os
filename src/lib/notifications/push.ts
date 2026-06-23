/**
 * Web Push delivery for the Clubhouse. Mirrors the env-gated no-op pattern in
 * src/lib/turnstile.ts: inert until VAPID keys are set, so in-app
 * notifications work with no keys and nothing breaks when keys are absent.
 *
 * Required env vars (set ALL THREE to turn Web Push ON):
 *   VAPID_PUBLIC_KEY   — server VAPID public key (URL-safe base64)
 *   VAPID_PRIVATE_KEY  — server VAPID private key (URL-safe base64; SERVER ONLY)
 *   VAPID_SUBJECT      — a 'mailto:' or 'https:' contact; defaults to
 *                        'mailto:clubhouse@penngolfclubhouse.com' when unset.
 *
 * The client also needs the public key exposed to the browser to subscribe.
 * Set NEXT_PUBLIC_VAPID_PUBLIC_KEY to the SAME value as VAPID_PUBLIC_KEY (the
 * /api/push/public-key route falls back to VAPID_PUBLIC_KEY if the public var
 * is unset, but the NEXT_PUBLIC_ one is the documented client value).
 *
 * Generate a key pair once and reuse it forever:
 *   npx web-push generate-vapid-keys
 *
 * FAIL-SAFE by design: if keys are unset, sendPush() returns early (no-op).
 * If a send rejects, we swallow it and never throw — a push failure must
 * never break the caller (claim approve, moment post, etc.). When a push
 * service reports a subscription is gone (404/410), we prune that dead
 * subscription from the store.
 */

import webpush, { WebPushError } from 'web-push'
import type { PushSubscriptionRecord } from '@/lib/store/types'

const DEFAULT_SUBJECT = 'mailto:clubhouse@penngolfclubhouse.com'

interface VapidConfig {
  publicKey: string
  privateKey: string
  subject: string
}

/** Returns the VAPID config when fully configured, else null (no-op mode). */
function getVapidConfig(): VapidConfig | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return null
  const subject = process.env.VAPID_SUBJECT || DEFAULT_SUBJECT
  return { publicKey, privateKey, subject }
}

/** True when Web Push is configured (both VAPID keys present). */
export function isPushConfigured(): boolean {
  return getVapidConfig() !== null
}

/** The JSON payload the service worker's `push` handler expects. */
export interface PushPayload {
  title: string
  body: string
  href?: string
  /** Lets repeated notifications of the same kind collapse on the device. */
  tag?: string
}

/**
 * Send a Web Push notification to every supplied subscription for one
 * recipient. NO-OP when VAPID keys are unset. Never throws — failures are
 * logged. Returns the endpoints that came back 404/410 (dead) so the caller
 * can prune them; the typical caller is notify(), which prunes for us.
 */
export async function sendPush(
  subscriptions: PushSubscriptionRecord[],
  payload: PushPayload,
): Promise<{ sent: number; deadEndpoints: string[] }> {
  const deadEndpoints: string[] = []
  const config = getVapidConfig()
  // Not configured → no-op so in-app notifications still work and nothing
  // breaks until keys are added (identical to having no Web Push at all).
  if (!config) return { sent: 0, deadEndpoints }
  if (subscriptions.length === 0) return { sent: 0, deadEndpoints }

  const body = JSON.stringify(payload)
  let sent = 0

  await Promise.all(
    subscriptions.map(async sub => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          body,
          {
            vapidDetails: {
              subject: config.subject,
              publicKey: config.publicKey,
              privateKey: config.privateKey,
            },
            TTL: 60 * 60 * 24, // keep for a day if the device is offline
          },
        )
        sent++
      } catch (err) {
        // 404 (Not Found) / 410 (Gone) → the subscription no longer exists at
        // the push service. Mark it for pruning.
        if (err instanceof WebPushError && (err.statusCode === 404 || err.statusCode === 410)) {
          deadEndpoints.push(sub.endpoint)
        } else {
          console.warn('[push] send failed (non-fatal):', err)
        }
      }
    }),
  )

  return { sent, deadEndpoints }
}
