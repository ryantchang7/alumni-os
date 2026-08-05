// Clubhouse Moments — alumni-posted photos + captions.
// GET returns the published feed (filtered by viewer's Locker Room
// eligibility). POST creates a new moment (auth required).

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getTeamBySlug,
  getMomentsForTeam,
  createMoment,
  getAccountById,
  readStore,
} from '@/lib/store/local-store'
import { canSeeLockerRoomForAccount } from '@/lib/access/locker-room'
import { notifyMany } from '@/lib/notifications/notify'
import { resolveTaggedAccountIds } from '@/lib/moments/tagging'
import { getApprovalState } from '@/lib/access/approval'

const TEAM_SLUG = 'penn-mens-golf'

export async function GET() {
  // Member-written content — approved members only; empty for everyone else.
  const approval = await getApprovalState()
  if (!approval.approved) return NextResponse.json({ moments: [] })

  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ moments: [] })

  const moments = await getMomentsForTeam(team.id)

  // Filter Locker-Room-only Moments out for viewers who aren't in the
  // Locker Room cohort (coach, family, signed-out, pending users).
  const session = await auth()
  let canSeeLockerRoom = false
  if (session?.accountId) {
    const account = await getAccountById(session.accountId)
    const store = await readStore()
    canSeeLockerRoom = canSeeLockerRoomForAccount(account, store, team.id)
  }

  const visible = canSeeLockerRoom
    ? moments
    : moments.filter(m => m.audience !== 'locker-room')

  return NextResponse.json({ moments: visible })
}

function isValidMediaUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false
    return url.length <= 1024
  } catch {
    return false
  }
}

const VIDEO_EXT_RE = /\.(mp4|mov|m4v|webm)(\?|$)/i

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.accountId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }
  // Approved-members-only — pending users (signed in but no linkedPersonId
  // yet) cannot post Moments. Matches the gate on the rest of the actions.
  if (!session.linkedPersonId) {
    return NextResponse.json(
      { error: 'Approved members only, claim your card to post a Moment.' },
      { status: 403 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const caption = typeof body.caption === 'string' ? body.caption.trim() : ''
  if (!caption) {
    return NextResponse.json({ error: 'caption required' }, { status: 400 })
  }
  if (caption.length > 800) {
    return NextResponse.json({ error: 'caption too long' }, { status: 400 })
  }

  // Media: preferred form is `media: [{url, type}]` (multi photo/video, max 8).
  // Legacy single `photoUrl` (+ optional mediaType) still accepted. photoUrl/
  // mediaType always mirror media[0] for older readers.
  const sniffType = (url: string): 'image' | 'video' =>
    VIDEO_EXT_RE.test(url) ? 'video' : 'image'
  let media: { url: string; type: 'image' | 'video' }[] = []
  if (Array.isArray(body.media)) {
    media = (body.media as unknown[])
      .map((m) => {
        if (!m || typeof m !== 'object') return null
        const url = typeof (m as { url?: unknown }).url === 'string' ? (m as { url: string }).url.trim() : ''
        if (!url || !isValidMediaUrl(url)) return null
        const rawType = (m as { type?: unknown }).type
        const type: 'image' | 'video' =
          rawType === 'video' || rawType === 'image' ? rawType : sniffType(url)
        return { url, type }
      })
      .filter((m): m is { url: string; type: 'image' | 'video' } => m !== null)
      .slice(0, 8)
  }
  const legacyUrl = typeof body.photoUrl === 'string' ? body.photoUrl.trim() : ''
  if (media.length === 0 && legacyUrl && isValidMediaUrl(legacyUrl)) {
    const legacyType: 'image' | 'video' =
      body.mediaType === 'video' || body.mediaType === 'image'
        ? body.mediaType
        : sniffType(legacyUrl)
    media = [{ url: legacyUrl, type: legacyType }]
  }
  if (media.length === 0) {
    return NextResponse.json(
      { error: 'At least one photo or video is required.' },
      { status: 400 },
    )
  }
  const photoUrl = media[0].url
  const mediaType = media[0].type

  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const account = await getAccountById(session.accountId)
  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  // Audience: 'public' (default) or 'locker-room'. Locker-Room-only posts
  // require the poster to be in the Locker Room cohort (current player or
  // alumni). Coach and family cannot post into the Locker Room.
  let audience: 'public' | 'locker-room' = 'public'
  if (body.audience === 'locker-room') {
    const store = await readStore()
    if (!canSeeLockerRoomForAccount(account, store, team.id)) {
      return NextResponse.json(
        { error: 'Locker Room posts are for current players and alumni only.' },
        { status: 403 },
      )
    }
    audience = 'locker-room'
  }

  const moment = await createMoment({
    teamId: team.id,
    postedByAccountId: account.id,
    postedByPersonId: account.linkedPersonId,
    postedByName: account.name ?? session.user?.name ?? 'Penn Golf Member',
    caption,
    photoUrl,
    mediaType,
    media,
    audience,
    taggedPersonIds: Array.isArray(body.taggedPersonIds)
      ? (body.taggedPersonIds as unknown[]).filter((x): x is string => typeof x === 'string')
      : [],
    // Book-id tags cover the whole Member Book, claimed or not. Cap at 20.
    taggedBookIds: Array.isArray(body.taggedBookIds)
      ? (body.taggedBookIds as unknown[])
          .filter((x): x is string => typeof x === 'string')
          .slice(0, 20)
      : [],
  })

  // Broadcast new PUBLIC moments to the rest of the members (community type —
  // honors the mute; skips the poster). Locker-room-only moments are not
  // broadcast (they'd leak the post's existence to people who can't see it).
  // Additive; notifyMany swallows its own errors and never blocks the post.
  if (audience === 'public') {
    try {
      const fresh = await readStore()
      const posterFirst = (account.name ?? session.user?.name ?? 'A member').split(/\s+/)[0]
      // Tagged members get a personal "you were tagged" ping instead of the
      // community broadcast.
      const taggedAccountIds = resolveTaggedAccountIds(
        fresh,
        moment.taggedPersonIds ?? [],
        moment.taggedBookIds ?? [],
      )
      if (taggedAccountIds.size > 0) {
        await notifyMany(
          [...taggedAccountIds],
          {
            type: 'new_moment',
            title: `${posterFirst} tagged you in a Moment`,
            body: caption.slice(0, 120),
            href: '/moments',
          },
          { excludeAccountId: account.id },
        )
      }
      const recipients = fresh.accounts
        .filter(a => a.teamId === team.id && a.linkedPersonId && !taggedAccountIds.has(a.id))
        .map(a => a.id)
      await notifyMany(
        recipients,
        {
          type: 'new_moment',
          title: `${posterFirst} shared a Moment`,
          body: caption.slice(0, 120),
          href: '/moments',
        },
        { excludeAccountId: account.id },
      )
    } catch (e) {
      console.warn('[moment-notify] broadcast setup failed:', e)
    }
  }

  return NextResponse.json({ moment }, { status: 201 })
}
