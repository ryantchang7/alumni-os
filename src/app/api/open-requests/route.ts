/**
 * Open Requests — member-posted "I'm in town and want to do X" notes.
 *
 * GET  /api/open-requests?intent=round | drinks | coffee | dinner
 *      → list active open requests, optionally filtered to one intent
 *
 * POST /api/open-requests
 *      → create a new request (requires sign-in + linkedPersonId)
 *
 * Locker-room style audience gating isn't relevant here — open requests
 * are visible to every approved member.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  createOpenRequest,
  getAccountById,
  getOpenRequestsForTeam,
  getTeamBySlug,
} from '@/lib/store/local-store'
import type { OpenRequestIntent } from '@/lib/store/types'

const TEAM_SLUG = 'penn-mens-golf'

const VALID_INTENTS: OpenRequestIntent[] = ['round', 'drinks', 'coffee', 'dinner']
function parseIntents(raw: string | null): OpenRequestIntent[] | undefined {
  if (!raw) return undefined
  const parts = raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean) as OpenRequestIntent[]
  const valid = parts.filter(p => (VALID_INTENTS as string[]).includes(p))
  return valid.length > 0 ? valid : undefined
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export async function GET(request: Request) {
  // Approved members only — names + travel windows shouldn't leak to the
  // open internet, even though the page surfaces are already gated.
  const session = await auth()
  if (!session?.accountId || !session.linkedPersonId) {
    return NextResponse.json({ error: 'Approved members only' }, { status: 403 })
  }
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ requests: [] })
  const { searchParams } = new URL(request.url)
  const intents = parseIntents(searchParams.get('intent'))
  const requests = await getOpenRequestsForTeam(team.id, intents)
  return NextResponse.json({ requests })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.accountId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }
  if (!session.linkedPersonId) {
    return NextResponse.json(
      { error: 'Approved members only — claim your card to post a request.' },
      { status: 403 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const intent = typeof body.intent === 'string' ? body.intent : ''
  if (!(VALID_INTENTS as string[]).includes(intent)) {
    return NextResponse.json({ error: 'intent must be round/drinks/coffee/dinner' }, { status: 400 })
  }

  const note = typeof body.note === 'string' ? body.note.trim() : ''
  if (!note) return NextResponse.json({ error: 'note required' }, { status: 400 })
  if (note.length > 400) return NextResponse.json({ error: 'note too long (400 max)' }, { status: 400 })

  const city = typeof body.city === 'string' ? body.city.trim().slice(0, 160) || undefined : undefined
  const state = typeof body.state === 'string'
    ? body.state.trim().toUpperCase().slice(0, 2) || undefined
    : undefined
  const startDate =
    typeof body.startDate === 'string' && ISO_DATE_RE.test(body.startDate)
      ? body.startDate
      : undefined
  const endDate =
    typeof body.endDate === 'string' && ISO_DATE_RE.test(body.endDate)
      ? body.endDate
      : undefined
  const guestFeesOffered = body.guestFeesOffered === true

  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const account = await getAccountById(session.accountId)
  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  const req = await createOpenRequest({
    teamId: team.id,
    fromAccountId: account.id,
    fromPersonId: account.linkedPersonId,
    fromName: account.name ?? session.user?.name ?? 'Penn Golf Member',
    intent: intent as OpenRequestIntent,
    city,
    state,
    startDate,
    endDate,
    note,
    guestFeesOffered,
  })

  return NextResponse.json({ request: req }, { status: 201 })
}
