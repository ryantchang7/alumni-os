/**
 * POST /api/account/parent-signup — self-serve onboarding for Penn Golf
 * parents and affiliates. Requires sign-in. Creates a Person + Membership
 * (unpublished) + ClaimRequest in front of the captain.
 *
 * On captain approval (existing /api/profile/claims/[id]/status flow):
 *  - the account is linked to the person
 *  - the unpublished membership flips to published
 *  - the parent's welcome email goes out
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  readStore,
  writeStore,
  getTeamBySlug,
  createProfileClaimRequest,
  getAccountById,
} from '@/lib/store/local-store'
import type {
  Person,
  TeamMembership,
  PersonEnrichment,
} from '@/lib/store/types'

const TEAM_SLUG = 'penn-mens-golf'

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitName(displayName: string): { firstName?: string; lastName?: string } {
  const parts = displayName.trim().split(/\s+/)
  if (parts.length === 0) return {}
  if (parts.length === 1) return { firstName: parts[0] }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
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
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const relationship =
    typeof body.relationship === 'string' ? body.relationship.trim() : ''
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })
  if (name.length > 120) return NextResponse.json({ error: 'name too long' }, { status: 400 })
  if (!relationship) {
    return NextResponse.json({ error: 'relationship required' }, { status: 400 })
  }
  if (relationship.length > 200) {
    return NextResponse.json({ error: 'relationship too long' }, { status: 400 })
  }

  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const account = await getAccountById(session.accountId)
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  // Block: a single account can only have one outstanding parent signup.
  const store = await readStore()
  const existing = store.profileClaimRequests.find(
    r =>
      r.teamId === team.id &&
      r.requesterAccountId === session.accountId &&
      r.status === 'pending',
  )
  if (existing) {
    return NextResponse.json(
      { error: 'You already have a request in front of the captain.', claimId: existing.id },
      { status: 409 },
    )
  }

  // Bootstrap a new Person + unpublished Membership + Enrichment record.
  const now = new Date().toISOString()
  const personId = crypto.randomUUID()
  const { firstName, lastName } = splitName(name)

  const newPerson: Person = {
    id: personId,
    canonicalName: name,
    normalizedName: normalizeName(name),
    firstName,
    lastName,
    createdAt: now,
  }
  store.people.push(newPerson)

  const newMembership: TeamMembership = {
    id: crypto.randomUUID(),
    personId,
    teamId: team.id,
    memberRole: 'parent',
    memberStatus: 'imported',
    parentRelationship: relationship,
    bioUrls: [],
    sourceUrls: [],
    confidence: 1,
    publishedToNetwork: false,
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

  // Queue captain approval.
  const claim = await createProfileClaimRequest({
    teamId: team.id,
    memberId: `parent-${personId}`,
    personId,
    requesterName: name,
    requesterEmail: account.email,
    requesterAccountId: session.accountId,
    note: relationship,
  })

  // Notify captains (awaited so Vercel doesn't kill the lambda).
  try {
    const { sendEmail } = await import('@/lib/email/send')
    const { renderClaimNotification } = await import('@/lib/email/templates')
    const { getCaptainEmails } = await import('@/lib/captains')
    const captains = getCaptainEmails(TEAM_SLUG)
    if (captains.length > 0) {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ?? 'https://penngolfclubhouse.com'
      const { subject, html } = renderClaimNotification({
        requesterName: name,
        requesterEmail: account.email,
        claimedName: `${name} — Family / Affiliate`,
        claimedYears: relationship,
        adminUrl: `${baseUrl}/internal/claims`,
        matchHint: 'strong',
      })
      const result = await sendEmail({ to: captains, subject, html })
      if (!result.ok) console.warn('[parent-signup] captain notify failed:', result.error)
      else if (!result.skipped) console.log(`[parent-signup] captain notify sent id=${result.id}`)
    }
  } catch (e) {
    console.warn('[parent-signup] captain notify setup failed:', e)
  }

  return NextResponse.json({ pending: true, claimId: claim.id, personId })
}
