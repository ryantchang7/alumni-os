/**
 * Captain of the team, not captain of the site.
 *
 * POST  /api/player/team-captain  — a member says they captained their own
 *                                   team. Pending until a human agrees.
 * PUT                             — founder records one on any card
 * PATCH                           — founder approves or declines a request
 * GET                             — founder reads every row
 *
 * `/api/internal/roles` grants site captaincy: who can approve claims. This
 * route records history instead, and the two must never be confused.
 * Nothing here changes what anybody is allowed to do.
 *
 * Why a member can only ask: a card that read "Team Captain" because its
 * owner typed it would be worth nothing to the people reading it. But a
 * member is often the only source there will ever be — Penn printed no
 * captain for the men's 1983-91 club seasons, and nothing at all about the
 * women before 1999 until Melissa Maurer wrote it down — so refusing to
 * hear it would lose the record entirely. They tell us; a human agrees.
 * Same shape as a roster-year correction, for the same reason.
 *
 * Penn's published lists are in `src/lib/member-book/penn-captains.ts`. A
 * row written here overlays them, so a captaincy mentioned in an email is
 * on the card the same afternoon, and a Penn row matched to the wrong
 * person can be suppressed without a deploy.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { requireFounder } from '@/lib/auth/guards'
import { isPublicMember, getMemberStartYear, getMemberEndYear } from '@/lib/member-book/helpers'
import { findBookEntryForTeamStorePerson } from '@/lib/member-book/bridge'

export const dynamic = 'force-dynamic'

/**
 * Corrections and captaincies share a team row. The Member Book spans both
 * programs and the store has one team behind it, which is why the roster
 * correction route is also hardcoded to this slug for a women's card.
 */
const TEAM_SLUG = 'penn-mens-golf'
const EARLIEST = 1900

/**
 * Years are season-END years and must be plausible seasons. An empty list
 * is allowed: it is how a captaincy whose year nobody remembers is
 * recorded, and with no note it is how a row is withdrawn.
 */
function validateYears(years: unknown): { years: number[] } | { error: string } {
  if (!Array.isArray(years)) return { error: 'years must be a list.' }
  if (years.length > 6) return { error: 'That is more than six seasons as captain.' }
  const thisYear = new Date().getFullYear()
  const out: number[] = []
  for (const raw of years) {
    const y = Number(raw)
    if (!Number.isInteger(y)) return { error: `"${String(raw)}" is not a year.` }
    if (y < EARLIEST) return { error: `${y} is too early to be a Penn Golf season.` }
    // +1 so the season now under way can be recorded.
    if (y > thisYear + 1) return { error: `${y} is in the future.` }
    out.push(y)
  }
  return { years: [...new Set(out)].sort((a, b) => a - b) }
}

export async function PUT(request: Request) {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const memberId = typeof body.memberId === 'string' ? body.memberId.trim() : ''
  if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : ''
  // Co-captain unless told otherwise is wrong in the other direction, so
  // this is opt-in and the form asks.
  const shared = body.shared === true

  const checked = validateYears(body.years ?? [])
  if ('error' in checked) return NextResponse.json({ error: checked.error }, { status: 400 })
  const years = checked.years

  const { getMemberById } = await import('@/lib/member-book/data')
  const entry = getMemberById(memberId)
  if (!entry || !isPublicMember(entry)) {
    return NextResponse.json({ error: 'Member Book entry not found' }, { status: 404 })
  }

  // A captaincy outside the career on the card is usually a typo, and a
  // typo'd year becomes history. It is only a warning, though: the books
  // routinely hold a shorter span than the person played, which is the
  // entire reason roster corrections exist, and Melissa Aylor's card said
  // 2004-2005 for a career that started in 2001.
  const start = getMemberStartYear(entry)
  const end = getMemberEndYear(entry)
  const outside =
    start && end ? years.filter(y => y < start || y > end).map(String) : []

  const { getTeamBySlug, setTeamCaptaincy } = await import('@/lib/store/local-store')
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const row = await setTeamCaptaincy({
    teamId: team.id,
    memberId,
    displayName: entry.displayName,
    years,
    shared: shared || undefined,
    note: note || undefined,
    setByEmail: gate.email,
  })

  return NextResponse.json({
    ok: true,
    captaincy: row,
    ...(outside.length > 0
      ? {
          warning: `${outside.join(', ')} ${
            outside.length === 1 ? 'is' : 'are'
          } outside the ${start}-${end} on this card. Saved anyway; the card's span may be the thing that is short.`,
        }
      : {}),
  })
}

