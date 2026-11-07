/**
 * Weekly digest cron. Runs Sunday evening (Vercel Cron schedule in
 * vercel.json). Sends each linked account a digest of "what happened at
 * the Clubhouse this week" — new members, new gatherings, new asks/offers,
 * new Moments, and recent Penn Athletics news.
 *
 * Guards on Authorization: Bearer <CRON_SECRET> (header-only, constant-time
 * compared). Vercel Cron sends this header automatically when CRON_SECRET is
 * set on the project.
 *
 * Idempotency: stamps Account.lastDigestSentAt after each send. Re-runs
 * within the same week are a no-op per recipient.
 */

import { NextRequest, NextResponse } from 'next/server'
import { openGaps, gapReason, type ProfileGap } from '@/lib/profile/gaps'
import { checkCronAuth } from '@/lib/cron-auth'
import { requireFounder } from '@/lib/auth/guards'
import { deriveClassLabel } from '@/lib/class-year'
import { alertFounders } from '@/lib/ops/alert'

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function formatWeekOf(now: Date): string {
  const start = new Date(now.getTime() - ONE_WEEK_MS)
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `Week of ${fmt(start)}–${fmt(now)}`
}

async function runJob(req: NextRequest) {
  const teamSlug = req.nextUrl.searchParams.get('teamSlug') ?? 'penn-mens-golf'
  let dryRun = req.nextUrl.searchParams.get('dryRun') === '1'

  // A founder can preview the digest, but only ever as a dry run. Sending is
  // gated on the cron secret alone, because a real send goes to alumni
  // inboxes and cannot be taken back: one absent-minded visit to this URL in
  // a signed-in browser should not be able to mail the alumni body.
  if (!checkCronAuth(req)) {
    const gate = await requireFounder()
    if (!gate.ok) return unauthorized()
    dryRun = true
  }

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
  //
  // Who arrived. Two things were wrong here and both mattered once arrivals
  // went from two a week to seven in a day.
  //
  // It filtered on `createdAt`, which is the first Google sign-in, not the
  // claim. Somebody who signed in during the board meeting and claimed a card
  // nine days later was announced in the wrong week, or in no week at all.
  // `linkedAt` is the claim; `createdAt` is the fallback for the accounts
  // linked before that field existed.
  //
  // And it had no `linkedPersonId` check, so an account that signed in and
  // never claimed was listed under "New in the book" while not being in the
  // book. For such an account there is no person and often no Google display
  // name, and the last fallback in the name chain was `a.email` — which would
  // have mailed a stranger's address to the entire alumni body.
  const { findBookEntryForTeamStorePerson } = await import('@/lib/member-book/bridge')
  const joinedAtOf = (a: { linkedAt?: string; createdAt: string }) =>
    a.linkedAt ?? a.createdAt
  const newMembers = store.accounts
    .filter(a => {
      if (a.teamId !== team.id) return false
      if (!a.linkedPersonId) return false
      return Date.parse(joinedAtOf(a)) >= cutoffMs
    })
    .map(a => {
      const person = store.people.find(p => p.id === a.linkedPersonId)
      const membership = person
        ? store.teamMemberships.find(
            m => m.personId === person.id && m.teamId === team.id,
          )
        : undefined
      const bookEntry = person
        ? findBookEntryForTeamStorePerson(person.canonicalName)
        : null
      return {
        name: person?.canonicalName ?? a.name ?? 'A new member',
        classLabel: deriveClassLabel(membership?.classYearEstimate) ?? membership?.classLabel,
        bookId: bookEntry?.id,
        personId: a.linkedPersonId,
        joinedAt: joinedAtOf(a),
      }
    })
    .sort((x, y) => y.joinedAt.localeCompare(x.joinedAt))

  const careerPosts = store.careerPosts
    .filter(p => p.teamId === team.id && Date.parse(p.createdAt) >= cutoffMs)
    .map(p => ({
      kind: p.kind,
      headline: p.headline,
      sector: p.sector,
      postedByName: p.postedByName,
    }))

  // What a reader could still turn up to, rather than what happened to be
  // typed in this week. A round posted a month ago and happening on Saturday
  // is the useful one; a round created on Tuesday for next spring is not.
  const { isPastGathering, gatheringSortKey } = await import('@/lib/gatherings/date')
  const { isExampleGathering, isHiddenGathering } = await import(
    '@/lib/seed-data/example-gatherings'
  )
  // Whatever is still ahead, soonest first. There was a thirty-day window
  // here, which sounded sensible and would have hidden the Scotland rounds
  // from every digest until mid-September: they are the only thing on the
  // board and they are five weeks out. If a round is the next one there is,
  // it is the answer to "where could you play" however far off it is. The
  // template caps the list at three regardless.
  const gatherings = store.clubhouseGatherings
    .filter(g => {
      if (g.teamId !== team.id || g.status === 'closed') return false
      if (isHiddenGathering(g.id) || isExampleGathering(g.id, g.isExample)) return false
      return !isPastGathering(g)
    })
    .sort((a, b) => gatheringSortKey(a) - gatheringSortKey(b))
    .map(g => ({ title: g.title, dateText: g.dateText, city: g.city }))

  const moments = store.moments
    .filter(
      m =>
        m.teamId === team.id &&
        m.status === 'published' &&
        Date.parse(m.createdAt) >= cutoffMs,
    )
    .map(m => ({
      caption: m.caption,
      postedByName: m.postedByName,
      photoUrl: m.photoUrl,
      mediaType: m.mediaType,
    }))

  // The team. This is what an alum opens the email for, and it was missing
  // entirely: the digest could go out the day after a tournament and never
  // mention it.
  const { usEasternToday } = await import('@/lib/us-date')
  const todayISO = usEasternToday()
  const stops = store.teamTravelStops
    .filter(t => t.teamId === team.id)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
  const dayDiff = (iso: string) =>
    Math.round((Date.parse(iso + 'T00:00:00Z') - Date.parse(todayISO + 'T00:00:00Z')) / 86400000)
  const rangeOf = (t: { startDate: string; endDate?: string }) => {
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' }
    const a = new Date(`${t.startDate}T00:00:00Z`).toLocaleDateString('en-US', opts)
    if (!t.endDate || t.endDate === t.startDate) return a
    const b = new Date(`${t.endDate}T00:00:00Z`)
    return `${a}\u2013${b.getUTCDate()}`
  }
  const finishedThisWeek = stops
    .filter(t => {
      if (!t.resultText?.trim()) return false
      const ended = t.endDate ?? t.startDate
      return dayDiff(ended) <= 0 && dayDiff(ended) >= -8
    })
    .pop()
  const result = finishedThisWeek
    ? {
        eventName: finishedThisWeek.eventName,
        resultText: finishedThisWeek.resultText!,
        dateRange: rangeOf(finishedThisWeek),
        leaderboardUrl: finishedThisWeek.linkUrl,
      }
    : undefined
  const upcomingStop = stops.find(
    t => !t.resultText?.trim() && (t.endDate ?? t.startDate) >= todayISO,
  )
  const nextUp = upcomingStop
    ? {
        eventName: upcomingStop.eventName,
        dateRange: rangeOf(upcomingStop),
        locationText: upcomingStop.locationText,
        daysAway: dayDiff(upcomingStop.startDate),
      }
    : undefined

  const newsItems = (await getRecentTeamNewsItems(team.id, 4)).map(n => ({
    title: n.title,
    sourceUrl: n.sourceUrl,
  }))

  const clubhouseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? 'https://penngolfclubhouse.com'
  const baseDigest = {
    teamName: team.teamName,
    weekOf: formatWeekOf(now),
    result,
    nextUp,
    newMembers,
    asks: careerPosts.filter(p => p.kind === 'ask'),
    offers: careerPosts.filter(p => p.kind === 'offer'),
    gatherings,
    moments,
    newsItems,
    clubhouseUrl: `${clubhouseUrl}/player`,
    memberBookUrl: `${clubhouseUrl}/member-book`,
    postMomentUrl: `${clubhouseUrl}/moments/new`,
  }
  // The shared copy. Used for the hasContent gate and the dry-run preview;
  // each recipient is rendered again below with their own card's gaps.
  const { subject, html } = renderWeeklyDigest(baseDigest)

  /**
   * What this member's own card is still missing. Empty once it is done, so
   * the nudge stops on its own rather than nagging a finished profile.
   */
  // Ordered by what it costs to leave blank, so the email can name the top
  // one's consequence rather than listing four chores. Shared with the
  // Member Book nudge so the two never say different things.
  const profileGapsFor = (personId?: string): ProfileGap[] => {
    if (!personId) return []
    const e = store.personEnrichments.find(
      x => x.teamId === team.id && x.personId === personId,
    )
    return openGaps({
      photo: !!e?.photoUrl?.trim(),
      role: !!(e?.currentRole?.trim() || e?.currentCompany?.trim()),
      city: !!e?.city?.trim(),
      bio: !!e?.alumniBio?.trim(),
    })
  }

  // Clubhouse activity is what justifies the email. News alone doesn't —
  // counting it meant a dead week still sent "A quiet week at the Clubhouse"
  // containing nothing but Penn Athletics headlines.
  // A result posted this week justifies the email on its own: it is the one
  // thing every alum wants and none of them get anywhere else. A bare "next
  // up" does not, or a quiet January would mail everyone every Sunday.
  const hasContent =
    Boolean(result) ||
    newMembers.length + gatherings.length + careerPosts.length + moments.length > 0

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
      newMemberNames: newMembers.map(m => m.name),
      careerPosts: careerPosts.length,
      gatherings: gatherings.length,
      moments: moments.length,
      newsItems: newsItems.length,
      result: result ? `${result.eventName}: ${result.resultText}` : null,
      nextUp: nextUp ? `${nextUp.eventName} in ${nextUp.daysAway}d` : null,
      recipients: (await getAllLinkedAccountsForTeam(team.id)).length,
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
    // Rendered per recipient: the "Your card" section names their own gaps,
    // and the arrivals section asks a brand-new member to post while asking
    // everyone else to say hello. Everything else in the email is identical.
    const gaps = profileGapsFor(account.linkedPersonId)
    const viewerIsNew = newMembers.some(m => m.personId === account.linkedPersonId)
    const personal =
      gaps.length || viewerIsNew
        ? renderWeeklyDigest({
            ...baseDigest,
            viewerIsNew,
            viewerPersonId: account.linkedPersonId,
            profileGaps: gaps.map(g => g.label),
            profileGapReason: gapReason(gaps),
            profileUrl: account.linkedPersonId
              ? `${clubhouseUrl}/alumni/profile/${account.linkedPersonId}?teamSlug=${teamSlug}`
              : `${clubhouseUrl}/account/profile`,
          })
        : { subject, html }
    const res = await sendEmail({
      to: account.email,
      subject: personal.subject,
      html: personal.html,
    })
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

/**
 * Alert on failure. These ran into a Vercel log nobody reads — which is how
 * the news feed sat dead for a month. The digest is the only recurring reason
 * anyone returns, so silence there is expensive.
 */
export async function GET(req: NextRequest) {
  try {
    return await runJob(req)
  } catch (e) {
    await alertFounders('weekly digest', String(e instanceof Error ? e.stack ?? e.message : e))
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
