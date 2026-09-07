/**
 * Email templates. Pure functions returning { subject, html }. No React,
 * no MJML — hand-written inline-styled HTML keeps the dep footprint zero
 * and the templates legible in code review.
 *
 * Template aesthetic mirrors the Clubhouse UI: navy + cream + gold accent,
 * Playfair-feeling serif for display copy (via Georgia fallback in email),
 * restrained — like a letter from the captain.
 */

const NAVY = '#0a1628'
const CREAM = '#faf7f2'
const GOLD = '#c8a84b'
const MUTED = '#6b6155'
const SERIF = "Georgia, 'Times New Roman', serif"
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

function shell(inner: string, footerCtaUrl?: string, unsubscribeUrl?: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:${CREAM};font-family:${SANS};color:${NAVY};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CREAM};padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#ffffff;border:1px solid #e8dec9;border-radius:14px;overflow:hidden;">
        <tr><td style="height:6px;background:${GOLD};"></td></tr>
        <tr><td style="padding:32px 36px;">
          <p style="margin:0 0 6px 0;font-size:10px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:${MUTED};">Penn Men&rsquo;s Golf</p>
          ${inner}
          ${
            footerCtaUrl
              ? `<p style="margin:32px 0 0 0;font-size:11px;color:${MUTED};">
                  This address isn&rsquo;t monitored, but Ryan reads
                  <a href="mailto:rtchang@upenn.edu" style="color:${NAVY};text-decoration:underline;">rtchang@upenn.edu</a>.
                  The Clubhouse is at
                  <a href="${footerCtaUrl}" style="color:${NAVY};text-decoration:underline;">${footerCtaUrl.replace(/^https?:\/\//, '')}</a>.
                </p>`
              : ''
          }
          ${
            unsubscribeUrl
              ? `<p style="margin:10px 0 0 0;font-size:11px;color:${MUTED};">
                  Don&rsquo;t want the weekly note?
                  <a href="${unsubscribeUrl}" style="color:${NAVY};text-decoration:underline;">Turn it off</a>.
                </p>`
              : ''
          }
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function btn(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${NAVY};color:#ffffff;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;padding:13px 22px;border-radius:8px;">${label}</a>`
}

// ── Welcome ──────────────────────────────────────────────────────────────────

export function renderWelcomeEmail(input: {
  firstName?: string | null
  clubhouseUrl: string
}): { subject: string; html: string } {
  const name = input.firstName ? `, ${input.firstName}` : ''
  const subject = 'Welcome to the Penn Golf Clubhouse'
  const inner = `
    <h1 style="margin:6px 0 14px 0;font-family:${SERIF};font-weight:500;font-size:28px;line-height:1.2;color:${NAVY};">
      Welcome through the gate${name}.
    </h1>
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.55;color:#3d4a5c;">
      Your locker is yours. The Clubhouse is where the Penn Men&rsquo;s Golf
      family keeps track of who&rsquo;s where, who&rsquo;s open to a round,
      and who can throw a warm intro your way.
    </p>
    <p style="margin:0 0 24px 0;font-size:15px;line-height:1.55;color:#3d4a5c;">
      Three things to do this week:
    </p>
    <ul style="margin:0 0 28px 0;padding:0 0 0 20px;font-size:14px;line-height:1.7;color:#3d4a5c;">
      <li>Set your city on your locker card.</li>
      <li>Mark one availability, coffee, a round, or a warm intro.</li>
      <li>Post a Moment, a tee time, or an ask in the Career Room.</li>
    </ul>
    <p style="margin:0;">${btn(input.clubhouseUrl, 'Open the Clubhouse')}</p>
  `
  return { subject, html: shell(inner, input.clubhouseUrl) }
}

// ── Captain notification: new claim ──────────────────────────────────────────

