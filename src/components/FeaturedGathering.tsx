'use client'

/**
 * The next real thing, at the top of the Clubhouse, with its flyer.
 *
 * The NYC happy hour on 3 December was already on this page. It was tenth
 * down, in a third-width card, as the word "19th Hole" and a date — no
 * flyer, no venue, no time, and nothing to press. The same gathering led
 * the Sunday email with its flyer at full width, so the email was doing a
 * better job of advertising it than the site it links to.
 *
 * There is normally one thing actually coming up. That is worth the top of
 * the page and the whole width.
 *
 * On RSVP, and why there is a button on an event whose own description says
 * "no RSVP needed": the host does not need a headcount, but a member
 * deciding whether to travel in on a Thursday evening very much wants to
 * know whether anyone else is going. Saying you are coming is for the other
 * members, not the host, and the copy says so rather than pretending a
 * headcount is required.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, MapPin, Clock, Check } from 'lucide-react'

interface Gathering {
  id: string
  type: string
  title: string
  description?: string
  hostName?: string
  dateText: string
  dateISO?: string
  timeText?: string
  city?: string
  state?: string
  venue?: string
  imageUrl?: string
  mapsUrl?: string
  status: string
  isExample?: boolean
  isPast?: boolean
}

interface Attendee {
  requestId: string
  accountId: string | null
  name: string
  status: string
}

const roomLabel = (type: string): string =>
  type === 'round'
    ? 'The Course'
    : type === 'coffee' || type === 'drinks' || type === 'dinner'
      ? 'The 19th Hole'
      : 'Event'

/** "in 17 days", which is the number that decides whether to act now. */
function countdown(dateISO?: string): string {
  if (!dateISO) return ''
  const target = new Date(`${dateISO}T12:00:00`)
  if (Number.isNaN(target.getTime())) return ''
  const days = Math.round((target.getTime() - Date.now()) / 86_400_000)
  if (days < 0) return ''
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days < 14) return `in ${days} days`
  if (days < 60) return `in ${Math.round(days / 7)} weeks`
  return ''
}

/** First names only. "Carter, Ivana and 4 more" reads as a room. */
function attendeeLine(names: string[], mine: boolean): string {
  const firsts = names.map(n => n.trim().split(/\s+/)[0]).filter(Boolean)
  const total = firsts.length
  if (total === 0) return mine ? 'You are the first to say so.' : ''
  const shown = firsts.slice(0, 3)
  const rest = total - shown.length
  const list =
    shown.length === 1
      ? shown[0]
      : `${shown.slice(0, -1).join(', ')} and ${shown[shown.length - 1]}`
  const tail = rest > 0 ? `${list} and ${rest} more` : list
  return total === 1 ? `${tail} is going.` : `${tail} are going.`
}

