/**
 * Weekly digest cron. Runs Sunday evening (Vercel Cron schedule in
 * vercel.json). Sends each linked account a digest of "what happened at
 * the Clubhouse this week" — new members, new gatherings, new asks/offers,
 * new Moments, and recent Penn Athletics news.
 *
 * Guards on Authorization: Bearer <CRON_SECRET>. Vercel Cron sends this
 * header automatically when CRON_SECRET is set on the project.
 *
 * Idempotency: stamps Account.lastDigestSentAt after each send. Re-runs
 * within the same week are a no-op per recipient.
 */

import { NextRequest, NextResponse } from 'next/server'

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    // No secret configured — allow only in dev so local testing works.
    return process.env.NODE_ENV !== 'production'
  }
  const header = req.headers.get('authorization') ?? ''
  return header === `Bearer ${secret}`
}

function formatWeekOf(now: Date): string {
  const start = new Date(now.getTime() - ONE_WEEK_MS)
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `Week of ${fmt(start)}–${fmt(now)}`
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized()

  const teamSlug = req.nextUrl.searchParams.get('teamSlug') ?? 'penn-mens-golf'
  const dryRun = req.nextUrl.searchParams.get('dryRun') === '1'

  const {
    readStore,
    getTeamBySlug,
    getAllLinkedAccountsForTeam,
    getRecentTeamNewsItems,
    stampDigestSent,
  } = await import('@/lib/store/local-store')
  const { sendEmail } = await import('@/lib/email/send')
  const { renderWeeklyDigest } = await import('@/lib/email/templates')

  const team = await getTeamBySlug(teamSlug)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const store = await readStore()
  const now = new Date()
  const cutoffMs = now.getTime() - ONE_WEEK_MS

  // Gather week's content.
  const newMembers = store.accounts
    .filter(a => a.teamId === team.id && Date.parse(a.createdAt) >= cutoffMs)
    .map(a => {
      const person = a.linkedPersonId
        ? store.people.find(p => p.id === a.linkedPersonId)
        : undefined
      const membership = person
        ? store.teamMemberships.find(
            m => m.personId === person.id && m.teamId === team.id,
          )
        : undefined
      return {
        name: person?.canonicalName ?? a.name ?? a.email,
        classLabel: membership?.classLabel,
      }
    })

  const careerPosts = store.careerPosts
    .filter(p => p.teamId === team.id && Date.parse(p.createdAt) >= cutoffMs)
    .map(p => ({
      kind: p.kind,
      headline: p.headline,
      sector: p.sector,
      postedByName: p.postedByName,
    }))

  const gatherings = store.clubhouseGatherings
    .filter(
      g =>
        g.teamId === team.id &&
        Date.parse(g.createdAt) >= cutoffMs &&
        g.status !== 'closed',
    )
    .map(g => ({ title: g.title, dateText: g.dateText, city: g.city }))

  const moments = store.moments
    .filter(
      m =>
        m.teamId === team.id &&
        m.status === 'published' &&
        Date.parse(m.createdAt) >= cutoffMs,
    )
    .map(m => ({ caption: m.caption, postedByName: m.postedByName }))

  const newsItems = (await getRecentTeamNewsItems(team.id, 4)).map(n => ({
    title: n.title,
    sourceUrl: n.sourceUrl,
  }))

  const clubhouseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? 'https://alumni-os.vercel.app'
  const { subject, html } = renderWeeklyDigest({
    teamName: team.name,
    weekOf: formatWeekOf(now),
    newMembers,
    asks: careerPosts.filter(p => p.kind === 'ask'),
    offers: careerPosts.filter(p => p.kind === 'offer'),
    gatherings,
    moments,
    newsItems,
    clubhouseUrl: `${clubhouseUrl}/player`,
  })

  const hasContent =
    newMembers.length +
      gatherings.length +
      careerPosts.length +
      moments.length +
      newsItems.length >
    0

  if (!hasContent) {
    return NextResponse.json({
      ok: true,
      skipped: 'no_content',
      teamSlug,
    })
  }

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      subject,
      htmlBytes: html.length,
      newMembers: newMembers.length,
      careerPosts: careerPosts.length,
      gatherings: gatherings.length,
      moments: moments.length,
      newsItems: newsItems.length,
    })
  }

  // Send to every linked account that hasn't received a digest in the
  // last 6 days (allow Sunday-to-Sunday).
  const recipients = await getAllLinkedAccountsForTeam(team.id)
  const sentTo: string[] = []
  const skipped: string[] = []
  const errors: string[] = []
  const recentCutoffMs = now.getTime() - 6 * 24 * 60 * 60 * 1000

  for (const account of recipients) {
    if (
      account.lastDigestSentAt &&
      Date.parse(account.lastDigestSentAt) >= recentCutoffMs
    ) {
      skipped.push(account.email)
      continue
    }
    const res = await sendEmail({ to: account.email, subject, html })
    if (res.ok) {
      sentTo.push(account.email)
      if (!res.skipped) await stampDigestSent(account.id)
    } else {
      errors.push(`${account.email}: ${res.error ?? 'unknown'}`)
    }
  }

  return NextResponse.json({
    ok: true,
    teamSlug,
    sent: sentTo.length,
    skipped: skipped.length,
    errors,
  })
}