export function renderClaimNotification(input: {
  requesterName: string
  requesterEmail: string
  claimedName: string
  claimedYears?: string
  adminUrl: string
  /** Set when the Google profile name doesn't match the book entry well —
   * the captain should look twice. */
  matchHint?: 'strong' | 'weak'
}): { subject: string; html: string } {
  const subject = `Penn Golf · Claim request from ${input.requesterName}`
  const matchLine =
    input.matchHint === 'weak'
      ? `<p style="margin:0 0 12px 0;font-size:13px;color:#990000;background:#990000;background:rgba(153,0,0,0.06);border:1px solid rgba(153,0,0,0.25);border-radius:6px;padding:10px 12px;">
          Google profile name doesn&rsquo;t closely match the Member Book entry. Double-check before approving.
        </p>`
      : ''
  const inner = `
    <h1 style="margin:6px 0 14px 0;font-family:${SERIF};font-weight:500;font-size:24px;line-height:1.2;color:${NAVY};">
      New claim waiting for review
    </h1>
    ${matchLine}
    <p style="margin:0 0 14px 0;font-size:14px;line-height:1.55;color:#3d4a5c;">
      <strong>${escapeHtml(input.requesterName)}</strong>
      <span style="color:${MUTED}">(${escapeHtml(input.requesterEmail)})</span>
      is asking to claim:
    </p>
    <p style="margin:0 0 20px 0;font-size:15px;line-height:1.4;color:${NAVY};font-family:${SERIF};">
      ${escapeHtml(input.claimedName)}${input.claimedYears ? ` <span style="color:${MUTED}">· ${escapeHtml(input.claimedYears)}</span>` : ''}
    </p>
    <p style="margin:0;">${btn(input.adminUrl, 'Review in admin')}</p>
  `
  return { subject, html: shell(inner, input.adminUrl) }
}

// ── User notification: claim declined ────────────────────────────────────────

export function renderClaimDeclined(input: {
  firstName?: string | null
  claimedName: string
  captainEmail: string
}): { subject: string; html: string } {
  const greeting = input.firstName ? `Hi ${input.firstName},` : 'Hi,'
  const subject = 'Penn Golf · Your claim needs a closer look'
  const inner = `
    <h1 style="margin:6px 0 14px 0;font-family:${SERIF};font-weight:500;font-size:24px;line-height:1.2;color:${NAVY};">
      One more step on your claim
    </h1>
    <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#3d4a5c;">
      ${escapeHtml(greeting)} the captain wasn&rsquo;t able to confirm your request to claim
      <strong>${escapeHtml(input.claimedName)}</strong> from the Member Book.
    </p>
    <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#3d4a5c;">
      Most often this is because the Google account name didn&rsquo;t match the book entry.
      Email <a href="mailto:${input.captainEmail}" style="color:${NAVY};text-decoration:underline;">${escapeHtml(input.captainEmail)}</a>
      with a quick note (your years on the team, or how you're connected to the program) and we&rsquo;ll get you sorted.
    </p>
  `
  return { subject, html: shell(inner) }
}

// ── Team Q&A: a member asked the team a question ─────────────────────────────

export function renderTeamQuestionEmail(input: {
  playerFirstName?: string | null
  askerName: string
  question: string
  /** True when the question was aimed specifically at this player. */
  targeted: boolean
  answerUrl: string
}): { subject: string; html: string } {
  const greeting = input.playerFirstName ? `Hi ${escapeHtml(input.playerFirstName)},` : 'Hi,'
  const subject = input.targeted
    ? `${input.askerName} asked you a question`
    : `New question for the team from ${input.askerName}`
  const lead = input.targeted
    ? `<strong>${escapeHtml(input.askerName)}</strong> asked you a question on the Clubhouse:`
    : `<strong>${escapeHtml(input.askerName)}</strong> asked the team a question:`
  const inner = `
    <h1 style="margin:6px 0 14px 0;font-family:${SERIF};font-weight:500;font-size:24px;line-height:1.2;color:${NAVY};">
      ${input.targeted ? 'Someone wants your take' : 'A question for the team'}
    </h1>
    <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#3d4a5c;">
      ${greeting} ${lead}
    </p>
    <blockquote style="margin:0 0 20px 0;padding:12px 16px;border-left:3px solid ${GOLD};background:${CREAM};font-size:15px;line-height:1.5;color:${NAVY};">
      ${escapeHtml(input.question)}
    </blockquote>
    <p style="margin:0;">${btn(input.answerUrl, 'Answer on the Clubhouse')}</p>
    <p style="margin:16px 0 0 0;font-size:13px;color:${MUTED};line-height:1.5;">
      A quick reply means a lot, it&rsquo;s how alumni stay close to the team.
    </p>
  `
  return { subject, html: shell(inner, input.answerUrl) }
}

// ── Team Q&A: a player answered your question ────────────────────────────────

