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
const MUTED = '#8a7f70'
const SERIF = "Georgia, 'Times New Roman', serif"
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

function shell(inner: string, footerCtaUrl?: string): string {
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
                  Replying to this email goes nowhere. Visit the Clubhouse at
                  <a href="${footerCtaUrl}" style="color:${NAVY};text-decoration:underline;">${footerCtaUrl.replace(/^https?:\/\//, '')}</a>.
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
      brotherhood keeps track of who&rsquo;s where, who&rsquo;s open to a round,
      and who can throw a warm intro your way.
    </p>
    <p style="margin:0 0 24px 0;font-size:15px;line-height:1.55;color:#3d4a5c;">
      Three things to do this week:
    </p>
    <ul style="margin:0 0 28px 0;padding:0 0 0 20px;font-size:14px;line-height:1.7;color:#3d4a5c;">
      <li>Set your city on your locker card.</li>
      <li>Mark one availability &mdash; coffee, a round, or a warm intro.</li>
      <li>Drop a Moment, a tee time, or an ask on the Career Room floor.</li>
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
      ${escapeHtml(input.claimedName)}${input.claimedYears ? ` <span style="color:${MUTED}">· Penn Golf ${escapeHtml(input.claimedYears)}</span>` : ''}
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
      with a quick note (graduation year, team you were on) and we&rsquo;ll get you sorted.
    </p>
  `
  return { subject, html: shell(inner) }
}

// ── Weekly Digest ────────────────────────────────────────────────────────────

interface DigestMember { name: string; classLabel?: string }
interface DigestGathering { title: string; dateText: string; city?: string }
interface DigestCareerPost { kind: 'ask' | 'offer'; headline: string; sector: string; postedByName: string }
interface DigestMoment { caption: string; postedByName: string }
interface DigestNewsItem { title: string; sourceUrl: string }

export function renderWeeklyDigest(input: {
  teamName: string
  weekOf: string
  newMembers: DigestMember[]
  asks: DigestCareerPost[]
  offers: DigestCareerPost[]
  gatherings: DigestGathering[]
  moments: DigestMoment[]
  newsItems: DigestNewsItem[]
  clubhouseUrl: string
}): { subject: string; html: string } {
  const counts: string[] = []
  if (input.newMembers.length) counts.push(`${input.newMembers.length} joined`)
  if (input.gatherings.length) counts.push(`${input.gatherings.length} on the books`)
  if (input.asks.length || input.offers.length) {
    counts.push(`${input.asks.length + input.offers.length} on the floor`)
  }
  const subject = counts.length
    ? `${input.teamName} · This week: ${counts.join(' · ')}`
    : `${input.teamName} · A quiet week at the Clubhouse`

  const sec = (title: string, body: string): string => `
    <div style="margin:24px 0 0 0;">
      <p style="margin:0 0 8px 0;font-size:10px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:${MUTED};">${title}</p>
      ${body}
    </div>
  `
  const li = (s: string): string => `<p style="margin:0 0 6px 0;font-size:14px;line-height:1.55;color:#0a1628;">${s}</p>`

  const sections: string[] = []
  if (input.newMembers.length) {
    sections.push(sec('New members',
      input.newMembers.map(m => li(
        `<strong>${escapeHtml(m.name)}</strong>${m.classLabel ? ` <span style="color:${MUTED}">· ${escapeHtml(m.classLabel)}</span>` : ''}`
      )).join('')
    ))
  }
  if (input.gatherings.length) {
    sections.push(sec('On the books',
      input.gatherings.map(g => li(
        `<strong>${escapeHtml(g.title)}</strong> <span style="color:${MUTED}">· ${escapeHtml(g.dateText)}${g.city ? ' · ' + escapeHtml(g.city) : ''}</span>`
      )).join('')
    ))
  }
  if (input.asks.length) {
    sections.push(sec('Asks on the floor',
      input.asks.map(p => li(
        `<strong>${escapeHtml(p.headline)}</strong> <span style="color:${MUTED}">· ${escapeHtml(p.sector)} · ${escapeHtml(p.postedByName)}</span>`
      )).join('')
    ))
  }
  if (input.offers.length) {
    sections.push(sec('Offers on the floor',
      input.offers.map(p => li(
        `<strong>${escapeHtml(p.headline)}</strong> <span style="color:${MUTED}">· ${escapeHtml(p.sector)} · ${escapeHtml(p.postedByName)}</span>`
      )).join('')
    ))
  }
  if (input.moments.length) {
    sections.push(sec('Moments',
      input.moments.map(m => li(
        `<em style="color:#3d4a5c">${escapeHtml(m.caption.slice(0, 100))}${m.caption.length > 100 ? '…' : ''}</em> <span style="color:${MUTED}">· ${escapeHtml(m.postedByName)}</span>`
      )).join('')
    ))
  }
  if (input.newsItems.length) {
    sections.push(sec('From the box · Penn Athletics',
      input.newsItems.map(n => li(
        `<a href="${n.sourceUrl}" style="color:${NAVY};text-decoration:underline;">${escapeHtml(n.title)}</a>`
      )).join('')
    ))
  }

  const inner = `
    <h1 style="margin:6px 0 4px 0;font-family:${SERIF};font-weight:500;font-size:24px;line-height:1.2;color:${NAVY};">
      This week at the Clubhouse
    </h1>
    <p style="margin:0 0 8px 0;font-size:13px;color:${MUTED};">${escapeHtml(input.weekOf)}</p>
    ${sections.join('')}
    <div style="margin:32px 0 0 0;">${btn(input.clubhouseUrl, 'Open the Clubhouse')}</div>
  `
  return { subject, html: shell(inner, input.clubhouseUrl) }
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
      We attached an .ics file to this email &mdash; click it to add the event to Apple Calendar, Outlook,
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
