/**
 * Notification fan-out. One entry point the trigger sites call after an event
 * (claim approved, request sent, moment posted, …). Two layers run together:
 *   1. an in-app notification row (the NavBar bell), and
 *   2. a Web Push send to that account's subscriptions (no-op until VAPID keys
 *      are set — see src/lib/notifications/push.ts).
 *
 * EVERYTHING here is wrapped in try/catch and NEVER throws. A notification
 * failure must not break the action that triggered it. Callers should still
 * `await` these (so a serverless function doesn't terminate before the work
 * finishes) but can ignore the result.
 */

import {
  addNotification,
  addNotifications,
  getPushSubscriptionsForAccount,
  prunePushSubscriptionsByEndpoints,
  readStore,
} from '@/lib/store/local-store'
import { sendPush } from '@/lib/notifications/push'
import type { AppNotification } from '@/lib/store/types'

export interface NotifyPayload {
  type: AppNotification['type']
  title: string
  body: string
  href?: string
}

/** True for community broadcasts that the community-mute toggle suppresses. */
function isCommunityType(type: AppNotification['type']): boolean {
  return type === 'new_member' || type === 'new_moment' || type === 'spotlight'
}

/**
 * Notify a single recipient: store an in-app notification, then fire Web Push
 * to their subscriptions and prune any that come back dead. Never throws.
 */
export async function notify(
  recipientAccountId: string,
  payload: NotifyPayload,
): Promise<void> {
  try {
    await addNotification({
      accountId: recipientAccountId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      href: payload.href,
    })
  } catch (err) {
    console.warn('[notify] failed to store in-app notification (non-fatal):', err)
  }

  try {
    const subs = await getPushSubscriptionsForAccount(recipientAccountId)
    if (subs.length > 0) {
      const { deadEndpoints } = await sendPush(subs, {
        title: payload.title,
        body: payload.body,
        href: payload.href,
        tag: payload.type,
      })
      if (deadEndpoints.length > 0) {
        await prunePushSubscriptionsByEndpoints(deadEndpoints)
      }
    }
  } catch (err) {
    console.warn('[notify] push send failed (non-fatal):', err)
  }
}

/**
 * Broadcast to many recipients (new member joined, new moment posted).
 * Community broadcasts skip accounts that muted community updates; personal
 * types (request, approved) ignore the mute. Recipients are de-duplicated and
 * the caller can pass an `excludeAccountId` to avoid notifying the actor.
 * Never throws.
 */
/** The push half of notify(), without the per-recipient store write. */
async function pushOnly(recipientAccountId: string, payload: NotifyPayload): Promise<void> {
  try {
    const subs = await getPushSubscriptionsForAccount(recipientAccountId)
    if (subs.length === 0) return
    const { deadEndpoints } = await sendPush(subs, {
      title: payload.title,
      body: payload.body,
      href: payload.href,
      tag: payload.type,
    })
    if (deadEndpoints.length > 0) await prunePushSubscriptionsByEndpoints(deadEndpoints)
  } catch (err) {
    console.warn('[notifyMany] push failed (non-fatal):', err)
  }
}

export async function notifyMany(
  recipientAccountIds: string[],
  payload: NotifyPayload,
  opts: { excludeAccountId?: string } = {},
): Promise<void> {
  try {
    let recipients = Array.from(new Set(recipientAccountIds.filter(Boolean)))
    if (opts.excludeAccountId) {
      recipients = recipients.filter(id => id !== opts.excludeAccountId)
    }
    if (recipients.length === 0) return

    // For community broadcasts, drop anyone who muted community updates.
    if (isCommunityType(payload.type)) {
      const store = await readStore()
      const mutedById = new Map(
        store.accounts.map(a => [a.id, a.mutedCommunityNotifications === true] as const),
      )
      recipients = recipients.filter(id => !mutedById.get(id))
      if (recipients.length === 0) return
    }

    // Store every row in ONE write. The old path called notify() per person,
    // and each of those rewrites the whole store blob — a 200-member fan-out
    // was 200 concurrent CAS writes racing one revision key, most of which
    // lost, retried six times, threw, and were silently swallowed.
    try {
      await addNotifications(
        recipients.map(id => ({
          accountId: id,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          href: payload.href,
        })),
      )
    } catch (err) {
      console.warn('[notifyMany] batched store write failed (non-fatal):', err)
    }

    // Push is per-subscription and doesn't touch the store, so it can stay
    // parallel — but bound the concurrency so we don't open 200 sockets.
    const CHUNK = 20
    for (let i = 0; i < recipients.length; i += CHUNK) {
      await Promise.all(recipients.slice(i, i + CHUNK).map(id => pushOnly(id, payload)))
    }
  } catch (err) {
    console.warn('[notifyMany] broadcast failed (non-fatal):', err)
  }
}