export function renderTeamAnswerEmail(input: {
  askerFirstName?: string | null
  responderName: string
  question: string
  answer: string
  url: string
}): { subject: string; html: string } {
  const greeting = input.askerFirstName ? `Hi ${escapeHtml(input.askerFirstName)},` : 'Hi,'
  const subject = `${input.responderName} answered your question`
  const inner = `
    <h1 style="margin:6px 0 14px 0;font-family:${SERIF};font-weight:500;font-size:24px;line-height:1.2;color:${NAVY};">
      You got an answer
    </h1>
    <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#3d4a5c;">
      ${greeting} <strong>${escapeHtml(input.responderName)}</strong> replied to your question.
    </p>
    <p style="margin:0 0 5px 0;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${MUTED};">You asked</p>
    <blockquote style="margin:0 0 16px 0;padding:10px 16px;border-left:3px solid #e8dec9;background:${CREAM};font-size:14px;line-height:1.5;color:${MUTED};">
      ${escapeHtml(input.question)}
    </blockquote>
    <p style="margin:0 0 5px 0;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${MUTED};">${escapeHtml(input.responderName)} said</p>
    <blockquote style="margin:0 0 20px 0;padding:12px 16px;border-left:3px solid ${GOLD};background:${CREAM};font-size:15px;line-height:1.5;color:${NAVY};">
      ${escapeHtml(input.answer)}
    </blockquote>
    <p style="margin:0;">${btn(input.url, 'See it on the Clubhouse')}</p>
  `
  return { subject, html: shell(inner, input.url) }
}

// ── Open Request: a Penn Golf alum is in your area ───────────────────────────

/**
 * Someone asked you for advice / an intro. The flagship Ask had no email at
 * all — only an in-app bell and web push, which almost nobody has enabled —
 * so asks were effectively silent for the recipient.
 */
export function renderAskEmail(input: {
  recipientFirstName?: string | null
  fromName: string
  purposeLabel: string
  message: string
  url: string
}): { subject: string; html: string } {
  const greeting = input.recipientFirstName ? `Hi ${escapeHtml(input.recipientFirstName)},` : 'Hi,'
  const subject = `${input.fromName} asked you about ${input.purposeLabel.toLowerCase()}`
  const inner = `
    <h1 style="margin:6px 0 14px 0;font-family:${SERIF};font-weight:500;font-size:24px;line-height:1.2;color:${NAVY};">
      ${escapeHtml(input.fromName)} reached out
    </h1>
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.55;color:#3d4a5c;">${greeting}</p>
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.55;color:#3d4a5c;">
      A Penn Golf member asked you about <strong>${escapeHtml(input.purposeLabel.toLowerCase())}</strong>.
    </p>
    <blockquote style="margin:0 0 20px 0;padding:12px 16px;border-left:3px solid ${GOLD};background:#fdfcf9;font-size:14px;line-height:1.6;color:#3d4a5c;">
      ${escapeHtml(input.message).slice(0, 600)}
    </blockquote>
    <p style="margin:0 0 20px 0;font-size:14px;line-height:1.55;color:#3d4a5c;">
      No pressure and no deadline, a short reply, or a pass, both help.
    </p>
    <p style="margin:0;">${btn(input.url, 'Read and reply')}</p>
  `
  return { subject, html: shell(inner, input.url) }
}

/**
 * Your ask got an answer. Without this the loop never closed — the asker had
 * to keep checking the page to find out.
 */
export function renderAskAnsweredEmail(input: {
  askerFirstName?: string | null
  alumniName: string
  statusLabel: string
  responseMessage?: string | null
  url: string
}): { subject: string; html: string } {
  const greeting = input.askerFirstName ? `Hi ${escapeHtml(input.askerFirstName)},` : 'Hi,'
  const subject = `${input.alumniName} replied to your ask`
  const inner = `
    <h1 style="margin:6px 0 14px 0;font-family:${SERIF};font-weight:500;font-size:24px;line-height:1.2;color:${NAVY};">
      You got a reply
    </h1>
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.55;color:#3d4a5c;">${greeting}</p>
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.55;color:#3d4a5c;">
      <strong>${escapeHtml(input.alumniName)}</strong> ${escapeHtml(input.statusLabel)}.
    </p>
    ${input.responseMessage ? `<blockquote style="margin:0 0 20px 0;padding:12px 16px;border-left:3px solid ${GOLD};background:#fdfcf9;font-size:14px;line-height:1.6;color:#3d4a5c;">${escapeHtml(input.responseMessage).slice(0, 600)}</blockquote>` : ''}
    <p style="margin:0;">${btn(input.url, 'Open the Clubhouse')}</p>
  `
  return { subject, html: shell(inner, input.url) }
}

