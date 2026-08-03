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
import { SUPPORT_EMAIL } from '@/lib/access/promise'
import { getMemberById } from '@/lib/member-book/data'

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
    // 2) Tell the members someone just joined. Era teammates — anyone whose
    //    roster years overlapped the new member's — get a PERSONAL ping with
    //    the years they shared ('era_teammate', not community-muted);
    //    everyone else gets the community broadcast.
    try {
      const fresh = await readStore()
      const newMemberName = claim.requesterName.split(/\s+/)[0] || claim.requesterName

      const newMembership = claim.personId
        ? fresh.teamMemberships.find(
            m =>
              m.teamId === claim.teamId &&
              m.personId === claim.personId &&
              (m.memberRole === 'current_player' || m.memberRole === 'alumni'),
          )
        : undefined
      const newStart = newMembership?.rosterStartYear ?? newMembership?.rosterEndYear
      const newEnd = newMembership?.rosterEndYear ?? newMembership?.rosterStartYear

      const membershipByPerson = new Map(
        fresh.teamMemberships
          .filter(
            m =>
              m.teamId === claim.teamId &&
              (m.memberRole === 'current_player' || m.memberRole === 'alumni'),
          )
          .map(m => [m.personId, m]),
      )

      const eraPings: { accountId: string; overlapStart: number; overlapEnd: number }[] = []
      const broadcastIds: string[] = []
      for (const a of fresh.accounts) {
        if (a.teamId !== claim.teamId || !a.linkedPersonId) continue
        if (a.id === claim.requesterAccountId) continue
        const m = newStart && newEnd ? membershipByPerson.get(a.linkedPersonId) : undefined
        const start = m?.rosterStartYear ?? m?.rosterEndYear
        const end = m?.rosterEndYear ?? m?.rosterStartYear
        if (newStart && newEnd && start && end) {
          const overlapStart = Math.max(start, newStart)
          const overlapEnd = Math.min(end, newEnd)
          if (overlapStart <= overlapEnd) {
            eraPings.push({ accountId: a.id, overlapStart, overlapEnd })
            continue
          }
        }
        broadcastIds.push(a.id)
      }

      await Promise.all(
        eraPings.map(p =>
          notify(p.accountId, {
            type: 'era_teammate',
            title: `${newMemberName} from your era just walked in`,
            body:
              p.overlapStart === p.overlapEnd
                ? `You were on the roster together in ${p.overlapStart} — say hello.`
                : `You played together ${p.overlapStart}–${p.overlapEnd} — say hello.`,
            href: '/player',
          }),
        ),
      )
      await notifyMany(broadcastIds, {
        type: 'new_member',
        title: `${newMemberName} just joined the Clubhouse`,
        body: 'Say hello in the Member Book.',
        href: '/member-book',
      })
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
      const captainEmail = captainEmails[0] ?? SUPPORT_EMAIL
      const { subject, html } = renderClaimDeclined({
        firstName,
        // The CARD they tried to claim — not their own name. Printing the
        // requester's name here read as an accusation.
        claimedName: getMemberById(claim.memberId)?.displayName ?? claim.requesterName,
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
