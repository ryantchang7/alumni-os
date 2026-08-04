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
  mutateStore,
  getTeamBySlug,
  createProfileClaimRequest,
  getAccountById,
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

  // Resolve a team-store person, bootstrapping one from the Member Book entry
  // when none matches. Both former write sites (add-membership-to-existing and
  // create-brand-new) are folded into this single mutateStore so the resolve +
  // all pushes happen atomically under the CAS guard — a concurrent claim can
  // no longer clobber these rows.
  // Refuse a duplicate claim BEFORE writing anything: this endpoint
  // bootstraps Person/TeamMembership/Enrichment rows, so checking afterwards
  // let a signed-in account pollute the store with one row per book entry.
  {
    const pre = await readStore()
    const already = pre.profileClaimRequests.find(
      r =>
        r.teamId === team.id &&
        r.requesterAccountId === session.accountId &&
        r.status === 'pending',
    )
    if (already) {
      return NextResponse.json(
        { error: 'You already have a claim in front of the captain', claimId: already.id },
        { status: 409 },
      )
    }
  }

  const personId = await mutateStore<string>((store) => {
    const matched = findTeamStorePersonForBookEntry(entry, store.people)
    if (matched) {
      const onThisTeam = store.teamMemberships.some(
        (m) => m.personId === matched.id && m.teamId === team.id,
      )
      if (onThisTeam) {
        // Already on this team — nothing to write.
        return matched.id
      }
      // Person record exists but no membership on this team — create one.
      const now = new Date().toISOString()
      const newMembership: TeamMembership = {
        id: crypto.randomUUID(),
        personId: matched.id,
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
      return matched.id
    }

    // Brand-new person record.
    const personId = crypto.randomUUID()
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

    return personId
  })

  // Don't link directly anymore — queue a claim for the captain to review.
  // The person/membership/enrichment records are now in place; the captain's
  // approval handler just calls linkAccountToPerson when they say yes.
  const account = await getAccountById(session.accountId)
  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  // Block submitting a second claim while one is already pending. Re-read the
  // store fresh (the mutateStore above no longer hands back a snapshot); this
  // is a pure read used only to compute the response.
  const store = await readStore()
  const existing = store.profileClaimRequests.find(
    r =>
      r.teamId === team.id &&
      r.requesterAccountId === session.accountId &&
      r.status === 'pending',
  )
  if (existing) {
    return NextResponse.json(
      {
        error: 'You already have a claim in front of the captain',
        claimId: existing.id,
      },
      { status: 409 },
    )
  }

  const requesterName = account.name ?? entry.displayName
  const claim = await createProfileClaimRequest({
    teamId: team.id,
    memberId: bookId,
    personId,
    requesterName,
    requesterEmail: account.email,
    requesterAccountId: session.accountId,
    matchHint: matchesNameLoosely(account.name, entry.displayName) ? 'strong' : 'weak',
  })

  // Send captain notification. Awaited so the serverless function doesn't
  // terminate before the network request completes (Vercel kills background
  // promises the moment the response returns).
  try {
    const { sendEmail } = await import('@/lib/email/send')
    const { renderClaimNotification } = await import('@/lib/email/templates')
    const { getCaptainEmails } = await import('@/lib/captains')
    const captains = getCaptainEmails(TEAM_SLUG)
    console.log(`[claim-notify] captains=${captains.length} resendKeySet=${!!process.env.RESEND_API_KEY} emailFromSet=${!!process.env.EMAIL_FROM}`)
    if (captains.length > 0) {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ?? 'https://penngolfclubhouse.com'
      const matchHint = matchesNameLoosely(account.name, entry.displayName)
        ? 'strong'
        : 'weak'
      const yearsLabel =
        entry.career.startYear && entry.career.finishYear
          ? `${entry.career.startYear}–${entry.career.finishYear}`
          : undefined
      const { subject, html } = renderClaimNotification({
        requesterName,
        requesterEmail: account.email,
        claimedName: entry.displayName,
        claimedYears: yearsLabel,
        adminUrl: `${baseUrl}/internal/claims`,
        matchHint,
      })
      const result = await sendEmail({ to: captains, subject, html })
      if (!result.ok) {
        console.warn('[claim-notify] send failed:', result.error)
      } else if (result.skipped) {
        console.warn('[claim-notify] skipped — RESEND_API_KEY or EMAIL_FROM unset at runtime')
      } else {
        console.log(`[claim-notify] sent ok id=${result.id}`)
      }
    }
  } catch (e) {
    console.warn('[claim-notify] setup failed:', e)
  }

  return NextResponse.json({
    pending: true,
    claimId: claim.id,
    personId,
  })
}

function matchesNameLoosely(googleName: string | undefined, bookName: string): boolean {
  if (!googleName) return false
  const tokenize = (s: string) =>
    s.toLowerCase().split(/\s+/).filter(t => t.length >= 3)
  const g = new Set(tokenize(googleName))
  const b = tokenize(bookName)
  return b.some(t => g.has(t))
}