export function renderNearbyRequestEmail(input: {
  recipientFirstName?: string | null
  fromName: string
  /** "a round" | "coffee" | "drinks" | "dinner" */
  intentLabel: string
  placeText: string
  whenText?: string
  note: string
  fromHomeCourse?: string | null
  guestFeesOffered?: boolean
  url: string
}): { subject: string; html: string } {
  const greeting = input.recipientFirstName ? `Hi ${escapeHtml(input.recipientFirstName)},` : 'Hi,'
  const subject = `${input.fromName} is around ${input.placeText}, up for ${input.intentLabel}`
  const meta = [
    input.whenText ? escapeHtml(input.whenText) : '',
    input.fromHomeCourse ? `member at ${escapeHtml(input.fromHomeCourse)}` : '',
    input.guestFeesOffered ? 'covering guest fees' : '',
  ]
    .filter(Boolean)
    .join(' &middot; ')
  const inner = `
    <h1 style="margin:6px 0 14px 0;font-family:${SERIF};font-weight:500;font-size:24px;line-height:1.2;color:${NAVY};">
      Someone from Penn Golf is in your area
    </h1>
    <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#3d4a5c;">
      ${greeting} <strong>${escapeHtml(input.fromName)}</strong> is around
      <strong>${escapeHtml(input.placeText)}</strong> and is up for ${escapeHtml(input.intentLabel)}.
    </p>
    <blockquote style="margin:0 0 14px 0;padding:12px 16px;border-left:3px solid ${GOLD};background:${CREAM};font-size:15px;line-height:1.5;color:${NAVY};">
      ${escapeHtml(input.note)}
    </blockquote>
    ${meta ? `<p style="margin:0 0 18px 0;font-size:13px;color:${MUTED};">${meta}</p>` : ''}
    <p style="margin:0;">${btn(input.url, 'See it on the Clubhouse')}</p>
    <p style="margin:16px 0 0 0;font-size:13px;color:${MUTED};line-height:1.5;">
      This is the whole point, a game (or a coffee) wherever the road takes you.
    </p>
  `
  return { subject, html: shell(inner, input.url) }
}

/**
 * A round (or a coffee, drinks, dinner) was posted near you.
 *
 * The counterpart to renderNearbyRequestEmail: that one fires when a member is
 * passing through, this one fires when someone puts a real date on the board.
 */
export function renderNewRoundEmail(input: {
  recipientFirstName?: string | null
  hostName: string
  title: string
  /** "a round" | "coffee" | "drinks" | "dinner" | "an event" */
  typeLabel: string
  placeText: string
  venue?: string | null
  dateText: string
  timeText?: string | null
  description?: string | null
  url: string
}): { subject: string; html: string } {
  const greeting = input.recipientFirstName ? `Hi ${escapeHtml(input.recipientFirstName)},` : 'Hi,'
  const subject = `${input.hostName} is hosting ${input.typeLabel} in ${input.placeText}`
  const meta = [
    escapeHtml(input.dateText),
    input.timeText ? escapeHtml(input.timeText) : '',
    input.venue ? escapeHtml(input.venue) : '',
  ]
    .filter(Boolean)
    .join(' &middot; ')
  const inner = `
    <h1 style="margin:6px 0 14px 0;font-family:${SERIF};font-weight:500;font-size:24px;line-height:1.2;color:${NAVY};">
      There is a new tee sheet near you
    </h1>
    <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#3d4a5c;">
      ${greeting} <strong>${escapeHtml(input.hostName)}</strong> posted
      <strong>${escapeHtml(input.title)}</strong> in ${escapeHtml(input.placeText)}.
    </p>
    ${meta ? `<p style="margin:0 0 14px 0;font-size:14px;color:${NAVY};">${meta}</p>` : ''}
    ${
      input.description
        ? `<blockquote style="margin:0 0 14px 0;padding:12px 16px;border-left:3px solid ${GOLD};background:${CREAM};font-size:15px;line-height:1.5;color:${NAVY};">
      ${escapeHtml(input.description)}
    </blockquote>`
        : ''
    }
    <p style="margin:0;">${btn(input.url, 'See it and put your name down')}</p>
    <p style="margin:16px 0 0 0;font-size:13px;color:${MUTED};line-height:1.5;">
      You are getting this because your card says you are nearby.
    </p>
  `
  return { subject, html: shell(inner, input.url) }
}

/** The one-time sign-in link, for members who do not use a Google account. */
export function renderSignInLinkEmail(input: {
  url: string
  minutes: number
}): { subject: string; html: string } {
  const inner = `
    <h1 style="margin:6px 0 14px 0;font-family:${SERIF};font-weight:500;font-size:24px;line-height:1.2;color:${NAVY};">
      Your sign-in link
    </h1>
    <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#3d4a5c;">
      Click below to sign in to the Penn Golf Clubhouse. The link works once and
      expires in ${input.minutes} minutes.
    </p>
    <p style="margin:0;">${btn(input.url, 'Sign in')}</p>
    <p style="margin:18px 0 0 0;font-size:13px;color:${MUTED};line-height:1.5;">
      If you did not ask for this, you can ignore it. Nobody can sign in as you
      without opening this email.
    </p>
  `
  return { subject: 'Your Penn Golf Clubhouse sign-in link', html: shell(inner, input.url) }
}

