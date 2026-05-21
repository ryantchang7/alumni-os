// Bootstrap a team-store record from a Member Book entry.
//
// The Member Book has 337 historical players. Only ~80 currently have
// editable team-store records. This endpoint creates that record on demand
// when an alum claims their own card from /member-book/[memberId].
//
// Idempotent: if a team-store person already exists for this book entry
// (matched by normalized canonical name), return that personId instead.

import { NextResponse } from 'next/server'
import { readStore, writeStore, getTeamBySlug } from '@/lib/store/local-store'
import { getMemberById } from '@/lib/member-book/data'
import { isPublicMember } from '@/lib/member-book/helpers'
import { findTeamStorePersonForBookEntry } from '@/lib/member-book/bridge'
import type {
  Person,
  TeamMembership,
  PersonEnrichment,
} from '@/lib/store/types'

const TEAM_SLUG = 'penn-mens-golf'

function splitName(displayName: string): { firstName?: string; lastName?: string } {
  const parts = displayName.trim().split(/\s+/)
  if (parts.length === 0) return {}
  if (parts.length === 1) return { firstName: parts[0] }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

function storeNormalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const bookId = typeof body.bookId === 'string' ? body.bookId : null
  if (!bookId) {
    return NextResponse.json(
      { error: 'Missing required field: bookId' },
      { status: 400 },
    )
  }

  const entry = getMemberById(bookId)
  if (!entry || !isPublicMember(entry)) {
    return NextResponse.json(
      { error: 'Member Book entry not found' },
      { status: 404 },
    )
  }

  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  }

  const store = await readStore()

  // Idempotent: if a team-store person already matches this book entry, return it.
  const existing = findTeamStorePersonForBookEntry(entry, store.people)
  if (existing) {
    const onThisTeam = store.teamMemberships.some(
      (m) => m.personId === existing.id && m.teamId === team.id,
    )
    if (onThisTeam) {
      return NextResponse.json({
        personId: existing.id,
        alreadyExisted: true,
      })
    }
  }

  // Create new records bootstrapped from the Member Book entry.
  const now = new Date().toISOString()
  const personId = existing?.id ?? crypto.randomUUID()
  const { firstName, lastName } = splitName(entry.displayName)

  if (!existing) {
    const newPerson: Person = {
      id: personId,
      canonicalName: entry.displayName,
      normalizedName: storeNormalizeName(entry.displayName),
      firstName,
      lastName,
      createdAt: now,
    }
    store.people.push(newPerson)
  }

  const newMembership: TeamMembership = {
    id: crypto.randomUUID(),
    personId,
    teamId: team.id,
    memberRole: 'alumni',
    memberStatus: 'verified',
    rosterStartYear: entry.career.startYear ?? entry.letterWinner.firstYear ?? undefined,
    rosterEndYear: entry.career.finishYear ?? entry.letterWinner.lastYear ?? undefined,
    classYearEstimate: entry.profile.classYearEstimate ?? undefined,
    classLabel: entry.profile.latestRosterClass ?? undefined,
    hometown: entry.profile.hometown ?? undefined,
    highSchool: entry.profile.highSchool ?? undefined,
    bioUrls: [],
    sourceUrls: [...entry.sources.sourceUrls],
    confidence: 1,
    publishedToNetwork: true,
    publishedAt: now,
    publishedByRole: 'admin',
    createdAt: now,
    updatedAt: now,
  }
  store.teamMemberships.push(newMembership)

  const newEnrichment: PersonEnrichment = {
    id: crypto.randomUUID(),
    personId,
    teamId: team.id,
    visibleToPlayers: true,
    verificationStatus: 'unverified',
    sourceUrls: [],
    createdAt: now,
    updatedAt: now,
  }
  store.personEnrichments.push(newEnrichment)

  await writeStore(store)

  return NextResponse.json({ personId, alreadyExisted: false })
}
