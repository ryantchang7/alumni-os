/**
 * Captain-only endpoint that approves or declines a pending profile claim.
 * On approve: links the requester's account to the resolved personId AND
 * fires the welcome email. On decline: notifies the requester so they
 * can email the captain directly.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getProfileClaimRequestById,
  linkAccountToPerson,
  updateProfileClaimRequestStatus,
} from '@/lib/store/local-store'
import { isCaptain, getCaptainEmails } from '@/lib/captains'

interface RouteParams {
  params: Promise<{ id: string }>
}

const TEAM_SLUG = 'penn-mens-golf'

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth()
  if (!isCaptain(session?.user?.email, TEAM_SLUG)) {
    return NextResponse.json({ error: 'Captains only' }, { status: 403 })
  }

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
  // so a link conflict doesn't leave an approved-but-unlinked claim.
  if (status === 'approved' && claim.requesterAccountId && claim.personId) {
    const linked = await linkAccountToPerson(claim.requesterAccountId, claim.personId)
    if (!linked) {
      return NextResponse.json(
        { error: 'Another account is already linked to this profile.' },
        { status: 409 },
      )
    }
  }

  const updated = await updateProfileClaimRequestStatus(id, status)
  if (!updated) {
    return NextResponse.json({ error: 'Claim request not found' }, { status: 404 })
  }

  // Fire-and-forget notification emails. Doesn't block the captain response.
  try {
    const { sendEmail } = await import('@/lib/email/send')
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? 'https://alumni-os.vercel.app'

    if (status === 'approved') {
      const { renderWelcomeEmail } = await import('@/lib/email/templates')
      const firstName = claim.requesterName.split(/\s+/)[0]
      const { subject, html } = renderWelcomeEmail({
        firstName,
        clubhouseUrl: `${baseUrl}/player`,
      })
      void sendEmail({ to: claim.requesterEmail, subject, html }).catch((e) =>
        console.warn('[claim-approve-email] failed:', e),
      )
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
      void sendEmail({ to: claim.requesterEmail, subject, html }).catch((e) =>
        console.warn('[claim-decline-email] failed:', e),
      )
    }
  } catch (e) {
    console.warn('[claim-status-email] setup failed:', e)
  }

  return NextResponse.json({ claim: updated })
}
