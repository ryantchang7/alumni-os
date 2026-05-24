// Link the authenticated account to a Member Book entry.
//
// 1. Verify session.
// 2. Verify the book entry exists + is public.
// 3. If the book entry has no team-store record yet, bootstrap one
//    (re-using the same logic as /alumni/claim).
// 4. Bind the account.linkedPersonId to the team-store personId.

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  readStore,
  writeStore,
  getTeamBySlug,
  linkAccountToPerson,
} from '@/lib/store/local-store'
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
  const session = await auth()
  if (!session?.accountId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const bookId = typeof body.bookId === 'string' ? body.bookId : null
  if (!bookId) {
    return NextResponse.json({ error: 'Missing bookId' }, { status: 400 })
  }

  const entry = getMemberById(bookId)
  if (!entry || !isPublicMember(entry)) {
    return NextResponse.json({ error: 'Member Book entry not found' }, { status: 404 })
  }

  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  }

  const store = await readStore()

  // Resolve a team-store person. If none matches by name, bootstrap one
  // from the Member Book entry.
  let personId: string
  const matched = findTeamStorePersonForBookEntry(entry, store.people)
  if (matched) {
    const onThisTeam = store.teamMemberships.some(
      (m) => m.personId === matched.id && m.teamId === team.id,
    )
    if (onThisTeam) {
      personId = matched.id
    } else {
      // Person record exists but no membership on this team — create one.
      personId = matched.id
      const now = new Date().toISOString()
      const newMembership: TeamMembership = {
        id: crypto.randomUUID(),
        personId,
        teamId: team.id,
        memberRole: 'alumni',
        memberStatus: 'verified',
        rosterStartYear:
          entry.career.startYear ?? entry.letterWinner.firstYear ?? undefined,
        rosterEndYear:
          entry.career.finishYear ?? entry.letterWinner.lastYear ?? undefined,
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
      await writeStore(store)
    }
  } else {
    // Brand-new person record.
    personId = crypto.randomUUID()
    const now = new Date().toISOString()
    const { firstName, lastName } = splitName(entry.displayName)

    const newPerson: Person = {
      id: personId,
      canonicalName: entry.displayName,
      normalizedName: storeNormalizeName(entry.displayName),
      firstName,
      lastName,
      createdAt: now,
    }
    store.people.push(newPerson)

    const newMembership: TeamMembership = {
      id: crypto.randomUUID(),
      personId,
      teamId: team.id,
      memberRole: 'alumni',
      memberStatus: 'verified',
      rosterStartYear:
        entry.career.startYear ?? entry.letterWinner.firstYear ?? undefined,
      rosterEndYear:
        entry.career.finishYear ?? entry.letterWinner.lastYear ?? undefined,
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
  }

  // Bind the account to this personId. Returns null if another account is
  // already linked to this person.
  const linked = await linkAccountToPerson(session.accountId, personId)
  if (!linked) {
    return NextResponse.json(
      { error: 'Another account has already claimed this profile' },
      { status: 409 },
    )
  }

  // Fire-and-forget welcome email. Wrapped in try/catch + .catch so a
  // provider failure never blocks the claim response.
  try {
    const { sendEmail } = await import('@/lib/email/send')
    const { renderWelcomeEmail } = await import('@/lib/email/templates')
    const clubhouseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? 'https://alumni-os.vercel.app'
    const firstName = splitName(entry.displayName).firstName ?? null
    const { subject, html } = renderWelcomeEmail({
      firstName,
      clubhouseUrl: `${clubhouseUrl}/player`,
    })
    void sendEmail({ to: linked.email, subject, html }).catch((e) =>
      console.warn('[welcome-email] background send failed:', e),
    )
  } catch (e) {
    console.warn('[welcome-email] setup failed:', e)
  }

  return NextResponse.json({ personId, accountId: linked.id })
}
