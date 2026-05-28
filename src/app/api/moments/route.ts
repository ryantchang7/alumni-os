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

const TEAM_SLUG = 'penn-mens-golf'

export async function GET() {
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
      { error: 'Approved members only — claim your card to post a Moment.' },
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
  const photoUrl = typeof body.photoUrl === 'string' ? body.photoUrl.trim() : ''
  if (!caption) {
    return NextResponse.json({ error: 'caption required' }, { status: 400 })
  }
  if (!photoUrl || !isValidMediaUrl(photoUrl)) {
    return NextResponse.json({ error: 'photoUrl must be a valid http(s) URL' }, { status: 400 })
  }
  if (caption.length > 800) {
    return NextResponse.json({ error: 'caption too long' }, { status: 400 })
  }

  // Resolve mediaType from the body, falling back to URL extension sniffing
  // so pasted video URLs still render as video without an explicit flag.
  let mediaType: 'image' | 'video' = 'image'
  if (body.mediaType === 'video' || body.mediaType === 'image') {
    mediaType = body.mediaType
  } else if (VIDEO_EXT_RE.test(photoUrl)) {
    mediaType = 'video'
  }

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
    audience,
    taggedPersonIds: Array.isArray(body.taggedPersonIds)
      ? (body.taggedPersonIds as unknown[]).filter((x): x is string => typeof x === 'string')
      : [],
  })

  return NextResponse.json({ moment }, { status: 201 })
}