// ── Weekly Digest ────────────────────────────────────────────────────────────

interface DigestMember { name: string; classLabel?: string }
interface DigestGathering { title: string; dateText: string; city?: string }
interface DigestCareerPost { kind: 'ask' | 'offer'; headline: string; sector: string; postedByName: string }
interface DigestMoment { caption: string; postedByName: string; photoUrl?: string; mediaType?: 'image' | 'video' }
interface DigestNewsItem { title: string; sourceUrl: string }
interface DigestResult { eventName: string; resultText: string; dateRange: string; leaderboardUrl?: string }
interface DigestNextUp { eventName: string; dateRange: string; locationText?: string; daysAway: number }

/**
 * The weekly note to alumni.
 *
 * Ordered for the person receiving it, not for the database. An alum who
 * graduated in 1994 does not know this year's new members and cannot act on
 * a career post from someone they have never met, but they do want to know
 * how the team played. So the team leads, then anything they could actually
 * turn up to, then the people.
 *
 * Every section is capped. A complete list of everything that happened is a
 * report; three things worth knowing is an email.
 */
export function renderWeeklyDigest(input: {
  teamName: string
  weekOf: string
  result?: DigestResult
  nextUp?: DigestNextUp
  newMembers: DigestMember[]
  asks: DigestCareerPost[]
  offers: DigestCareerPost[]
  gatherings: DigestGathering[]
  moments: DigestMoment[]
  newsItems: DigestNewsItem[]
  clubhouseUrl: string
}): { subject: string; html: string } {
  const CAP = 3

  /**
   * Lead with the most newsworthy single thing rather than a tally. A count
   * of things a reader cannot picture ("2 on the books") is not a reason to
   * open an email; a score is.
   */
  const subject = (() => {
    if (input.result) {
      return `${input.teamName} · ${input.result.resultText.split(' · ')[0]} at ${input.result.eventName}`
    }
    if (input.nextUp && input.nextUp.daysAway <= 8) {
      const when = input.nextUp.daysAway <= 1 ? 'tomorrow' : `in ${input.nextUp.daysAway} days`
      return `${input.teamName} · ${input.nextUp.eventName} ${when}`
    }
    if (input.gatherings.length === 1) {
      return `${input.teamName} · ${input.gatherings[0].title}`
    }
    if (input.gatherings.length > 1) {
      return `${input.teamName} · ${input.gatherings.length} rounds on the board`
    }
    if (input.asks.length) {
      return `${input.teamName} · A player is asking for help`
    }
    if (input.newMembers.length) {
      const n = input.newMembers.length
      return `${input.teamName} · ${n === 1 ? `${input.newMembers[0].name} joined` : `${n} more joined the Clubhouse`}`
    }
    return `${input.teamName} · This week at the Clubhouse`
  })()

  const sec = (title: string, body: string): string => `
    <div style="margin:26px 0 0 0;padding:0 0 0 0;">
      <p style="margin:0 0 8px 0;font-size:10px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:${MUTED};">${title}</p>
      ${body}
    </div>
  `
  const li = (s: string): string => `<p style="margin:0 0 6px 0;font-size:14px;line-height:1.55;color:#0a1628;">${s}</p>`
  const more = (n: number, label: string): string =>
    n > 0
      ? `<p style="margin:6px 0 0 0;font-size:12px;color:${MUTED};">and ${n} more ${label}.</p>`
      : ''

  const sections: string[] = []

  // 1. The team. The reason an alum opens this at all.
  if (input.result || input.nextUp) {
    const rows: string[] = []
    if (input.result) {
      rows.push(`
        <p style="margin:0 0 4px 0;font-family:${SERIF};font-size:19px;line-height:1.25;color:${NAVY};">
          ${escapeHtml(input.result.resultText)}
        </p>
        <p style="margin:0 0 2px 0;font-size:13.5px;color:#3d4a5c;">
          ${escapeHtml(input.result.eventName)} <span style="color:${MUTED}">· ${escapeHtml(input.result.dateRange)}</span>
        </p>
        ${
          input.result.leaderboardUrl
            ? `<p style="margin:6px 0 0 0;font-size:12.5px;"><a href="${input.result.leaderboardUrl}" style="color:${NAVY};text-decoration:underline;">Full leaderboard</a></p>`
            : ''
        }
      `)
    }
    if (input.nextUp) {
      const when =
        input.nextUp.daysAway <= 0
          ? 'under way now'
          : input.nextUp.daysAway === 1
            ? 'tomorrow'
            : `in ${input.nextUp.daysAway} days`
      rows.push(`
        <p style="margin:${input.result ? '14px' : '0'} 0 2px 0;font-size:14px;line-height:1.5;color:#0a1628;">
          <strong>Next up, ${escapeHtml(when)}:</strong> ${escapeHtml(input.nextUp.eventName)}
        </p>
        <p style="margin:0;font-size:13px;color:${MUTED};">
          ${escapeHtml(input.nextUp.dateRange)}${input.nextUp.locationText ? ' · ' + escapeHtml(input.nextUp.locationText) : ''}
        </p>
      `)
    }
    sections.push(
      sec(
        'The team',
        `<div style="padding:14px 16px;background:${CREAM};border:1px solid #e8dec9;border-radius:8px;">${rows.join('')}</div>`,
      ),
    )
  }

  // 2. Things a reader could actually turn up to.
  if (input.gatherings.length) {
    sections.push(
      sec(
        'Where you could play',
        input.gatherings
          .slice(0, CAP)
          .map(g =>
            li(
              `<strong>${escapeHtml(g.title)}</strong> <span style="color:${MUTED}">· ${escapeHtml(g.dateText)}${g.city ? ' · ' + escapeHtml(g.city) : ''}</span>`,
            ),
          )
          .join('') + more(input.gatherings.length - CAP, 'on the board'),
      ),
    )
  }

  // 3. Asks before offers. Alumni respond to being needed.
  if (input.asks.length) {
    sections.push(
      sec(
        input.asks.length === 1 ? 'Someone is asking' : 'People are asking',
        input.asks
          .slice(0, CAP)
          .map(p =>
            li(
              `<strong>${escapeHtml(p.headline)}</strong> <span style="color:${MUTED}">· ${escapeHtml(p.sector)} · ${escapeHtml(p.postedByName)}</span>`,
            ),
          )
          .join('') + more(input.asks.length - CAP, 'asks'),
      ),
    )
  }
  if (input.offers.length) {
    sections.push(
      sec(
        'Offered up',
        input.offers
          .slice(0, CAP)
          .map(p =>
            li(
              `<strong>${escapeHtml(p.headline)}</strong> <span style="color:${MUTED}">· ${escapeHtml(p.sector)} · ${escapeHtml(p.postedByName)}</span>`,
            ),
          )
          .join('') + more(input.offers.length - CAP, 'offers'),
      ),
    )
  }

  // 4. Moments, with the photo rather than only its caption.
  if (input.moments.length) {
    const lead = input.moments.find(m => m.photoUrl && m.mediaType !== 'video')
    const body =
      (lead?.photoUrl
        ? `<a href="${input.clubhouseUrl}"><img src="${lead.photoUrl}" alt="" width="488" style="display:block;width:100%;max-width:488px;height:auto;border-radius:8px;border:1px solid #e8dec9;margin:0 0 8px 0;"></a>`
        : '') +
      input.moments
        .slice(0, 2)
        .map(m =>
          li(
            `<em style="color:#3d4a5c">${escapeHtml(m.caption.slice(0, 90))}${m.caption.length > 90 ? '…' : ''}</em> <span style="color:${MUTED}">· ${escapeHtml(m.postedByName)}</span>`,
          ),
        )
        .join('') + more(input.moments.length - 2, 'posted')
    sections.push(sec('Posted this week', body))
  }

  // 5. Who joined. Brief, and last of the people sections, because a name
  //    from a class you never overlapped with means little on its own.
  if (input.newMembers.length) {
    const names = input.newMembers
      .slice(0, 6)
      .map(
        m =>
          `${escapeHtml(m.name)}${m.classLabel ? ` <span style="color:${MUTED}">${escapeHtml(m.classLabel)}</span>` : ''}`,
      )
      .join(', ')
    sections.push(
      sec(
        input.newMembers.length === 1 ? 'New in the book' : 'New in the book',
        li(names) + more(input.newMembers.length - 6, 'claimed a card'),
      ),
    )
  }

  // 6. Penn's own headlines last, capped. They are already public, so they
  //    are the least exclusive thing in here.
  if (input.newsItems.length) {
    sections.push(
      sec(
        'From the box',
        input.newsItems
          .slice(0, 2)
          .map(n =>
            li(
              `<a href="${n.sourceUrl}" style="color:${NAVY};text-decoration:underline;">${escapeHtml(n.title)}</a>`,
            ),
          )
          .join(''),
      ),
    )
  }

  const inner = `
    <h1 style="margin:6px 0 4px 0;font-family:${SERIF};font-weight:500;font-size:24px;line-height:1.2;color:${NAVY};">
      This week at the Clubhouse
    </h1>
    <p style="margin:0 0 8px 0;font-size:13px;color:${MUTED};">${escapeHtml(input.weekOf)}</p>
    ${sections.join('')}
    <div style="margin:30px 0 0 0;">${btn(input.clubhouseUrl, 'Open the Clubhouse')}</div>
  `
  return {
    subject,
    html: shell(inner, input.clubhouseUrl, `${input.clubhouseUrl}/account/profile`),
  }
}

