/**
 * Email templates. Pure functions returning { subject, html }. No React,
 * no MJML — hand-written inline-styled HTML keeps the dep footprint zero
 * and the templates legible in code review.
 *
 * Template aesthetic mirrors the Clubhouse UI: navy + cream + gold accent,
 * Playfair-feeling serif for display copy (via Georgia fallback in email),
 * restrained — like a letter from the captain.
 */

import { CLUBHOUSE_REPLY_ADDRESS } from '@/lib/email/identity'

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
                  This inbox isn&rsquo;t monitored. Questions or feedback? Email Ryan at
                  <a href="mailto:${CLUBHOUSE_REPLY_ADDRESS}" style="color:${NAVY};text-decoration:underline;">${CLUBHOUSE_REPLY_ADDRESS}</a>,
                  or just hit reply. The Clubhouse is at
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
  /** "a round" | "coffee" | "drinks" | "dinner" | "an intro" */
  intentLabel: string
  placeText: string
  whenText?: string
  note: string
  fromHomeCourse?: string | null
  guestFeesOffered?: boolean
  /** True when this went to the whole club rather than to people nearby,
   *  which happens while the club is small enough that a geographic filter
   *  reaches nobody. Telling someone in Boston that a Chicago round is "in
   *  your area" is the fastest way to teach them to ignore these. */
  clubWide?: boolean
  /** An intro request is a favour, not a place, so it reads differently. */
  isIntro?: boolean
  url: string
}): { subject: string; html: string } {
  const greeting = input.recipientFirstName ? `Hi ${escapeHtml(input.recipientFirstName)},` : 'Hi,'
  const subject = input.isIntro
    ? `${input.fromName} is asking the Clubhouse for ${input.intentLabel}`
    : `${input.fromName} is around ${input.placeText}, up for ${input.intentLabel}`
  const headline = input.isIntro
    ? 'Someone from Penn Golf is asking'
    : input.clubWide
      ? 'Someone from Penn Golf is on the road'
      : 'Someone from Penn Golf is in your area'
  const lede = input.isIntro
    ? `${greeting} <strong>${escapeHtml(input.fromName)}</strong> is asking the Clubhouse for ${escapeHtml(input.intentLabel)}.`
    : `${greeting} <strong>${escapeHtml(input.fromName)}</strong> is around
      <strong>${escapeHtml(input.placeText)}</strong> and is up for ${escapeHtml(input.intentLabel)}.`
  const footnote = input.isIntro
    ? 'If you know someone, one reply is the whole favour.'
    : input.clubWide
      ? 'You are getting this because the Clubhouse is still small enough that everyone hears everything. Add your city and these will narrow to your area.'
      : 'This is the whole point, a game (or a coffee) wherever the road takes you.'
  const meta = [
    input.whenText ? escapeHtml(input.whenText) : '',
    input.fromHomeCourse ? `member at ${escapeHtml(input.fromHomeCourse)}` : '',
    input.guestFeesOffered ? 'covering guest fees' : '',
  ]
    .filter(Boolean)
    .join(' &middot; ')
  const inner = `
    <h1 style="margin:6px 0 14px 0;font-family:${SERIF};font-weight:500;font-size:24px;line-height:1.2;color:${NAVY};">
      ${headline}
    </h1>
    <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#3d4a5c;">
      ${lede}
    </p>
    <blockquote style="margin:0 0 14px 0;padding:12px 16px;border-left:3px solid ${GOLD};background:${CREAM};font-size:15px;line-height:1.5;color:${NAVY};">
      ${escapeHtml(input.note)}
    </blockquote>
    ${meta ? `<p style="margin:0 0 18px 0;font-size:13px;color:${MUTED};">${meta}</p>` : ''}
    <p style="margin:0;">${btn(input.url, 'See it on the Clubhouse')}</p>
    <p style="margin:16px 0 0 0;font-size:13px;color:${MUTED};line-height:1.5;">
      ${footnote}
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
  /** True when this went to the whole club rather than to people nearby. The
   *  two lines this email used to end on ("near you", "your card says you are
   *  nearby") are both false in that case, and a member who reads one lie in
   *  an email stops reading the rest. */
  clubWide?: boolean
  url: string
}): { subject: string; html: string } {
  const greeting = input.recipientFirstName ? `Hi ${escapeHtml(input.recipientFirstName)},` : 'Hi,'
  const subject = `${input.hostName} is hosting ${input.typeLabel} in ${input.placeText}`
  const headline = input.clubWide
    ? 'There is a new tee sheet up'
    : 'There is a new tee sheet near you'
  const footnote = input.clubWide
    ? 'You are getting this because the Clubhouse is still small enough that everyone hears everything. Add your city and these will narrow to your area.'
    : 'You are getting this because your card says you are nearby.'
  const meta = [
    escapeHtml(input.dateText),
    input.timeText ? escapeHtml(input.timeText) : '',
    input.venue ? escapeHtml(input.venue) : '',
  ]
    .filter(Boolean)
    .join(' &middot; ')
  const inner = `
    <h1 style="margin:6px 0 14px 0;font-family:${SERIF};font-weight:500;font-size:24px;line-height:1.2;color:${NAVY};">
      ${headline}
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
      ${footnote}
    </p>
  `
  return { subject, html: shell(inner, input.url) }
}

/**
 * For someone who signed in and then stopped.
 *
 * Twelve accounts had signed in and never claimed a card as of 2026-11-07,
 * against 36 who had. They are the cheapest pool in the product: they
 * already found the site, already have an account, and are one click from
 * being in. Nobody had ever written to them.
 *
 * Three shapes, because the reason splits three ways.
 *
 * If their name matches a Member Book card, the only useful thing this
 * email can do is put that card in front of them.
 *
 * If their name is one of the club years, they DID play for Penn and there
 * is no card to find, because Penn dropped the men's team to club status
 * between 1983 and 1992 and published no roster for those seasons. The
 * first draft of this email would have told David Posnick, Rich Furman and
 * Stephen DesJardins that we "could not match your name to a Penn roster",
 * which is false, insulting, and aimed at the three alumni who have brought
 * in more members than anything else this product does.
 *
 * Otherwise we do not know, and the email must not pretend to. Six of the
 * twelve accounts in the first real run had NO name at all, because they
 * signed in with an email link rather than Google, and a seventh was
 * stored as the formal version of a name the club-years list holds as a
 * nickname. An earlier draft opened by telling the reader their name
 * matched no Penn roster, which is an assertion about a person made from
 * a name we often never had. It now asserts nothing and offers both doors.
 */
export function renderClaimNudgeEmail(input: {
  recipientFirstName?: string | null
  /** Their likely Member Book card, when the name matched one. */
  matchName?: string | null
  matchClassLabel?: string | null
  cardUrl?: string | null
  /** They are named in the 1983-1992 club years, so they played and there
   *  is deliberately no Member Book card to claim. */
  clubYears?: boolean
  /** What that era's page records about them, in their own words. */
  clubYearsDetail?: string | null
  joinUrl: string
  clubhouseUrl: string
}): { subject: string; html: string } {
  const greeting = input.recipientFirstName
    ? `Hi ${escapeHtml(input.recipientFirstName)},`
    : 'Hi,'
  const matched = !!(input.matchName && input.cardUrl)
  const subject = matched
    ? `${input.matchName}, your Penn Golf card is still unclaimed`
    : input.clubYears
      ? 'There is no card for your years, and that is on Penn'
      : 'You are one step from being in the Penn Golf Clubhouse'
  const clubYearsInner = `
    <h1 style="margin:6px 0 14px 0;font-family:${SERIF};font-weight:500;font-size:24px;line-height:1.2;color:${NAVY};">
      We know you played
    </h1>
    <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#3d4a5c;">
      ${greeting} you signed in and found nothing to claim, and the reason is
      not you. Penn dropped the men's team to club status between 1983 and
      1992 and stopped publishing a roster, so the Member Book has a
      ten-season hole in it where your years should be.
    </p>
    ${
      input.clubYearsDetail
        ? `<blockquote style="margin:0 0 14px 0;padding:12px 16px;border-left:3px solid ${GOLD};background:${CREAM};font-size:15px;line-height:1.5;color:${NAVY};">
      ${escapeHtml(input.clubYearsDetail)}
    </blockquote>`
        : ''
    }
    <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#3d4a5c;">
      You are already named on the club years page, from what your teammates
      remembered. To get a card of your own, use the door below and say which
      years you played. It takes one line.
    </p>
    <p style="margin:0;">${btn(input.joinUrl, 'Get your card')}</p>
    <p style="margin:16px 0 0 0;font-size:13px;color:${MUTED};line-height:1.5;">
      Reviewed by Ryan Chang, usually within a day. If you can fill in a name
      we are missing from those seasons,
      <a href="${escapeHtml(input.clubhouseUrl)}/club-years" style="color:${NAVY};">the page is here</a>.
    </p>`
  const inner = matched
    ? `
    <h1 style="margin:6px 0 14px 0;font-family:${SERIF};font-weight:500;font-size:24px;line-height:1.2;color:${NAVY};">
      Your card is still sitting there
    </h1>
    <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#3d4a5c;">
      ${greeting} you signed in to the Penn Golf Clubhouse but never picked
      your card, so you are not in the Member Book yet and nobody can find
      you.
    </p>
    <blockquote style="margin:0 0 16px 0;padding:12px 16px;border-left:3px solid ${GOLD};background:${CREAM};font-size:15px;line-height:1.5;color:${NAVY};">
      <strong>${escapeHtml(input.matchName as string)}</strong>${
        input.matchClassLabel
          ? ` <span style="color:${MUTED}">· ${escapeHtml(input.matchClassLabel)}</span>`
          : ''
      }
    </blockquote>
    <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#3d4a5c;">
      We think that is you. Nothing to fill out, you just say so.
    </p>
    <p style="margin:0;">${btn(input.cardUrl as string, 'That is me, claim it')}</p>
    <p style="margin:16px 0 0 0;font-size:13px;color:${MUTED};line-height:1.5;">
      Reviewed by Ryan Chang, usually within a day. If that is not you,
      <a href="${escapeHtml(input.clubhouseUrl)}/member-book" style="color:${NAVY};">search the Member Book</a>
      for your own name.
    </p>`
    : `
    <h1 style="margin:6px 0 14px 0;font-family:${SERIF};font-weight:500;font-size:24px;line-height:1.2;color:${NAVY};">
      You never finished signing up
    </h1>
    <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#3d4a5c;">
      ${greeting} you signed in to the Penn Golf Clubhouse and stopped, so you
      are not in the Member Book and nobody can find you. There are two ways
      in, and we would rather you picked than have us guess.
    </p>
    <p style="margin:0 0 6px 0;font-size:14px;line-height:1.6;color:${NAVY};">
      <strong>If you played for Penn</strong>
    </p>
    <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#3d4a5c;">
      Your card is already in the Member Book, built from Penn's own records
      back to 1930. Find your name and say it is you.
      <a href="${escapeHtml(input.clubhouseUrl)}/member-book" style="color:${NAVY};font-weight:600;">Search the Member Book &rarr;</a>
      One exception: Penn dropped the men's team to club status from 1983 to
      1992 and published no roster, so if those were your years there is no
      card to find and the door below is yours.
    </p>
    <p style="margin:0 0 6px 0;font-size:14px;line-height:1.6;color:${NAVY};">
      <strong>If you did not</strong>
    </p>
    <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#3d4a5c;">
      Penn alumni and students who play golf count, and so do families and
      friends of the program. One line about who you are and you are in.
    </p>
    <p style="margin:0;">${btn(input.joinUrl, 'Join the Clubhouse')}</p>
    <p style="margin:16px 0 0 0;font-size:13px;color:${MUTED};line-height:1.5;">
      Reviewed by Ryan Chang, usually within a day.
    </p>`
  const body = matched ? inner : input.clubYears ? clubYearsInner : inner
  return { subject, html: shell(body, matched ? (input.cardUrl as string) : input.joinUrl) }
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

interface DigestMember {
  name: string
  classLabel?: string
  /** Member Book card id, so a name in the email is one click from a hello. */
  bookId?: string
  /** Used only to tell whether the reader is one of the arrivals. */
  personId?: string
  joinedAt?: string
}
interface DigestGathering { title: string; dateText: string; city?: string }
interface DigestCareerPost { kind: 'ask' | 'offer'; headline: string; sector: string; postedByName: string }
interface DigestMoment { caption: string; postedByName: string; photoUrl?: string; mediaType?: 'image' | 'video' }
interface DigestNewsItem { title: string; sourceUrl: string }
/** A live open request: someone passing through, or someone after an intro. */
interface DigestOpenRequest {
  intent: 'round' | 'drinks' | 'coffee' | 'dinner' | 'intro'
  fromName: string
  note: string
  placeText?: string
  whenText?: string
}
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
  /**
   * Open requests still standing. They email everyone the moment they are
   * posted, but that is one impression on a Tuesday; by Sunday an unanswered
   * ask is invisible. This is the one channel that reaches every member
   * every week, so a request that nobody picked up gets a second look here
   * instead of expiring in silence.
   */
  openRequests: DigestOpenRequest[]
  moments: DigestMoment[]
  newsItems: DigestNewsItem[]
  clubhouseUrl: string
  /** The Member Book, for "say hello" when a name has no card of its own. */
  memberBookUrl?: string
  /** Straight into the Moment composer, for a brand-new member's first post. */
  postMomentUrl?: string
  /**
   * True when this reader is one of the week's arrivals. Flips the arrivals
   * section from "say hello to them" to "you are one of them, post something":
   * the two readers need opposite instructions and the old copy gave the new
   * member nothing to do.
   */
  viewerIsNew?: boolean
  /** This reader's person id, so their own name is not listed back at them. */
  viewerPersonId?: string
  /**
   * What this particular reader's own card is still missing, in plain words
   * ("a photo", "your city"). Empty for a finished card, and for anyone the
   * caller chooses not to nudge. Six of twenty-nine members have filled in
   * anything at all, and the on-site prompt only reaches the ones who come
   * back, so the nudge has to travel with the email.
   */
  profileGaps?: string[]
  /** One sentence on what the top missing field actually does for them. */
  profileGapReason?: string
  /** Deep link into this reader's own profile editor. */
  profileUrl?: string
}): { subject: string; html: string } {
  const CAP = 3

  /**
   * Lead with the most newsworthy single thing rather than a tally. A count
   * of things a reader cannot picture ("2 on the books") is not a reason to
   * open an email; a score is.
   */
  const subject = (() => {
    // Their first email. Whatever else happened, this is what it is about.
    if (input.viewerIsNew) {
      return `Welcome to the ${input.teamName} Clubhouse`
    }
    if (input.result) {
      return `${input.teamName} · ${input.result.resultText.split(' · ')[0]} at ${input.result.eventName}`
    }
    if (input.nextUp && input.nextUp.daysAway <= 8) {
      const when = input.nextUp.daysAway <= 1 ? 'tomorrow' : `in ${input.nextUp.daysAway} days`
      return `${input.teamName} · ${input.nextUp.eventName} ${when}`
    }
    // A wave of arrivals outranks the standing round list. Seven people
    // claiming cards in a week is the news; the Scotland rounds have been on
    // the board for a month and were the subject line every one of them.
    if (input.newMembers.length >= 4) {
      return `${input.teamName} · ${input.newMembers.length} more joined the Clubhouse`
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

  // 2b. Open requests. A specific person wanting a specific thing outranks
  //     anything generic, and an intro request is the only item in this
  //     email that one reply can finish.
  if (input.openRequests.length) {
    const intros = input.openRequests.filter(r => r.intent === 'intro')
    const heading =
      intros.length === input.openRequests.length
        ? input.openRequests.length === 1
          ? 'Someone needs an intro'
          : 'People need intros'
        : 'Asking the room'
    sections.push(
      sec(
        heading,
        input.openRequests
          .slice(0, CAP)
          .map(r => {
            const meta = [r.placeText, r.whenText]
              .filter((v): v is string => !!v)
              .map(escapeHtml)
              .join(' &middot; ')
            return li(
              `<strong>${escapeHtml(r.fromName)}</strong>: ${escapeHtml(r.note)}` +
                (meta ? ` <span style="color:${MUTED}">· ${meta}</span>` : ''),
            )
          })
          .join('') +
          more(input.openRequests.length - CAP, 'on the board') +
          `<p style="margin:10px 0 0 0;"><a href="${escapeHtml(
            input.clubhouseUrl,
          )}/19th-hole" style="font-size:13px;font-weight:600;color:#990000;text-decoration:none;">If you can help one of them &rarr;</a></p>`,
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

  // 5. Who joined.
  //
  // This used to be six names and a tally, placed last on the reasoning that
  // a name from a class you never overlapped with means little on its own.
  // That held when two people arrived a week. Seven claimed cards in a single
  // day and the arrival itself became the week's news, so the whole list goes
  // in: these are the people a reader might actually know, and the one left
  // off the end is somebody's teammate.
  //
  // It also ends in something to do, which it never did. Every name here is
  // one tap from their card, and the closing line differs by reader: a
  // brand-new member is asked to post, everybody else is asked to say hello.
  // The old copy asked nobody for anything, which is most of why six of
  // twenty-nine members have ever filled in a field.
  if (input.newMembers.length) {
    // A hard ceiling only so a freak week cannot mail a directory.
    const VISIBLE = 24
    const others = input.newMembers.filter(
      m => !input.viewerPersonId || m.personId !== input.viewerPersonId,
    )
    const shown = others.slice(0, VISIBLE)
    const names = shown
      .map(m => {
        const label = `${escapeHtml(m.name)}${
          m.classLabel ? ` <span style="color:${MUTED}">${escapeHtml(m.classLabel)}</span>` : ''
        }`
        return m.bookId && input.memberBookUrl
          ? `<a href="${input.memberBookUrl}/${encodeURIComponent(m.bookId)}" style="color:${NAVY};text-decoration:none;border-bottom:1px solid ${GOLD};">${label}</a>`
          : label
      })
      .join(', ')

    const n = input.newMembers.length
    const heading = input.viewerIsNew
      ? 'You and who else arrived'
      : n === 1
        ? 'New in the book'
        : 'Who just arrived'

    const closer = input.viewerIsNew
      ? `<p style="margin:12px 0 0 0;font-size:13.5px;line-height:1.55;color:#3d4a5c;">
           You claimed your card this week, so you are one of them. The fastest
           way to stop being a name on a list is to put one thing up: a photo
           from a round, where you are living now, anything.
         </p>
         <p style="margin:10px 0 0 0;"><a href="${escapeHtml(
           input.postMomentUrl ?? input.clubhouseUrl,
         )}" style="font-size:13px;font-weight:600;color:#990000;text-decoration:none;">Post something &rarr;</a></p>`
      : `<p style="margin:12px 0 0 0;font-size:13.5px;line-height:1.55;color:#3d4a5c;">
           ${
             n === 1
               ? `One name, and a card that stays mostly blank until somebody
                  gets in touch. If you overlapped, a note from you is worth`
               : `Most of these cards are still just a name and a class year.
                  If you played with any of them, a note from you is worth`
           }
           more than anything the site can do on its own.
         </p>
         <p style="margin:10px 0 0 0;"><a href="${escapeHtml(
           input.memberBookUrl ?? input.clubhouseUrl,
         )}" style="font-size:13px;font-weight:600;color:#990000;text-decoration:none;">Open the Member Book &rarr;</a></p>`

    if (shown.length) {
      sections.push(
        sec(heading, li(names) + more(others.length - VISIBLE, 'claimed a card') + closer),
      )
    } else if (input.viewerIsNew) {
      // They are the only arrival. Still worth the nudge, without a list of
      // one name that is their own.
      sections.push(
        sec(
          'Welcome in',
          li('You claimed your card this week.') + closer,
        ),
      )
    }
  }

  // The reader's own card, straight after everyone else's arrival.
  if (input.profileGaps && input.profileGaps.length > 0) {
    // profileGaps arrives already ordered by consequence (see
    // @/lib/profile/gaps), so the first one is the one worth naming.
    const g = input.profileGaps.map(escapeHtml)
    const list =
      g.length === 1 ? g[0] : `${g.slice(0, -1).join(', ')} and ${g[g.length - 1]}`
    const reason = input.profileGapReason ? ` ${escapeHtml(input.profileGapReason)}` : ''
    sections.push(
      sec(
        'Your card',
        li(`Yours is still missing ${list}.${reason}`) +
          `<p style="margin:10px 0 0 0;"><a href="${escapeHtml(
            input.profileUrl ?? input.clubhouseUrl,
          )}" style="font-size:13px;font-weight:600;color:#990000;text-decoration:none;">Finish your card &rarr;</a></p>`,
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
