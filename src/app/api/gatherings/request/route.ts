/**
 * POST /api/gatherings/request — approved members RSVP to a gathering.
 *
 * On success: creates a ClubhouseGatheringRequest, then sends two emails:
 *  1. Confirmation to the attendee (with an .ics attachment + Google Cal link)
 *  2. Notification to the host (when the host has a linked account email)
 *
 * Both sends are awaited so Vercel doesn't terminate the serverless function
 * before they fire.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { notify } from '@/lib/notifications/notify'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.accountId || !session.linkedPersonId) {
    return NextResponse.json(
      { error: 'Approved members only — claim your card to RSVP.' },
      { status: 403 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const teamSlug = typeof body.teamSlug === 'string' ? body.teamSlug : 'penn-mens-golf'
  const gatheringId = typeof body.gatheringId === 'string' ? body.gatheringId.trim() : ''
  const fromNameBody = typeof body.fromName === 'string' ? body.fromName.trim() : ''
  const note = typeof body.note === 'string' ? body.note.trim() : undefined

  if (!gatheringId) return NextResponse.json({ error: 'gatheringId required' }, { status: 400 })
  if (note && note.length > 500) return NextResponse.json({ error: 'note too long' }, { status: 400 })

  const {
    getTeamBySlug,
    getClubhouseGatheringById,
    createClubhouseGatheringRequest,
    getAccountById,
    readStore,
  } = await import('@/lib/store/local-store')

  const team = await getTeamBySlug(teamSlug)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const gathering = await getClubhouseGatheringById(gatheringId)
  if (!gathering || gathering.teamId !== team.id) {
    return NextResponse.json({ error: 'Gathering not found' }, { status: 404 })
  }
  if (gathering.status !== 'open') {
    return NextResponse.json({ error: 'Gathering is not open' }, { status: 409 })
  }

  const account = await getAccountById(session.accountId)
  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  // Block duplicate RSVPs from the same account.
  const store = await readStore()
  const existing = store.clubhouseGatheringRequests.find(
    r => r.gatheringId === gatheringId && r.fromAccountId === account.id,
  )
  if (existing) {
    return NextResponse.json(
      { error: "You're already on the sheet for this one.", requestId: existing.id },
      { status: 409 },
    )
  }

  const fromName = fromNameBody || account.name || 'Penn Golf Member'
  if (fromName.length > 100) {
    return NextResponse.json({ error: 'fromName too long' }, { status: 400 })
  }

  const req = await createClubhouseGatheringRequest({
    gatheringId,
    teamId: team.id,
    fromAccountId: account.id,
    fromName,
    fromEmail: account.email,
    note,
  })

  // In-app + push notification to the host (when their account is linked).
  // Additive; notify() swallows its own errors and never blocks the RSVP.
  if (gathering.hostPersonId) {
    const hostAccount = store.accounts.find(
      a => a.linkedPersonId === gathering.hostPersonId && a.teamId === team.id,
    )
    if (hostAccount && hostAccount.id !== account.id) {
      const gatheringHref = gathering.type === 'round' ? '/the-course' : '/19th-hole'
      await notify(hostAccount.id, {
        type: 'request',
        title: `${fromName} is in for "${gathering.title}"`,
        body: 'A new RSVP just landed. Tap to see the sheet.',
        href: gatheringHref,
      })
    }
  }

  // Send confirmation + host notification. Awaited so Vercel doesn't
  // terminate the function before delivery.
  try {
    const { sendEmail } = await import('@/lib/email/send')
    const { renderRsvpConfirmation, renderHostRsvpNotification } = await import(
      '@/lib/email/templates'
    )
    const { buildIcs, buildGoogleCalendarUrl } = await import('@/lib/calendar/ics')

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? 'https://penngolfclubhouse.com'
    const gatheringUrl =
      gathering.type === 'round'
        ? `${baseUrl}/the-course`
        : `${baseUrl}/19th-hole`

    // 1) Confirmation to the attendee with ICS attachment.
    const icsBody = buildIcs(gathering, gatheringUrl)
    const googleUrl = buildGoogleCalendarUrl(gathering, gatheringUrl)
    const attendeeFirstName = (account.name ?? fromName).split(/\s+/)[0]
    const { subject: aSubj, html: aHtml } = renderRsvpConfirmation({
      firstName: attendeeFirstName,
      gatheringTitle: gathering.title,
      gatheringType: gathering.type,
      dateText: gathering.dateText,
      timeText: gathering.timeText,
      city: gathering.city,
      state: gathering.state,
      venue: gathering.venue,
      hostName: gathering.hostName,
      googleCalUrl: googleUrl,
      clubhouseUrl: gatheringUrl,
    })
    const aRes = await sendEmail({
      to: account.email,
      subject: aSubj,
      html: aHtml,
      attachments: [
        {
          filename: 'event.ics',
          content: icsBody,
          contentType: 'text/calendar; charset=utf-8; method=PUBLISH',
        },
      ],
    })
    if (!aRes.ok) console.warn('[rsvp-confirm] send failed:', aRes.error)
    else if (aRes.skipped) console.warn('[rsvp-confirm] skipped — email env unset')
    else console.log(`[rsvp-confirm] sent ok id=${aRes.id}`)

    // 2) Notification to the host (only if we can resolve their email).
    if (gathering.hostPersonId) {
      const hostAccount = store.accounts.find(
        a => a.linkedPersonId === gathering.hostPersonId,
      )
      if (hostAccount?.email) {
        const hostFirstName = (hostAccount.name ?? gathering.hostName).split(/\s+/)[0]
        const { subject: hSubj, html: hHtml } = renderHostRsvpNotification({
          hostFirstName,
          gatheringTitle: gathering.title,
          dateText: gathering.dateText,
          attendeeName: fromName,
          attendeeEmail: account.email,
          attendeeNote: note,
          clubhouseUrl: gatheringUrl,
        })
        const hRes = await sendEmail({ to: hostAccount.email, subject: hSubj, html: hHtml })
        if (!hRes.ok) console.warn('[rsvp-host] send failed:', hRes.error)
        else if (hRes.skipped) console.warn('[rsvp-host] skipped — email env unset')
        else console.log(`[rsvp-host] sent ok id=${hRes.id}`)
      } else {
        console.log('[rsvp-host] skipped — host has no linked account email')
      }
    }
  } catch (e) {
    console.warn('[rsvp-emails] setup failed:', e)
  }

  return NextResponse.json({ request: req }, { status: 201 })
}
