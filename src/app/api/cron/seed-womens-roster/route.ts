/**
 * Put the current Penn Women's Golf roster into the store, so the women's
 * Team Room shows a team rather than an empty state.
 *
 * Source is the women's Member Book, which was built from the rosters Penn
 * Athletics publishes: every member whose `membershipStatus` is the current
 * season. Nothing is invented here, and nothing is read from the network.
 *
 * Same shape as ensure-programs, for the same reason: production's KV
 * credentials are Sensitive and unreadable, so a narrow cron-authed route is
 * the only way to make this write from the repo.
 *
 * - It takes no input. The roster comes from the committed JSON.
 * - It creates a Person only when no person with that normalized name
 *   exists, using the store's own `normalizeName`, so it cannot duplicate
 *   anyone who is already there under either program.
 * - It creates a TeamMembership only when that person has none on the
 *   women's team. It never edits a membership that already exists, so it
 *   cannot overwrite anything a captain has since corrected.
 * - It touches only the women's team row.
 *
 * Auth: Authorization: Bearer <CRON_SECRET>, or a founder session.
 * `?dryRun=1` reports what it would write and writes nothing.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCronAuth } from '@/lib/cron-auth'
import { requireFounder } from '@/lib/auth/guards'
import { PROGRAMS } from '@/lib/teams/programs'
import { memberBookWomens } from '@/lib/member-book/data'
import type { Person, TeamMembership } from '@/lib/store/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/** The season whose roster counts as "current" in the women's book. */
const CURRENT_STATUS = 'active_2026_27'

async function runJob(req: NextRequest) {
  if (!checkCronAuth(req)) {
    const gate = await requireFounder()
    if (!gate.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const dryRun = req.nextUrl.searchParams.get('dryRun') === '1'

  const { readStore, writeStore, getTeamBySlug, normalizeName } = await import(
    '@/lib/store/local-store'
  )

  const team = await getTeamBySlug(PROGRAMS.womens.slug)
  if (!team) {
    return NextResponse.json(
      { error: 'No women’s team row. Run /api/cron/ensure-programs first.' },
      { status: 409 },
    )
  }

  const roster = memberBookWomens.members.filter(
    (m) => m.membershipStatus === CURRENT_STATUS,
  )

  const store = await readStore()
  const now = new Date().toISOString()
  const addedPeople: string[] = []
  const addedMemberships: string[] = []
  const alreadyThere: string[] = []

  for (const entry of roster) {
    const norm = normalizeName(entry.displayName)
    let person: Person | undefined = store.people.find((p) => p.normalizedName === norm)

    if (!person) {
      const parts = entry.displayName.trim().split(/\s+/)
      person = {
        id: crypto.randomUUID(),
        canonicalName: entry.displayName,
        normalizedName: norm,
        firstName: parts[0],
        lastName: parts.slice(1).join(' ') || undefined,
        createdAt: now,
      }
      if (!dryRun) store.people.push(person)
      addedPeople.push(entry.displayName)
    }

    const existing = store.teamMemberships.find(
      (m) => m.personId === person!.id && m.teamId === team.id,
    )
    if (existing) {
      alreadyThere.push(entry.displayName)
      continue
    }

    const membership: TeamMembership = {
      id: crypto.randomUUID(),
      personId: person.id,
      teamId: team.id,
      memberRole: 'current_player',
      memberStatus: 'imported',
      classYearEstimate: entry.profile.classYearEstimate ?? undefined,
      classLabel: entry.profile.latestRosterClass ?? undefined,
      hometown: entry.profile.hometown ?? undefined,
      highSchool: entry.profile.highSchool ?? undefined,
      rosterStartYear: entry.career.startYear ?? undefined,
      rosterEndYear: entry.career.finishYear ?? undefined,
      bioUrls: [],
      sourceUrls: [...entry.sources.sourceUrls],
      confidence: 1,
      createdAt: now,
      updatedAt: now,
    }
    if (!dryRun) store.teamMemberships.push(membership)
    addedMemberships.push(entry.displayName)
  }

  if (!dryRun && (addedPeople.length > 0 || addedMemberships.length > 0)) {
    await writeStore(store)
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    rosterSize: roster.length,
    addedPeople,
    addedMemberships,
    alreadyThere,
  })
}

export async function GET(req: NextRequest) {
  try {
    return await runJob(req)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  return GET(req)
}
