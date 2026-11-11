/**
 * Roster years, corrected by the person who played them.
 *
 * POST /api/player/roster-correction  — a member fixes their own card
 * GET                                 — founder reads the queue
 * PATCH                               — founder approves or declines
 *
 * Peyton Wallace had to email Ryan to say the Clubhouse had him down for
 * two seasons instead of four, and fixing it took a code change. He is
 * right about his own playing years and nobody else ever will be, so the
 * member says it and a captain confirms it.
 *
 * A member may only correct the card their own account is linked to. The
 * books are never written: an approved correction is an overlay, and it
 * also writes the member's TeamMembership years so era matching agrees
 * with the card.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { requireFounder } from '@/lib/auth/guards'
import {
  isPublicMember,
  getMemberStartYear,
  getMemberEndYear,
} from '@/lib/member-book/helpers'
import { findBookEntryForTeamStorePerson } from '@/lib/member-book/bridge'

export const dynamic = 'force-dynamic'

const TEAM_SLUG = 'penn-mens-golf'
/** Penn golf predates this, but a typo'd year should not become history. */
const EARLIEST = 1900

/** One rule set, so a captain cannot enter what a member is refused. */
function validateYears(startYear: number, endYear: number): string | null {
  const thisYear = new Date().getFullYear()
  if (!Number.isInteger(startYear) || !Number.isInteger(endYear)) {
    return 'Both years are required.'
  }
  if (startYear < EARLIEST || endYear < EARLIEST) return 'That start year looks wrong.'
  // +1 so a current player can say they finish next spring.
  if (endYear > thisYear + 1) return 'That end year is in the future.'
  if (endYear < startYear) return 'The end year is before the start year.'
  if (endYear - startYear > 10) return 'That is more than ten seasons.'
  return null
}

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

  const startYear = Number(body.startYear)
  const endYear = Number(body.endYear)
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : ''
  const thisYear = new Date().getFullYear()

  const invalid = validateYears(startYear, endYear)
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })

  const { readStore, getTeamBySlug, createRosterCorrection } = await import(
    '@/lib/store/local-store'
  )
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  // Their own card, resolved from their link rather than taken from the
  // request body: a member correcting somebody else's years is not a
  // feature.
  const store = await readStore()
  const person = store.people.find(p => p.id === session.linkedPersonId)
  if (!person) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  const entry = findBookEntryForTeamStorePerson(person.canonicalName)
  if (!entry || !isPublicMember(entry)) {
    return NextResponse.json(
      { error: 'Your card is not in the Member Book, so there are no years to correct.' },
      { status: 404 },
    )
  }

  const result = await createRosterCorrection({
    teamId: team.id,
    memberId: entry.id,
    requestedByAccountId: session.accountId,
    requestedByName: person.canonicalName,
    previousStartYear: getMemberStartYear(entry),
    previousEndYear: getMemberEndYear(entry),
    startYear,
    endYear,
    note: note || undefined,
  })

  if ('conflict' in result) {
    return NextResponse.json(
      { error: 'You already have a correction waiting for review.', correctionId: result.conflict.id },
      { status: 409 },
    )
  }

  // Tell the captains, the same way a claim does.
  try {
    const { notifyMany } = await import('@/lib/notifications/notify')
    // FOUNDER_EMAILS is the canonical list; manualCaptain alone would miss
    // Ryan, whose access is hardcoded rather than granted in the store.
    const { FOUNDER_EMAILS } = await import('@/lib/badges')
    const founders = store.accounts.filter(
      a => a.manualCaptain || FOUNDER_EMAILS.has((a.email ?? '').toLowerCase().trim()),
    )
    if (founders.length > 0) {
      await notifyMany(
        founders.map(a => a.id),
        {
          type: 'nearby_request',
          title: `${person.canonicalName} says their roster years are wrong`,
          body: `${result.previousStartYear ?? '?'}-${result.previousEndYear ?? '?'} should be ${startYear}-${endYear}`,
          href: '/internal/activity',
        },
      )
    }
  } catch {
    /* a failed notification must not fail the correction */
  }

  return NextResponse.json({ ok: true, correction: result })
}

/**
 * PUT — a captain sets years on any card, directly.
 *
 * Distinct from PATCH, which answers a member's request. Ryan holds
 * records nobody else does (the board roster identified Stacy Kress as
 * the women's first recruit, 1999-2003, years that appear in no roster
 * Penn publishes), so he needs to enter them without a member having to
 * ask first. Still founder only, still audited, still an overlay.
 */
export async function PUT(request: Request) {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const memberId = typeof body.memberId === 'string' ? body.memberId : ''
  const startYear = Number(body.startYear)
  const endYear = Number(body.endYear)
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : ''
  if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })

  const bad = validateYears(startYear, endYear)
  if (bad) return NextResponse.json({ error: bad }, { status: 400 })

  const { getMemberById } = await import('@/lib/member-book/data')
  const entry = getMemberById(memberId)
  if (!entry || !isPublicMember(entry)) {
    return NextResponse.json({ error: 'Member Book entry not found' }, { status: 404 })
  }

  const { getTeamBySlug, setRosterYearsForBookEntry } = await import(
    '@/lib/store/local-store'
  )
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const row = await setRosterYearsForBookEntry({
    teamId: team.id,
    memberId,
    displayName: entry.displayName,
    startYear,
    endYear,
    previousStartYear: getMemberStartYear(entry),
    previousEndYear: getMemberEndYear(entry),
    setByEmail: gate.email,
    note: note || undefined,
  })
  return NextResponse.json({ ok: true, correction: row })
}

export async function GET() {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response
  const { getTeamBySlug, getRosterCorrections } = await import('@/lib/store/local-store')
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  return NextResponse.json({ ok: true, corrections: await getRosterCorrections(team.id) })
}

export async function PATCH(request: Request) {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const correctionId = typeof body.correctionId === 'string' ? body.correctionId : ''
  if (!correctionId) {
    return NextResponse.json({ error: 'correctionId required' }, { status: 400 })
  }
  const approve = body.approve === true

  const { reviewRosterCorrection } = await import('@/lib/store/local-store')
  const row = await reviewRosterCorrection({
    correctionId,
    approve,
    reviewedByEmail: gate.email,
  })
  if (!row) return NextResponse.json({ error: 'Correction not found' }, { status: 404 })
  return NextResponse.json({ ok: true, correction: row })
}