// ── RSVP confirmation (to the attendee) ─────────────────────────────────────

export function renderRsvpConfirmation(input: {
  firstName?: string | null
  gatheringTitle: string
  gatheringType: 'round' | 'coffee' | 'drinks' | 'dinner' | 'event'
  dateText: string
  timeText?: string
  city?: string
  state?: string
  venue?: string
  hostName: string
  googleCalUrl: string
  clubhouseUrl: string
}): { subject: string; html: string } {
  const greeting = input.firstName ? `Hi ${input.firstName},` : 'Hi,'
  const subject = `You're on the sheet · ${input.gatheringTitle}`
  const locationLine = [input.venue, input.city, input.state].filter(Boolean).join(', ')
  const inner = `
    <h1 style="margin:6px 0 14px 0;font-family:${SERIF};font-weight:500;font-size:24px;line-height:1.2;color:${NAVY};">
      You&rsquo;re on the sheet.
    </h1>
    <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#3d4a5c;">
      ${escapeHtml(greeting)} the host has been notified. Here&rsquo;s what you signed up for:
    </p>
    <div style="margin:0 0 20px 0;padding:14px 16px;background:${CREAM};border:1px solid #e8dec9;border-radius:8px;">
      <p style="margin:0 0 6px 0;font-size:16px;line-height:1.3;color:${NAVY};font-family:${SERIF};font-weight:500;">
        ${escapeHtml(input.gatheringTitle)}
      </p>
      <p style="margin:0 0 4px 0;font-size:13px;color:#3d4a5c;">
        ${escapeHtml(input.dateText)}${input.timeText ? ' · ' + escapeHtml(input.timeText) : ''}
      </p>
      ${locationLine ? `<p style="margin:0 0 4px 0;font-size:13px;color:${MUTED};">${escapeHtml(locationLine)}</p>` : ''}
      <p style="margin:0;font-size:12px;color:${MUTED};">Hosted by ${escapeHtml(input.hostName)}</p>
    </div>
    <p style="margin:0 0 12px 0;font-size:13.5px;line-height:1.55;color:#3d4a5c;">
      We attached an .ics file to this email, click it to add the event to Apple Calendar, Outlook,
      or any other calendar app. For Gmail users:
    </p>
    <p style="margin:0 0 24px 0;">${btn(input.googleCalUrl, 'Add to Google Calendar')}</p>
    <p style="margin:0 0 0 0;font-size:12.5px;color:${MUTED};">
      Plans change? Open the gathering in the
      <a href="${input.clubhouseUrl}" style="color:${NAVY};text-decoration:underline;">Clubhouse</a>
      to message the host.
    </p>
  `
  return { subject, html: shell(inner, input.clubhouseUrl) }
}

