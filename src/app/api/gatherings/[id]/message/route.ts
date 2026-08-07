/**
 * POST /api/gatherings/[id]/message — the host sends one note to everyone on
 * the sheet.
 *
 * A host could add people to a round and then had no way to reach them: no
 * "we're off the first tee at 8:10", no "bring rain gear". They'd fall back to
 * a group text that leaves out anyone they don't have a number for.
 *
 * Sends a bell notification to every attendee with an account, and an email to
 * anyone we have an address for. Host or founder only.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { readStore } from '@/lib/store/local-store'
import { FOUNDER_EMAILS } from '@/lib/badges'
import { notifyMany } from '@/lib/notifications/notify'

interface RouteParams {
  params: Promise<{ id: string }>
}

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://penngolfclubhouse.com'

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth()
  if (!session?.accountId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  const { id } = await params
  const store = await readStore()
  const gathering = store.clubhouseGatherings.find(g => g.id === id)
  if (!gathering) {
    return NextResponse.json({ error: 'Gathering not found' }, { status: 404 })
  }

  const email = (session.user?.email ?? '').toLowerCase().trim()
  const isFounder = FOUNDER_EMAILS.has(email)
  const isHost =
    !!gathering.hostPersonId && gathering.hostPersonId === session.linkedPersonId
  if (!isHost && !isFounder) {
    return NextResponse.json(
      { error: 'Only the host can message this sheet.' },
      { status: 403 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!message) {
    return NextResponse.json({ error: 'Write something first.' }, { status: 400 })
  }
  if (message.length > 1200) {
    return NextResponse.json({ error: 'Keep it under 1200 characters.' }, { status: 400 })
  }

  // Everyone still on the sheet. Declined and closed rows are excluded.
  const rows = store.clubhouseGatheringRequests.filter(
    r => r.gatheringId === id && r.status !== 'declined' && r.status !== 'closed',
  )

  // An attendee reaches us either through their account or, when the host
  // added them by name, through the person record.
  const accountIds = new Set<string>()
  const recipients: Array<{ email: string; firstName?: string }> = []
  for (const r of rows) {
    const account = r.fromAccountId
      ? store.accounts.find(a => a.id === r.fromAccountId)
      : r.fromPersonId
        ? store.accounts.find(a => a.linkedPersonId === r.fromPersonId)
        : undefined
    if (account) {
      if (account.id !== session.accountId) accountIds.add(account.id)
      if (account.email) {
        recipients.push({
          email: account.email,
          firstName: (account.name ?? r.fromName).split(/\s+/)[0],
        })
      }
      continue
    }
    // No account: fall back to a contact email on their enrichment record.
    const enrichment = r.fromPersonId
      ? store.personEnrichments.find(
          e => e.personId === r.fromPersonId && e.teamId === gathering.teamId,
        )
      : undefined
    if (enrichment?.email) {
      recipients.push({ email: enrichment.email, firstName: r.fromName.split(/\s+/)[0] })
    }
  }

  const clubhouseUrl = `${BASE}${gathering.type === 'round' ? '/the-course' : '/19th-hole'}`
  const hostName = gathering.hostName || 'your host'

  // Bell notifications. One CAS write for all of them.
  try {
    if (accountIds.size > 0) {
      await notifyMany(
        [...accountIds],
        {
          type: 'host_offer',
          title: `${hostName.split(/\s*&\s*/)[0]} sent a note about ${gathering.title}`,
          body: message.slice(0, 140),
          href: clubhouseUrl,
        },
        { excludeAccountId: session.accountId },
      )
    }
  } catch (e) {
    console.warn('[gathering-message] notify failed:', e)
  }

  // Emails. Never let a delivery failure fail the request.
  let emailed = 0
  try {
    const { sendEmail } = await import('@/lib/email/send')
    const { renderHostMessage } = await import('@/lib/email/templates')
    const seen = new Set<string>()
    for (const r of recipients) {
      const key = r.email.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      const { subject, html } = renderHostMessage({
        firstName: r.firstName,
        gatheringTitle: gathering.title,
        dateText: gathering.dateText,
        timeText: gathering.timeText,
        venue: gathering.venue,
        city: gathering.city,
        state: gathering.state,
        hostName,
        message,
        clubhouseUrl,
      })
      const res = await sendEmail({ to: r.email, subject, html })
      if (res?.ok) emailed++
    }
  } catch (e) {
    console.warn('[gathering-message] email failed:', e)
  }

  return NextResponse.json({ ok: true, notified: accountIds.size, emailed })
}
