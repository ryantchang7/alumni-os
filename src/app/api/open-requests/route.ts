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
  readStore,
} from '@/lib/store/local-store'
import { notifyMany } from '@/lib/notifications/notify'
import { enrichmentStateToCode, CODE_TO_NAME } from '@/lib/map/state-lookup'
import type { OpenRequestIntent } from '@/lib/store/types'

const TEAM_SLUG = 'penn-mens-golf'

const INTENT_LABEL: Record<OpenRequestIntent, string> = {
  round: 'a round',
  drinks: 'drinks',
  coffee: 'coffee',
  dinner: 'dinner',
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** yyyy-mm-dd → "Aug 3" (no Date() so no timezone drift). */
function fmtDate(iso: string): string {
  const [, m, d] = iso.split('-')
  const mi = Number(m) - 1
  return mi >= 0 && mi < 12 ? `${MONTHS[mi]} ${Number(d)}` : iso
}

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

  // The active loop: ping Penn Golf alumni in the same area so a post actually
  // reaches someone. Matches on home state (reliable) or, failing that, city
  // text. In-app bell + web push + email (email no-ops until Resend is set).
  try {
    const store = await readStore()
    const enrichByPerson = new Map(
      store.personEnrichments.filter(e => e.teamId === team.id).map(e => [e.personId, e]),
    )
    const posterHomeCourse =
      (account.linkedPersonId && enrichByPerson.get(account.linkedPersonId)?.homeCourse) || null
    const reqCityLc = city?.toLowerCase()

    const recipientAccounts = store.accounts.filter(a => {
      if (!a.linkedPersonId || a.id === account.id) return false
      const e = enrichByPerson.get(a.linkedPersonId)
      if (!e) return false
      if (state) return enrichmentStateToCode(e.state) === state
      if (reqCityLc) return (e.city ?? '').toLowerCase().trim() === reqCityLc
      return false
    })

    if (recipientAccounts.length > 0) {
      const intentLabel = INTENT_LABEL[intent as OpenRequestIntent]
      const placeText = city
        ? state
          ? `${city}, ${state}`
          : city
        : state
          ? CODE_TO_NAME[state] ?? state
          : 'the area'
      const whenText = startDate
        ? endDate && endDate !== startDate
          ? `${fmtDate(startDate)}–${fmtDate(endDate)}`
          : fmtDate(startDate)
        : undefined
      const href = intent === 'round' ? '/the-course' : '/19th-hole'

      await notifyMany(recipientAccounts.map(a => a.id), {
        type: 'nearby_request',
        title: `${req.fromName} is around ${placeText}`,
        body: `Up for ${intentLabel}${whenText ? ` (${whenText})` : ''}${guestFeesOffered ? ' · covering guest fees' : ''}`,
        href,
      })

      const withEmail = recipientAccounts.filter(a => a.email)
      if (withEmail.length > 0) {
        const { sendEmail } = await import('@/lib/email/send')
        const { renderNearbyRequestEmail } = await import('@/lib/email/templates')
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://penngolfclubhouse.com'
        const url = `${baseUrl}${href}`
        await Promise.all(
          withEmail.map(a => {
            const { subject, html } = renderNearbyRequestEmail({
              recipientFirstName: a.name?.split(' ')[0] ?? null,
              fromName: req.fromName,
              intentLabel,
              placeText,
              whenText,
              note,
              fromHomeCourse: posterHomeCourse,
              guestFeesOffered,
              url,
            })
            return sendEmail({ to: a.email, subject, html })
          }),
        )
      }
    }
  } catch (err) {
    console.warn('[open-requests] nearby notify failed (non-fatal):', err)
  }

  return NextResponse.json({ request: req }, { status: 201 })
}