/**
 * The host sends a note to everyone on the sheet, e.g. the day before:
 * "we're off the first tee at 8:10, park in the lower lot".
 */
export function renderHostMessage(input: {
  firstName?: string | null
  gatheringTitle: string
  dateText: string
  timeText?: string
  venue?: string
  city?: string
  state?: string
  hostName: string
  message: string
  clubhouseUrl: string
}): { subject: string; html: string } {
  const greeting = input.firstName ? `Hi ${input.firstName},` : 'Hi,'
  const subject = `${input.gatheringTitle} · a note from ${input.hostName}`
  const locationLine = [input.venue, input.city, input.state].filter(Boolean).join(', ')
  const inner = `
    <h1 style="margin:6px 0 14px 0;font-family:${SERIF};font-weight:500;font-size:24px;line-height:1.2;color:${NAVY};">
      A note from ${escapeHtml(input.hostName)}.
    </h1>
    <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#3d4a5c;">
      ${escapeHtml(greeting)} you&rsquo;re on the sheet for this one.
    </p>
    <div style="margin:0 0 18px 0;padding:14px 16px;background:${CREAM};border:1px solid #e8dec9;border-radius:8px;">
      <p style="margin:0 0 6px 0;font-size:16px;line-height:1.3;color:${NAVY};font-family:${SERIF};font-weight:500;">
        ${escapeHtml(input.gatheringTitle)}
      </p>
      <p style="margin:0 0 4px 0;font-size:13px;color:#3d4a5c;">
        ${escapeHtml(input.dateText)}${input.timeText ? ' &middot; ' + escapeHtml(input.timeText) : ''}
      </p>
      ${locationLine ? `<p style="margin:0;font-size:13px;color:${MUTED};">${escapeHtml(locationLine)}</p>` : ''}
    </div>
    <div style="margin:0 0 22px 0;padding:16px 18px;border-left:3px solid ${NAVY};background:#ffffff;">
      <p style="margin:0;font-size:14.5px;line-height:1.65;color:${NAVY};white-space:pre-wrap;">${escapeHtml(input.message)}</p>
    </div>
    <p style="margin:0 0 22px 0;">${btn(input.clubhouseUrl, 'Open in the Clubhouse')}</p>
    <p style="margin:0;font-size:12.5px;color:${MUTED};">
      You&rsquo;re getting this because you&rsquo;re on the sheet for this one.
    </p>
  `
  return { subject, html: shell(inner, input.clubhouseUrl) }
}

