/**
 * Captain of the team, not captain of the site.
 *
 * PUT  /api/player/team-captain  — founder records a captaincy on a card
 * GET                            — founder reads every one entered here
 *
 * `/api/internal/roles` grants site captaincy: who can approve claims.
 * This route records history instead, and the two must never be confused.
 * Nothing here changes what anybody is allowed to do.
 *
 * Founder only, and deliberately not member-editable. Roster years work the
 * other way round — the member knows their own span better than anyone, so
 * they file a correction and a captain confirms it. A captaincy is a claim
 * about standing in front of teammates, and a card that said "Team captain"
 * because its owner typed it would be worth nothing to the people reading it.
 * So it arrives the way Melissa Maurer's five did: from somebody who was
 * there, through Ryan, with the source attached.
 *
 * The committed list is `src/lib/member-book/team-captains.ts`. A row
 * written here overlays it so a captaincy mentioned in an email is on the
 * card the same afternoon.
 */

import { NextResponse } from 'next/server'
import { requireFounder } from '@/lib/auth/guards'
import { isPublicMember, getMemberStartYear, getMemberEndYear } from '@/lib/member-book/helpers'

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

export async function GET() {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response
  const { getTeamBySlug, listTeamCaptaincies } = await import('@/lib/store/local-store')
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  return NextResponse.json({ ok: true, captaincies: await listTeamCaptaincies(team.id) })
}
