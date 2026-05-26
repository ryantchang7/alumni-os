// Clubhouse Moments — alumni-posted photos + captions.
// GET returns the published feed. POST creates a new moment (auth required).

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getTeamBySlug,
  getMomentsForTeam,
  createMoment,
  getAccountById,
} from '@/lib/store/local-store'

const TEAM_SLUG = 'penn-mens-golf'

export async function GET() {
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ moments: [] })
  const moments = await getMomentsForTeam(team.id)
  return NextResponse.json({ moments })
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

  const moment = await createMoment({
    teamId: team.id,
    postedByAccountId: account.id,
    postedByPersonId: account.linkedPersonId,
    postedByName: account.name ?? session.user?.name ?? 'Penn Golf Member',
    caption,
    photoUrl,
    mediaType,
    taggedPersonIds: Array.isArray(body.taggedPersonIds)
      ? (body.taggedPersonIds as unknown[]).filter((x): x is string => typeof x === 'string')
      : [],
  })

  return NextResponse.json({ moment }, { status: 201 })
}
