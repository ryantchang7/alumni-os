/**
 * Captain-only: add a new alum (or current player) to the team store.
 * Creates a Person + TeamMembership + empty PersonEnrichment so the new
 * member shows up in Member Map / Career Room / etc. once they fill in
 * their location and other fields.
 *
 * Note: does NOT add to the static Member Book directory file. That's
 * the published roster archive. New people added here are "team store
 * only" until the next Member Book rebuild.
 */

import { NextResponse } from 'next/server'
import { requireFounder } from '@/lib/auth/guards'
import {
  readStore,
  writeStore,
  getTeamBySlug,
} from '@/lib/store/local-store'
import type { Person, TeamMembership, PersonEnrichment } from '@/lib/store/types'

const TEAM_SLUG = 'penn-mens-golf'

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitName(name: string): { firstName?: string; lastName?: string } {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return {}
  if (parts.length === 1) return { firstName: parts[0] }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

export async function POST(request: Request) {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const memberRole: 'current_player' | 'alumni' | 'coach' =
    body.memberRole === 'current_player'
      ? 'current_player'
      : body.memberRole === 'coach'
        ? 'coach'
        : 'alumni'
  const hometown = typeof body.hometown === 'string' ? body.hometown.trim() : undefined
  const classLabel = typeof body.classLabel === 'string' ? body.classLabel.trim() : undefined
  const rosterStartYear =
    typeof body.rosterStartYear === 'number' && Number.isFinite(body.rosterStartYear)
      ? body.rosterStartYear
      : undefined
  const rosterEndYear =
    typeof body.rosterEndYear === 'number' && Number.isFinite(body.rosterEndYear)
      ? body.rosterEndYear
      : undefined

  if (!name || name.length < 2) {
    return NextResponse.json({ error: 'name required' }, { status: 400 })
  }

  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  }

  const store = await readStore()
  const norm = normalizeName(name)
  const now = new Date().toISOString()

  // Check for an existing Person on this team with the same normalized name.
  const existing = store.people.find(
    p =>
      p.normalizedName === norm &&
      store.teamMemberships.some(m => m.personId === p.id && m.teamId === team.id),
  )
  if (existing) {
    return NextResponse.json(
      { error: 'A member with this name already exists on this team.', personId: existing.id },
      { status: 409 },
    )
  }

  const { firstName, lastName } = splitName(name)

  const person: Person = {
    id: crypto.randomUUID(),
    canonicalName: name,
    normalizedName: norm,
    firstName,
    lastName,
    createdAt: now,
  }
  store.people.push(person)

  const membership: TeamMembership = {
    id: crypto.randomUUID(),
    personId: person.id,
    teamId: team.id,
    memberRole,
    memberStatus: 'verified',
    rosterStartYear,
    rosterEndYear,
    classLabel,
    hometown,
    bioUrls: [],
    sourceUrls: [],
    confidence: 1,
    publishedToNetwork: true,
    publishedAt: now,
    publishedByRole: 'captain',
    createdAt: now,
    updatedAt: now,
  }
  store.teamMemberships.push(membership)

  const enrichment: PersonEnrichment = {
    id: crypto.randomUUID(),
    personId: person.id,
    teamId: team.id,
    visibleToPlayers: true,
    contactPreference: 'team_intro',
    verificationStatus: 'unverified',
    sourceUrls: [],
    createdAt: now,
    updatedAt: now,
  }
  store.personEnrichments.push(enrichment)

  await writeStore(store)

  return NextResponse.json({ personId: person.id }, { status: 201 })
}