export default function FeaturedGathering({
  teamSlug,
  approved,
}: {
  teamSlug: string
  approved: boolean
}) {
  const [gathering, setGathering] = useState<Gathering | null>(null)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [mine, setMine] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let live = true
    // ?when=upcoming matters. Without it the route returns every gathering
    // ever held, oldest first, and this would advertise a trip from August.
    fetch(`/api/gatherings?teamSlug=${teamSlug}&when=upcoming`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : { gatherings: [] }))
      .then(d => {
        if (!live) return
        // A seeded sample is not happening, so it never leads the page.
        const real: Gathering[] = (d.gatherings ?? []).filter(
          (g: Gathering) => !g.isExample && !g.isPast,
        )
        setGathering(real[0] ?? null)
        setLoading(false)
      })
      .catch(() => live && setLoading(false))
    return () => {
      live = false
    }
  }, [teamSlug])

  useEffect(() => {
    if (!gathering || !approved) return
    let live = true
    fetch(`/api/gatherings/${gathering.id}/attendees`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : { attendees: [] }))
      .then(d => {
        if (!live) return
        setAttendees(d.attendees ?? [])
        // The route answers this, rather than the client matching its own
        // name against the list and getting it wrong for anyone a host
        // added by hand under a different spelling.
        setMine(d.mine === true)
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [gathering, approved])

  async function rsvp() {
    if (!gathering) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/gatherings/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamSlug, gatheringId: gathering.id }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error ?? `Could not do that (${res.status})`)
      setMine(true)
      // Optimistic, so the count moves under their thumb rather than after
      // a reload they will not do.
      setAttendees(a => [...a, { requestId: 'new', accountId: null, name: 'You', status: 'requested' }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not do that')
    } finally {
      setBusy(false)
    }
  }

  if (loading || !gathering) return null

  const when = countdown(gathering.dateISO)
  const place = [gathering.venue, [gathering.city, gathering.state].filter(Boolean).join(', ')]
    .filter(Boolean)
    .join(' · ')

  return (
    <div
      className="mb-8 bg-white border border-[rgba(180,168,150,0.45)] rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 2px 6px rgba(10,22,40,0.06), 0 16px 40px rgba(10,22,40,0.07)' }}
      data-testid="featured-gathering"
    >
      <div className="px-6 sm:px-7 pt-5 pb-1 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#990000]">
          Next in the Clubhouse
        </p>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0a1628] bg-[#0a1628]/8 px-2.5 py-1 rounded-full">
          {roomLabel(gathering.type)}
        </span>
      </div>

      <div className="px-6 sm:px-7 pt-3 pb-6">
        <div className="sm:flex sm:gap-7 sm:items-start">
          {gathering.imageUrl && (
            <Link
              href={`/gatherings/${gathering.id}`}
              className="block sm:w-[44%] shrink-0 mb-5 sm:mb-0"
            >
              {/* height:auto and no crop. The host made this flyer and a
                  fixed-height container cuts the date off the bottom. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gathering.imageUrl}
                alt={gathering.title}
                className="w-full h-auto rounded-xl border border-[rgba(180,168,150,0.5)]"
              />
            </Link>
          )}

          <div className="min-w-0 flex-1">
            <h2 className="text-[#0a1628] text-xl sm:text-2xl font-medium leading-tight font-heading">
              <Link href={`/gatherings/${gathering.id}`} className="hover:underline">
                {gathering.title}
              </Link>
            </h2>

            <dl className="mt-3.5 space-y-1.5 text-[13.5px] text-[#3d4a5c]">
              <div className="flex items-start gap-2">
                <CalendarDays className="w-4 h-4 mt-[2px] text-ink-muted shrink-0" aria-hidden />
                <dd>
                  {gathering.dateText}
                  {when && <span className="text-[#990000] font-medium"> &middot; {when}</span>}
                </dd>
              </div>
              {gathering.timeText && (
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 mt-[2px] text-ink-muted shrink-0" aria-hidden />
                  <dd>{gathering.timeText}</dd>
                </div>
              )}
              {place && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-[2px] text-ink-muted shrink-0" aria-hidden />
                  <dd>
                    {gathering.mapsUrl ? (
                      <a
                        href={gathering.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {place}
                      </a>
                    ) : (
                      place
                    )}
                  </dd>
                </div>
              )}
            </dl>

            {gathering.hostName && (
              <p className="text-[12.5px] text-ink-muted mt-3">
                Hosted by {gathering.hostName}
              </p>
            )}

            {approved ? (
              <div className="mt-5">
                {mine ? (
                  <p
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold uppercase tracking-[0.12em] text-[#2d6a4f]"
                    data-testid="featured-gathering-going"
                  >
                    <Check className="w-4 h-4" aria-hidden />
                    You&rsquo;re going
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={rsvp}
                    disabled={busy}
                    className="bg-[#0a1628] hover:bg-[#112240] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                    data-testid="featured-gathering-rsvp"
                  >
                    {busy ? 'Saving…' : "I'm coming"}
                  </button>
                )}
                {attendeeLine(attendees.map(a => a.name), mine) && (
                  <p className="text-[12.5px] text-[#3d4a5c] mt-2.5">
                    {attendeeLine(attendees.map(a => a.name), mine)}
                  </p>
                )}
                {/* The host asked for no RSVP. Saying you are coming is for
                    the other members deciding whether to turn up. */}
                <p className="text-[12px] text-ink-muted mt-1.5 leading-relaxed">
                  No RSVP needed to walk in. Saying so just lets everyone else see
                  who&rsquo;ll be there.
                </p>
                {error && <p className="text-[12.5px] text-[#990000] mt-2">{error}</p>}
              </div>
            ) : (
              <div className="mt-5">
                <Link
                  href="/account/setup"
                  className="inline-block bg-[#0a1628] hover:bg-[#112240] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
                >
                  Claim your card to join
                </Link>
                <p className="text-[12px] text-ink-muted mt-2 leading-relaxed">
                  Members see who&rsquo;s going and can say they&rsquo;re coming.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
