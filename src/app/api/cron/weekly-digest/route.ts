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
    .map(g => ({
      // Same reason as the moments above: the flyer should open the
      // gathering, where the RSVP is, not the front page.
      id: g.id,
      title: g.title,
      dateText: g.dateText,
      city: g.city,
      // The host's flyer and what kind of thing it is. The template leads
      // the email with the flyer and will not say "play" over a happy hour.
      imageUrl: g.imageUrl,
      type: g.type,
    }))

  // "2026-11-20" in an email to alumni reads like a bug. No Date() here:
  // parsing a bare yyyy-mm-dd shifts it a day in half the world's timezones.
  const REQ_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const fmtReqDate = (iso: string): string => {
    const [, m, d] = iso.split('-')
    const mi = Number(m) - 1
    return mi >= 0 && mi < 12 ? `${REQ_MONTHS[mi]} ${Number(d)}` : iso
  }

  // Open requests still standing. They mail everyone the moment they are
  // posted, but that is one impression on a Tuesday; an ask nobody answered
  // is invisible by Sunday. Intros first, because one reply finishes them.
  const openRequests = store.openRequests
    .filter(r => r.teamId === team.id && r.status === 'open')
    .sort(
      (a, b) =>
        Number(b.intent === 'intro') - Number(a.intent === 'intro') ||
        b.createdAt.localeCompare(a.createdAt),
    )
    .map(r => ({
      intent: r.intent,
      fromName: r.fromName,
      note: r.note,
      placeText: [r.city, r.state].filter(Boolean).join(', ') || undefined,
      whenText: r.startDate
        ? r.endDate && r.endDate !== r.startDate
          ? `${fmtReqDate(r.startDate)} to ${fmtReqDate(r.endDate)}`
          : fmtReqDate(r.startDate)
        : undefined,
    }))

  const moments = store.moments
    .filter(
      m =>
        m.teamId === team.id &&
        m.status === 'published' &&
        Date.parse(m.createdAt) >= cutoffMs,
    )
    .map(m => ({
      // The id is what lets the email link to the post itself. Without it
      // every item in the digest landed on the Clubhouse front door, and a
      // reader who wanted to congratulate Lisette had to go and find her
      // post. Seven moments, 49 members, zero reactions ever.
      id: m.id,
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
    openRequests,
    moments,
    newsItems,
    clubhouseUrl: `${clubhouseUrl}/player`,
    memberBookUrl: `${clubhouseUrl}/member-book`,
    postMomentUrl: `${clubhouseUrl}/moments/new`,
    /** The origin, so the template can deep-link a moment or a gathering. */
    siteUrl: clubhouseUrl,
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


  /**
   * Accounts that have ever posted a Moment, at any time, in any state.
   *
   * Not "this week": the question the post prompt answers is whether this
   * member has ever put anything up at all. Seven moments exist and all
   * seven are Ryan's, across 49 members who filled in their own profiles.
   * The only reader who was ever asked to post was one who claimed a card
   * that same week.
   */
  const hasEverPosted = new Set(
    store.moments
      .filter(m => m.teamId === team.id)
      .map(m => m.postedByAccountId)
      .filter((id): id is string => !!id),
  )

  /**
   * Penn golfers near this reader who said they are open to a round.
   *
   * 38 of 49 members have ticked "open to golf rounds" and the Clubhouse
   * has never once introduced two of them. The field was being stored and
   * read back to nobody. This is the cheapest way to change that: the one
   * channel that reaches every member, naming people in their own city.
   *
   * Same city first, then same state, because "near you" across a state
   * line is still a drive somebody might make and across the country is
   * not. Never includes the reader.
   */
  const norm = (v?: string): string => (v ?? '').trim().toLowerCase()
  const roundPartnersFor = (
    personId?: string,
  ): Array<{ name: string; city?: string; cardUrl?: string }> => {
    if (!personId) return []
    const me = store.personEnrichments.find(
      x => x.teamId === team.id && x.personId === personId,
    )
    const myCity = norm(me?.city)
    const myState = norm(me?.state)
    if (!myCity && !myState) return []
    // Only members: somebody who has not claimed a card cannot be asked.
    const linkedPersonIds = new Set(
      store.accounts
        .filter(a => a.teamId === team.id && a.linkedPersonId)
        .map(a => a.linkedPersonId as string),
    )
    const scored: Array<{ name: string; city?: string; cardUrl?: string; rank: number }> = []
    for (const e of store.personEnrichments) {
      if (e.teamId !== team.id) continue
      if (e.personId === personId) continue
      if (!e.openToGolfRounds) continue
      if (!linkedPersonIds.has(e.personId)) continue
      const sameCity = !!myCity && norm(e.city) === myCity
      const sameState = !!myState && norm(e.state) === myState
      if (!sameCity && !sameState) continue
      const person = store.people.find(x => x.id === e.personId)
      if (!person) continue
      const book = findBookEntryForTeamStorePerson(person.canonicalName)
      scored.push({
        name: person.canonicalName,
        city: e.city,
        cardUrl: book ? `${clubhouseUrl}/member-book/${encodeURIComponent(book.id)}` : undefined,
        rank: sameCity ? 0 : 1,
      })
    }
    return scored
      .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))
      .slice(0, 3)
      .map(({ name, city, cardUrl }) => ({ name, city, cardUrl }))
  }

  /** Whether this reader has told anyone they are available for a round. */
  const isOpenToRounds = (personId?: string): boolean => {
    if (!personId) return false
    const e = store.personEnrichments.find(
      x => x.teamId === team.id && x.personId === personId,
    )
    return !!e?.openToGolfRounds
  }

  // Clubhouse activity is what justifies the email. News alone doesn't —
  // counting it meant a dead week still sent "A quiet week at the Clubhouse"
  // containing nothing but Penn Athletics headlines.
  // A result posted this week justifies the email on its own: it is the one
  // thing every alum wants and none of them get anywhere else. A bare "next
  // up" does not, or a quiet January would mail everyone every Sunday.
  const hasContent =
    Boolean(result) ||
    newMembers.length +
      gatherings.length +
      careerPosts.length +
      openRequests.length +
      moments.length >
      0

  if (!hasContent) {
    return NextResponse.json({
      ok: true,
      skipped: 'no_content',
      teamSlug,
    })
  }

  if (dryRun) {
    // What the per-reader sections will actually do, which the shared copy
    // cannot show: it has no reader. These two numbers are the point of the
    // whole change, so the dry run reports them rather than leaving them to
    // be discovered on Sunday.
    const all = await getAllLinkedAccountsForTeam(team.id)
    const prompted = all.filter(a => !hasEverPosted.has(a.id))
    const withMatches = all
      .map(a => ({ email: a.email, matches: roundPartnersFor(a.linkedPersonId) }))
      .filter(x => x.matches.length > 0)

    // `?as=<email>` renders exactly what one member would receive, which is
    // the only way to see a section that depends on who is reading.
    const asEmail = (req.nextUrl.searchParams.get('as') ?? '').trim().toLowerCase()
    const asAccount = asEmail
      ? all.find(a => a.email.toLowerCase() === asEmail)
      : undefined
    const asRendered = asAccount
      ? renderWeeklyDigest({
          ...baseDigest,
          viewerIsNew: newMembers.some(m => m.personId === asAccount.linkedPersonId),
          viewerPersonId: asAccount.linkedPersonId,
          viewerHasNeverPosted: !hasEverPosted.has(asAccount.id),
          nearbyRounds: roundPartnersFor(asAccount.linkedPersonId),
          viewerOpenToRounds: isOpenToRounds(asAccount.linkedPersonId),
          profileGaps: profileGapsFor(asAccount.linkedPersonId).map(g => g.label),
          profileGapReason: gapReason(profileGapsFor(asAccount.linkedPersonId)),
          profileUrl: asAccount.linkedPersonId
            ? `${clubhouseUrl}/alumni/profile/${asAccount.linkedPersonId}?teamSlug=${teamSlug}`
            : `${clubhouseUrl}/account/profile`,
        })
      : undefined

    return NextResponse.json({
      ok: true,
      dryRun: true,
      subject,
      htmlBytes: html.length,
      postPrompt: {
        wouldBeAsked: prompted.length,
        ofRecipients: all.length,
      },
      nearbyRounds: {
        readersWithAMatch: withMatches.length,
        ofRecipients: all.length,
        sample: withMatches.slice(0, 5).map(x => ({
          reader: x.email,
          matches: x.matches.map(m => `${m.name}${m.city ? ` (${m.city})` : ''}`),
        })),
      },
      ...(asAccount
        ? {
            renderedAs: asAccount.email,
            asSubject: asRendered?.subject,
            ...(req.nextUrl.searchParams.get('html') === '1'
              ? { asHtml: asRendered?.html }
              : {}),
          }
        : {}),
      // The point of a dry run is to see what sends, and a byte count is not
      // that. Counting bytes to infer whether a flyer rendered is how an
      // afternoon gets spent; `?html=1` just shows it. Founder-gated and
      // dry-run only, like everything else on this branch.
      ...(req.nextUrl.searchParams.get('html') === '1' ? { html } : {}),
      newMembers: newMembers.length,
      newMemberNames: newMembers.map(m => m.name),
      careerPosts: careerPosts.length,
      gatherings: gatherings.length,
      openRequests: openRequests.length,
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
    // Asked once, of everybody who has never posted — not only of the
    // week's arrivals, which is who it used to reach.
    const viewerHasNeverPosted = !hasEverPosted.has(account.id)
    const nearbyRounds = roundPartnersFor(account.linkedPersonId)
    const personal =
      gaps.length || viewerIsNew || viewerHasNeverPosted || nearbyRounds.length
        ? renderWeeklyDigest({
            ...baseDigest,
            viewerIsNew,
            viewerPersonId: account.linkedPersonId,
            viewerHasNeverPosted,
            nearbyRounds,
            viewerOpenToRounds: isOpenToRounds(account.linkedPersonId),
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
