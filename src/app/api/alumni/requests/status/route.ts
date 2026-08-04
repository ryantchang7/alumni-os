import { NextRequest, NextResponse } from 'next/server'
import { requireApprovedMember } from '@/lib/auth/guards'
import type { PlayerAlumniRequest } from '@/lib/store/types'
import { notify } from '@/lib/notifications/notify'

const VALID_STATUSES: PlayerAlumniRequest['status'][] = [
  'seen', 'accepted', 'declined', 'suggested', 'responded', 'closed',
]

export async function POST(request: NextRequest) {
  const g = await requireApprovedMember()
  if (!g.ok) return g.response

  let body: {
    teamSlug?: string
    personId?: string
    requestId?: string
    status?: string
    responseMessage?: string
    suggestedPersonId?: string
    suggestedPersonName?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { teamSlug, personId, requestId, status, responseMessage, suggestedPersonId, suggestedPersonName } = body

  if (!teamSlug || !personId || !requestId || !status) {
    return NextResponse.json(
      { error: 'teamSlug, personId, requestId, and status are required' },
      { status: 400 },
    )
  }

  // Ownership: a member may only respond to requests addressed to their own
  // linked alumni profile. The request→personId match is enforced below
  // (req.alumniPersonId === personId), so binding personId to the caller
  // guarantees the request belongs to them.
  if (personId !== g.session.linkedPersonId) {
    return NextResponse.json(
      { error: 'You can only respond to requests addressed to you' },
      { status: 403 },
    )
  }

  if (!VALID_STATUSES.includes(status as PlayerAlumniRequest['status'])) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
  }

  if (responseMessage && responseMessage.trim().length > 1000) {
    return NextResponse.json({ error: 'responseMessage must be 1000 characters or fewer' }, { status: 400 })
  }

  if (status === 'suggested' && !suggestedPersonId && !suggestedPersonName) {
    return NextResponse.json(
      { error: 'suggestedPersonId or suggestedPersonName is required when status is suggested' },
      { status: 400 },
    )
  }

  const {
    getTeamBySlug,
    getTeamMembershipsForTeam,
    readStore,
    respondToPlayerAlumniRequest,
  } = await import('@/lib/store/local-store')

  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  }

  const memberships = await getTeamMembershipsForTeam(team.id)
  if (!memberships.find(m => m.personId === personId)) {
    return NextResponse.json({ error: 'Person not found on this team' }, { status: 404 })
  }

  const store = await readStore()
  const req = store.playerAlumniRequests.find(r => r.id === requestId)
  if (!req || req.teamId !== team.id || req.alumniPersonId !== personId) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  // Validate suggestedPersonId belongs to team if provided
  if (suggestedPersonId) {
    const isMember = memberships.find(m => m.personId === suggestedPersonId)
    if (!isMember) {
      return NextResponse.json({ error: 'Suggested person not found on this team' }, { status: 404 })
    }
  }

  const updated = await respondToPlayerAlumniRequest({
    requestId,
    status: status as PlayerAlumniRequest['status'],
    responseMessage: responseMessage?.trim() || undefined,
    suggestedPersonId: suggestedPersonId || undefined,
    suggestedPersonName: suggestedPersonName?.trim() || undefined,
  })

  // Close the loop. Previously a reply was recorded and the student who
  // asked was never told — they had to keep re-checking the page.
  if (updated && (status === 'accepted' || status === 'declined' || status === 'responded' || status === 'suggested')) {
    try {
      const fresh = await readStore()
      const asker = updated.fromEmail
        ? fresh.accounts.find(a => a.email?.toLowerCase() === updated.fromEmail!.toLowerCase())
        : undefined
      const alumniPerson = fresh.people.find(p => p.id === updated.alumniPersonId)
      const alumniName = alumniPerson?.canonicalName ?? 'A Penn Golf alum'
      const statusLabel =
        status === 'accepted' ? 'said yes'
        : status === 'declined' ? 'passed this time'
        : status === 'suggested' ? 'suggested someone else who can help'
        : 'replied'
      if (asker) {
        await notify(asker.id, {
          type: 'request',
          title: `${alumniName} replied to your ask`,
          body: statusLabel,
          href: '/player/requests',
        })
      }
      if (updated.fromEmail) {
        const { renderAskAnsweredEmail } = await import('@/lib/email/templates')
        const { sendEmail } = await import('@/lib/email/send')
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://penngolfclubhouse.com'
        const { subject, html } = renderAskAnsweredEmail({
          askerFirstName: updated.fromName?.split(/\s+/)[0] ?? null,
          alumniName,
          statusLabel,
          responseMessage: updated.responseMessage ?? null,
          url: `${baseUrl}/player/requests`,
        })
        await sendEmail({ to: updated.fromEmail, subject, html })
      }
    } catch (e) {
      console.warn('[ask-answered-notify] failed:', e)
    }
  }

  return NextResponse.json({
    request: {
      id: updated!.id,
      status: updated!.status,
      respondedAt: updated!.respondedAt,
      closedAt: updated!.closedAt,
      updatedAt: updated!.updatedAt,
    },
  })
}
