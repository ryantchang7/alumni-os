/**
 * Captain-only endpoint that approves or declines a pending profile claim.
 * On approve: links the requester's account to the resolved personId AND
 * fires the welcome email. On decline: notifies the requester so they
 * can email the captain directly.
 */

import { NextResponse } from 'next/server'
import { requireFounder } from '@/lib/auth/guards'
import {
  getProfileClaimRequestById,
  linkAccountToPerson,
  publishMembershipsForPerson,
  readStore,
  updateProfileClaimRequestStatus,
} from '@/lib/store/local-store'
import { getCaptainEmails } from '@/lib/captains'
import { notify, notifyMany } from '@/lib/notifications/notify'

interface RouteParams {
  params: Promise<{ id: string }>
}

const TEAM_SLUG = 'penn-mens-golf'

export async function POST(request: Request, { params }: RouteParams) {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response
  const store = await readStore()

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { status } = body as Record<string, unknown>
  if (status !== 'approved' && status !== 'declined' && status !== 'pending') {
    return NextResponse.json(
      { error: 'status must be approved, declined, or pending' },
      { status: 400 },
    )
  }

  const claim = await getProfileClaimRequestById(id)
  if (!claim) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
  }

  // On approve, do the actual account ↔ person link before flipping status,
  // so a link conflict doesn't leave an approved-but-unlinked claim. Also
  // publish any unpublished memberships for the linked person (parents and
  // affiliates start unpublished).
  if (status === 'approved' && claim.requesterAccountId && claim.personId) {
    const linked = await linkAccountToPerson(claim.requesterAccountId, claim.personId)
    if (!linked) {
      return NextResponse.json(
        { error: 'Another account is already linked to this profile.' },
        { status: 409 },
      )
    }
    await publishMembershipsForPerson(claim.personId, claim.teamId)
  }

  const updated = await updateProfileClaimRequestStatus(id, status)
  if (!updated) {
    return NextResponse.json({ error: 'Claim request not found' }, { status: 404 })
  }

  // In-app + push notifications on approval. Additive, never blocks the
  // response: notify() / notifyMany() swallow their own errors.
  if (status === 'approved') {
    // 1) Personal: welcome the newly-linked member.
    if (claim.requesterAccountId) {
      await notify(claim.requesterAccountId, {
        type: 'approved',
        title: "You're in — welcome to the Clubhouse",
        body: 'Your Penn Golf membership is live. Tap to explore.',
        href: '/player',
      })
    }
    // 2) Community: tell the rest of the members someone just joined.
    try {
      const fresh = await readStore()
      const newMemberName = claim.requesterName.split(/\s+/)[0] || claim.requesterName
      const recipients = fresh.accounts
        .filter(a => a.teamId === claim.teamId && a.linkedPersonId)
        .map(a => a.id)
      await notifyMany(
        recipients,
        {
          type: 'new_member',
          title: `${newMemberName} just joined the Clubhouse`,
          body: 'Say hello in the Member Book.',
          href: '/member-book',
        },
        { excludeAccountId: claim.requesterAccountId },
      )
    } catch (e) {
      console.warn('[claim-approve-notify] broadcast setup failed:', e)
    }
  }

  // Send notification email. Awaited so the serverless function doesn't
  // terminate before the network request completes.
  try {
    const { sendEmail } = await import('@/lib/email/send')
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? 'https://penngolfclubhouse.com'

    if (status === 'approved') {
      const { renderWelcomeEmail } = await import('@/lib/email/templates')
      const firstName = claim.requesterName.split(/\s+/)[0]
      const { subject, html } = renderWelcomeEmail({
        firstName,
        clubhouseUrl: `${baseUrl}/player`,
      })
      const result = await sendEmail({ to: claim.requesterEmail, subject, html })
      if (!result.ok) console.warn('[claim-approve-email] send failed:', result.error)
      else if (result.skipped) console.warn('[claim-approve-email] skipped — RESEND_API_KEY or EMAIL_FROM unset')
      else console.log(`[claim-approve-email] sent ok id=${result.id}`)
    } else if (status === 'declined') {
      const { renderClaimDeclined } = await import('@/lib/email/templates')
      const firstName = claim.requesterName.split(/\s+/)[0]
      const captainEmails = getCaptainEmails(TEAM_SLUG)
      const captainEmail = captainEmails[0] ?? 'captain@pennmensgolf.com'
      const { subject, html } = renderClaimDeclined({
        firstName,
        claimedName: claim.requesterName,
        captainEmail,
      })
      const result = await sendEmail({ to: claim.requesterEmail, subject, html })
      if (!result.ok) console.warn('[claim-decline-email] send failed:', result.error)
      else if (result.skipped) console.warn('[claim-decline-email] skipped — RESEND_API_KEY or EMAIL_FROM unset')
      else console.log(`[claim-decline-email] sent ok id=${result.id}`)
    }
  } catch (e) {
    console.warn('[claim-status-email] setup failed:', e)
  }

  return NextResponse.json({ claim: updated })
}
