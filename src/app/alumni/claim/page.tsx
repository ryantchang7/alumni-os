// Claim flow: arrives with ?bookId=<member-book-id>, bootstraps a
// team-store record from the Member Book entry, then redirects into
// the editable profile.
//
// Server component — calls the API endpoint internally then forwards.

import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { getMemberById } from '@/lib/member-book/data'
import { isPublicMember } from '@/lib/member-book/helpers'
import { findTeamStorePersonForBookEntry } from '@/lib/member-book/bridge'
import {
  readStore,
  writeStore,
  getTeamBySlug,
  linkAccountToPerson,
} from '@/lib/store/local-store'
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

async function bootstrapFromBookEntry(bookId: string): Promise<string | null> {
  const entry = getMemberById(bookId)
  if (!entry || !isPublicMember(entry)) return null
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return null

  const store = await readStore()

  // Idempotent: if a team-store person already matches this book entry, return it.
  const existing = findTeamStorePersonForBookEntry(entry, store.people)
  if (existing) {
    const onThisTeam = store.teamMemberships.some(
      (m) => m.personId === existing.id && m.teamId === team.id,
    )
    if (onThisTeam) return existing.id
  }

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
  return personId
}

export default async function ClaimRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ bookId?: string }>
}) {
  const { bookId } = await searchParams
  const session = await auth()
  if (!session?.accountId) {
    const next = bookId
      ? `/alumni/claim?bookId=${encodeURIComponent(bookId)}`
      : '/account/setup'
    redirect(`/login?next=${encodeURIComponent(next)}`)
  }
  // Already linked? Send them to their profile editor.
  if (session.linkedPersonId) {
    redirect(`/alumni/profile/${session.linkedPersonId}?teamSlug=${TEAM_SLUG}`)
  }
  if (!bookId) {
    return (
      <div className="min-h-screen bg-[#fbf9f6] py-20 px-6 text-center">
        <h1
          className="text-2xl text-[#0a1628] font-medium font-heading"
        >
          Claim a Profile
        </h1>
        <p className="text-sm text-ink-muted mt-2 max-w-md mx-auto">
          Start from the Member Book and click &ldquo;Claim &amp; Update&rdquo;
          on your card.
        </p>
        <Link
          href="/member-book"
          className="inline-block mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#990000] hover:underline"
        >
          Open the Member Book &rarr;
        </Link>
      </div>
    )
  }

  // Every claim goes through the captain's queue — no auto-linking. This
  // route used to bind the account directly, which let any Google account
  // claim any unclaimed name with no review. All claims now start at
  // /account/setup, which files a claim for hand approval.
  redirect('/account/setup')
}