// ── Host notification (a new RSVP just came in) ─────────────────────────────

export function renderHostRsvpNotification(input: {
  hostFirstName?: string | null
  gatheringTitle: string
  dateText: string
  attendeeName: string
  attendeeEmail?: string
  attendeeNote?: string
  clubhouseUrl: string
}): { subject: string; html: string } {
  const greeting = input.hostFirstName ? `Hi ${input.hostFirstName},` : 'Hi,'
  const subject = `New RSVP · ${input.gatheringTitle}`
  const noteBlock = input.attendeeNote
    ? `<p style="margin:0 0 14px 0;padding:10px 12px;background:${CREAM};border-left:3px solid ${GOLD};font-size:13.5px;line-height:1.55;color:#3d4a5c;font-style:italic;">
        &ldquo;${escapeHtml(input.attendeeNote)}&rdquo;
      </p>`
    : ''
  const emailLine = input.attendeeEmail
    ? `<p style="margin:0 0 14px 0;font-size:13px;color:${MUTED};">
        Reach them at <a href="mailto:${escapeHtml(input.attendeeEmail)}" style="color:${NAVY};text-decoration:underline;">${escapeHtml(input.attendeeEmail)}</a>.
      </p>`
    : ''
  const inner = `
    <h1 style="margin:6px 0 14px 0;font-family:${SERIF};font-weight:500;font-size:24px;line-height:1.2;color:${NAVY};">
      Someone&rsquo;s in.
    </h1>
    <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#3d4a5c;">
      ${escapeHtml(greeting)} <strong>${escapeHtml(input.attendeeName)}</strong> just RSVP&rsquo;d to your
      gathering: <strong>${escapeHtml(input.gatheringTitle)}</strong> &middot; ${escapeHtml(input.dateText)}.
    </p>
    ${noteBlock}
    ${emailLine}
    <p style="margin:0;">${btn(input.clubhouseUrl, 'Open the gathering')}</p>
  `
  return { subject, html: shell(inner, input.clubhouseUrl) }
}

// ── Idea submission notification (to the founder) ────────────────────────────

export function renderIdeaSubmissionEmail(input: {
  submitterName: string
  submitterEmail?: string
  message: string
  internalUrl: string
}): { subject: string; html: string } {
  const subject = `New Clubhouse idea from ${input.submitterName}`
  const emailLine = input.submitterEmail
    ? `<p style="margin:0 0 14px 0;font-size:13px;color:${MUTED};">
        Reply to: <a href="mailto:${escapeHtml(input.submitterEmail)}" style="color:${NAVY};text-decoration:underline;">${escapeHtml(input.submitterEmail)}</a>
      </p>`
    : ''
  const inner = `
    <h1 style="margin:6px 0 14px 0;font-family:${SERIF};font-weight:500;font-size:24px;line-height:1.2;color:${NAVY};">
      New idea for the Clubhouse
    </h1>
    <p style="margin:0 0 6px 0;font-size:14px;line-height:1.55;color:#3d4a5c;">
      From: <strong>${escapeHtml(input.submitterName)}</strong>
    </p>
    ${emailLine}
    <div style="margin:14px 0 24px 0;padding:14px 16px;background:${CREAM};border-left:3px solid ${GOLD};font-size:14px;line-height:1.65;color:#3d4a5c;white-space:pre-wrap;">
      ${escapeHtml(input.message)}
    </div>
    <p style="margin:0;">${btn(input.internalUrl, 'Open /internal')}</p>
  `
  return { subject, html: shell(inner, input.internalUrl) }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
