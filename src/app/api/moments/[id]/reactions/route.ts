/**
 * Moment reactions — GET (list) + POST (toggle one emoji).
 *
 * Locker-room gate matches comments: if the parent Moment is
 * 'locker-room', only viewers who pass canSeeLockerRoom can read or
 * react.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getAccountById,
  getReactionsForMoment,
  toggleMomentReaction,
  readStore,
  getTeamBySlug,
} from '@/lib/store/local-store'
import { canSeeLockerRoomForAccount } from '@/lib/access/locker-room'

const TEAM_SLUG = 'penn-mens-golf'

// A small allow-list of emoji that gates pasted/script input. We allow
// any single grapheme that's purely emoji + variation/skin-tone modifiers
// (Unicode property `Extended_Pictographic`). This is intentionally loose:
// we want users to react with any emoji their device can produce, while
// still rejecting plain-text drive-by input.
const EMOJI_RE = /^[\p{Extended_Pictographic}\p{Emoji_Modifier_Base}\p{Emoji_Component}\p{Emoji_Modifier}‍️]+$/u

interface Ctx {
  params: Promise<{ id: string }>
}

async function viewerCanSeeMoment(
  momentId: string,
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return { ok: false, status: 404, error: 'Team not found' }
  const store = await readStore()
  const moment = store.moments.find(m => m.id === momentId && m.status === 'published')
  if (!moment) return { ok: false, status: 404, error: 'Moment not found' }
  if (moment.audience !== 'locker-room') return { ok: true }
  const session = await auth()
  if (!session?.accountId) return { ok: false, status: 403, error: 'Locker Room, sign in required' }
  const account = await getAccountById(session.accountId)
  if (!canSeeLockerRoomForAccount(account, store, team.id)) {
    return { ok: false, status: 403, error: 'Locker Room, players + alumni only' }
  }
  return { ok: true }
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const gate = await viewerCanSeeMoment(id)
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }
  const reactions = await getReactionsForMoment(id)
  return NextResponse.json({ reactions })
}

export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const session = await auth()
  if (!session?.accountId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }
  if (!session.linkedPersonId) {
    return NextResponse.json(
      { error: 'Approved members only, claim your card to react.' },
      { status: 403 },
    )
  }
  const gate = await viewerCanSeeMoment(id)
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const emoji = typeof body.emoji === 'string' ? body.emoji.trim() : ''
  if (!emoji || emoji.length > 16 || !EMOJI_RE.test(emoji)) {
    return NextResponse.json({ error: 'invalid emoji' }, { status: 400 })
  }

  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const result = await toggleMomentReaction({
    momentId: id,
    teamId: team.id,
    fromAccountId: session.accountId,
    emoji,
  })

  return NextResponse.json(result)
}