/**
 * POST — a member says they captained their own team.
 *
 * Their card is resolved from their account link, never taken from the
 * request body: a member recording a captaincy on somebody else's card is
 * not a feature.
 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.accountId || !session.linkedPersonId) {
    return NextResponse.json({ error: 'Claim your card first' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : ''
  const shared = body.shared === true
  const checked = validateYears(body.years ?? [])
  if ('error' in checked) return NextResponse.json({ error: checked.error }, { status: 400 })
  const years = checked.years
  // A member with no years and no note has told us nothing. The founder
  // form allows that pair as a withdrawal; a request cannot be one.
  if (years.length === 0 && !note) {
    return NextResponse.json(
      { error: 'Which season, or a note about the years if you are not sure?' },
      { status: 400 },
    )
  }

  const { readStore, getTeamBySlug, requestTeamCaptaincy } = await import(
    '@/lib/store/local-store'
  )
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const store = await readStore()
  const person = store.people.find(p => p.id === session.linkedPersonId)
  if (!person) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  const entry = findBookEntryForTeamStorePerson(person.canonicalName)
  if (!entry || !isPublicMember(entry)) {
    return NextResponse.json(
      { error: 'Your card is not in the Member Book yet, so there is nothing to add this to.' },
      { status: 404 },
    )
  }

  const result = await requestTeamCaptaincy({
    teamId: team.id,
    memberId: entry.id,
    displayName: entry.displayName,
    years,
    shared: shared || undefined,
    note: note || undefined,
    requestedByAccountId: session.accountId,
    requestedByName: person.canonicalName,
  })

  if ('conflict' in result) {
    return NextResponse.json(
      {
        error:
          'Your card already records a captaincy. If the seasons on it are wrong, reply to the weekly note and Ryan will fix it.',
      },
      { status: 409 },
    )
  }

  try {
    const { notifyMany } = await import('@/lib/notifications/notify')
    const { FOUNDER_EMAILS } = await import('@/lib/badges')
    const founders = store.accounts.filter(
      a => a.manualCaptain || FOUNDER_EMAILS.has((a.email ?? '').toLowerCase().trim()),
    )
    if (founders.length > 0) {
      const { formatCaptainSeasons } = await import('@/lib/member-book/team-captains')
      const seasons = formatCaptainSeasons(years)
      await notifyMany(
        founders.map(a => a.id),
        {
          type: 'nearby_request',
          title: `${person.canonicalName} says they captained the team`,
          body: seasons ? `${seasons}. Confirm it on their card.` : 'Confirm it on their card.',
          href: `/member-book/${encodeURIComponent(entry.id)}`,
        },
      )
    }
  } catch {
    /* a failed notification must not fail the request */
  }

  return NextResponse.json({ ok: true, captaincy: result })
}

/** PATCH — founder approves or declines a member's request. */
export async function PATCH(request: Request) {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const captaincyId = typeof body.captaincyId === 'string' ? body.captaincyId : ''
  if (!captaincyId) {
    return NextResponse.json({ error: 'captaincyId required' }, { status: 400 })
  }

  const { reviewTeamCaptaincy } = await import('@/lib/store/local-store')
  const row = await reviewTeamCaptaincy({
    captaincyId,
    approve: body.approve === true,
    reviewedByEmail: gate.email,
  })
  if (!row) return NextResponse.json({ error: 'Captaincy not found' }, { status: 404 })
  return NextResponse.json({ ok: true, captaincy: row })
}

export async function GET() {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response
  const { getTeamBySlug, listTeamCaptaincies } = await import('@/lib/store/local-store')
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  return NextResponse.json({ ok: true, captaincies: await listTeamCaptaincies(team.id) })
}
