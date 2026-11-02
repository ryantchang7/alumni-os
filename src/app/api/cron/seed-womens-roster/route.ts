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
 *   women's team. The one field it will set on an existing membership is
 *   `publishedToNetwork`, and only from unset/false to true: the first run
 *   left it unset, which made every woman's profile page 404 even though
 *   her card was on the Team Room. It never clears the flag and never edits
 *   anything else, so it cannot overwrite a captain's correction.
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
  const published: string[] = []
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
      // The flag the profile page gates on. Their roster facts are already
      // public on the Team Room, /meet-the-team and the Member Book, so this
      // reveals nothing new; it only makes the detail page reachable, as it
      // is for every man on the roster.
      if (existing.publishedToNetwork !== true) {
        if (!dryRun) existing.publishedToNetwork = true
        published.push(entry.displayName)
      } else {
        alreadyThere.push(entry.displayName)
      }
      continue
    }

    const membership: TeamMembership = {
      id: crypto.randomUUID(),
      personId: person.id,
      teamId: team.id,
      memberRole: 'current_player',
      memberStatus: 'imported',
      publishedToNetwork: true,
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

  if (
    !dryRun &&
    (addedPeople.length > 0 || addedMemberships.length > 0 || published.length > 0)
  ) {
    await writeStore(store)
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    rosterSize: roster.length,
    addedPeople,
    addedMemberships,
    published,
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
