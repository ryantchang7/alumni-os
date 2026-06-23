/**
 * GET /api/notifications — the signed-in member's own notifications, newest
 * first, with an unread count. Strictly scoped to the caller's account: the
 * store helper filters by accountId so a member can never read another
 * account's notifications.
 *
 * Also returns lightweight UI hints so the bell dropdown can render the
 * mute toggle and enable-push affordance without extra round-trips:
 *   mutedCommunity — whether the caller muted community broadcasts
 *   pushConfigured — whether Web Push is configured server-side (VAPID keys)
 */

import { NextResponse } from 'next/server'
import { requireApprovedMember } from '@/lib/auth/guards'
import { getNotificationsForAccount, getAccountById } from '@/lib/store/local-store'
import { isPushConfigured } from '@/lib/notifications/push'

export async function GET() {
  const g = await requireApprovedMember()
  if (!g.ok) return g.response

  const accountId = g.session.accountId!
  const { notifications, unreadCount } = await getNotificationsForAccount(accountId)
  const account = await getAccountById(accountId)

  return NextResponse.json({
    notifications,
    unreadCount,
    mutedCommunity: account?.mutedCommunityNotifications === true,
    pushConfigured: isPushConfigured(),
  })
}
