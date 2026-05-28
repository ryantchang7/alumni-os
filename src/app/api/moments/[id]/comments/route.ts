/**
 * Moment comments — GET (list) + POST (create). Threading is flat at one
 * level: pass `parentCommentId` to reply; the store flattens deeper
 * replies back to the original parent.
 *
 * Locker-room gate: if the parent Moment has audience === 'locker-room',
 * only viewers who pass canSeeLockerRoom can read or write.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getAccountById,
  getCommentsForMoment,
  createMomentComment,
  readStore,
  getTeamBySlug,
} from '@/lib/store/local-store'
import { canSeeLockerRoomForAccount } from '@/lib/access/locker-room'

const TEAM_SLUG = 'penn-mens-golf'

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
  if (!session?.accountId) return { ok: false, status: 403, error: 'Locker Room — sign in required' }
  const account = await getAccountById(session.accountId)
  if (!canSeeLockerRoomForAccount(account, store, team.id)) {
    return { ok: false, status: 403, error: 'Locker Room — players + alumni only' }
  }
  return { ok: true }
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const gate = await viewerCanSeeMoment(id)
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }
  const comments = await getCommentsForMoment(id)
  return NextResponse.json({ comments })
}

export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const session = await auth()
  if (!session?.accountId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }
  if (!session.linkedPersonId) {
    return NextResponse.json(
      { error: 'Approved members only — claim your card to comment.' },
      { status: 403 },
    )
  }

  // Locker Room gate (re-checked here for write — viewerCanSeeMoment also covers it).
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

  const text = typeof body.body === 'string' ? body.body.trim() : ''
  const parentCommentId =
    typeof body.parentCommentId === 'string' ? body.parentCommentId : undefined

  if (!text) {
    return NextResponse.json({ error: 'body required' }, { status: 400 })
  }
  if (text.length > 1000) {
    return NextResponse.json({ error: 'body too long' }, { status: 400 })
  }

  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const account = await getAccountById(session.accountId)
  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  const comment = await createMomentComment({
    momentId: id,
    teamId: team.id,
    fromAccountId: account.id,
    fromPersonId: account.linkedPersonId,
    fromName: account.name ?? session.user?.name ?? 'Penn Golf Member',
    body: text,
    parentCommentId,
  })

  return NextResponse.json({ comment }, { status: 201 })
}
