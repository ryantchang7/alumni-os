'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { MapPin, Clock, Users, Calendar, CalendarPlus, Lock } from 'lucide-react'
import { buildIcs, buildGoogleCalendarUrl } from '@/lib/calendar/ics'
import ConfirmDialog from '@/components/ConfirmDialog'

export interface GatheringData {
  id: string
  type: 'round' | 'coffee' | 'drinks' | 'dinner' | 'event'
  title: string
  description?: string
  hostName: string
  hostPersonId?: string
  city?: string
  state?: string
  venue?: string
  dateText: string
  timeText?: string
  capacity?: number
  audience: 'players' | 'alumni' | 'both'
  vibe?: 'casual' | 'competitive' | 'career' | 'social' | 'formal'
  status: 'open' | 'full' | 'closed'
  imageUrl?: string
  mapsUrl?: string
  isExample?: boolean
  /** Host display name -> profile href, for the names we could resolve.
   * Family and affiliates have no Member Book slug, so this is a full path
   * rather than an id. */
  hostLinks?: Record<string, string>
}

interface Attendee {
  requestId: string
  personId: string | null
  bookId: string | null
  name: string
  note?: string
  status: 'requested' | 'accepted' | 'declined' | 'closed'
  groupLabel?: string
  createdAt: string
}

const TYPE_LABEL: Record<GatheringData['type'], string> = {
  round: 'Round',
  coffee: 'Coffee',
  drinks: 'Drinks',
  dinner: 'Dinner',
  event: 'Event',
}

const VIBE_LABEL: Record<string, string> = {
  casual: 'Casual',
  competitive: 'Competitive',
  career: 'Career',
  social: 'Social',
  formal: 'Formal',
}

const VIDEO_EXT_RE = /\.(mp4|mov|m4v|webm)(\?|$)/i

/**
 * The location query used for the map — venue + city/state.
 *
 * Hosts write venues like "Midtown — location shared with attendees" or
 * "Penn Campus (room TBD)". Google can't geocode the qualifier, and a query it
 * can't place renders an EMPTY map, so strip everything from the dash or the
 * bracket onward and keep the part that names a place.
 */
function gatheringMapQuery(g: GatheringData): string {
  const place = (g.venue ?? '')
    .split(/\s+[—–-]\s+|\s*\(/)[0]
    .replace(/\b(tbd|tba)\b/gi, '')
    .trim()
  return [place, g.city, g.state].filter(Boolean).join(' ').trim()
}

/** Prefer the host's pasted Maps link; otherwise build a Google Maps search
 * from the venue + city/state. Returns null when there's nothing to map. */
function gatheringMapUrl(g: GatheringData): string | null {
  if (g.mapsUrl) return g.mapsUrl
  const query = gatheringMapQuery(g)
  if (!query) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

/** Embeddable map preview built from the location query. No API key needed
 * (the classic `output=embed` form). Returns null when there's no location. */
function gatheringMapEmbedUrl(g: GatheringData): string | null {
  const query = gatheringMapQuery(g)
  if (!query) return null
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`
}

export function GatheringStatusPill({ status }: { status: GatheringData['status'] }) {
  if (status === 'open') {
    return (
      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#2d6a4f]/10 text-[#2d6a4f] border border-[#2d6a4f]/25">
        Open
      </span>
    )
  }
  if (status === 'full') {
    return (
      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#c8a84b]/10 text-[#7a6020] border border-[#c8a84b]/30">
        Full
      </span>
    )
  }
  return null
}

export default function GatheringCard({ gathering, teamSlug = 'penn-mens-golf', interestedCount, detailHref }: {
  gathering: GatheringData
  teamSlug?: string
  interestedCount?: number
  /** When set, the title + a "View details" link point to the gathering's
   * own page. Omitted on the detail page itself. */
  detailHref?: string
}) {
  const { data: session, status: sessionStatus } = useSession()
  const approved = sessionStatus === 'authenticated' && !!session?.linkedPersonId
  // The host of this gathering — they shouldn't RSVP to their own event,
  // and they get a Remove control instead.
  const isHost =
    approved && !!gathering.hostPersonId && session?.linkedPersonId === gathering.hostPersonId

  // Responding to RSVPs. The API for this existed with proper ownership
  // checks but had no UI at all, so a host could see who asked in and had no
  // way to answer them.
  const [rsvpBusy, setRsvpBusy] = useState<string | null>(null)
  async function respondToRsvp(requestId: string, status: 'accepted' | 'declined') {
    setRsvpBusy(requestId)
    try {
      const res = await fetch('/api/gatherings/request/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status }),
      })
      if (res.ok) {
        setAttendees(prev =>
          prev
            ? status === 'declined'
              ? prev.filter(a => a.requestId !== requestId)
              : prev.map(a => (a.requestId === requestId ? { ...a, status } : a))
            : prev,
        )
      }
    } finally {
      setRsvpBusy(null)
    }
  }

  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [removed, setRemoved] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false)

  // Host tools: fix the details, and send one note to everyone on the sheet.
  const [editOpen, setEditOpen] = useState(false)
  const [edit, setEdit] = useState({
    title: gathering.title,
    dateText: gathering.dateText,
    timeText: gathering.timeText ?? '',
    venue: gathering.venue ?? '',
    city: gathering.city ?? '',
    state: gathering.state ?? '',
    description: gathering.description ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  // Managing the sheet itself: who is playing and in which group / tee time.
  const [sheetOpen, setSheetOpen] = useState(false)
  const [bookOptions, setBookOptions] = useState<{ bookId: string; name: string }[] | null>(null)
  const [pick, setPick] = useState('')
  const [groupLabel, setGroupLabel] = useState('')
  const [adding, setAdding] = useState(false)

  // Load the roster only when the host actually opens the panel.
  useEffect(() => {
    if (!sheetOpen || bookOptions) return
    fetch('/api/member-book/options')
      .then(r => (r.ok ? r.json() : null))
      .then(d => setBookOptions(d?.members ?? []))
      .catch(() => setBookOptions([]))
  }, [sheetOpen, bookOptions])

  async function addToSheet(e: React.FormEvent) {
    e.preventDefault()
    const typed = pick.trim()
    if (!typed) return
    setAdding(true)
    setError(null)
    try {
      // Prefer an exact Member Book match so the name links to a card;
      // otherwise send it as a plain name (guests, non-members).
      const match = bookOptions?.find(o => o.name.toLowerCase() === typed.toLowerCase())
      const res = await fetch(`/api/gatherings/${gathering.id}/attendees/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          people: [{
            name: match?.name ?? typed,
            ...(match ? { bookId: match.bookId } : {}),
            ...(groupLabel.trim() ? { groupLabel: groupLabel.trim() } : {}),
          }],
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error ?? 'Could not add')
      const fresh = await fetch(`/api/gatherings/${gathering.id}/attendees`)
        .then(r => (r.ok ? r.json() : null)).catch(() => null)
      if (fresh?.attendees) setAttendees(fresh.attendees as Attendee[])
      setPick('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add')
    } finally {
      setAdding(false)
    }
  }

  const [msgOpen, setMsgOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [sentNote, setSentNote] = useState<string | null>(null)

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/gatherings?id=${encodeURIComponent(gathering.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edit),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error ?? 'Could not save')
      setSavedAt('Saved. Refresh to see it everywhere.')
      setEditOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!msg.trim()) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/gatherings/${gathering.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg.trim() }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error ?? 'Could not send')
      setSentNote(`Sent to ${j.emailed ?? 0} by email, ${j.notified ?? 0} in the Clubhouse.`)
      setMsg('')
      setMsgOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send')
    } finally {
      setSending(false)
    }
  }

  async function handleRemove() {
    setRemoving(true)
    try {
      const res = await fetch(`/api/gatherings?id=${encodeURIComponent(gathering.id)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setRemoved(true)
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Could not remove. Try again.')
        setRemoving(false)
      }
    } catch {
      setError('Could not connect. Try again.')
      setRemoving(false)
    }
  }

  // "Add to calendar" — same Google Cal + .ics the RSVP email uses, but
  // right on the card so it works instantly without depending on email.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://penngolfclubhouse.com'
  const clubhouseUrl = `${baseUrl}${gathering.type === 'round' ? '/the-course' : '/19th-hole'}`
  const googleCalUrl = buildGoogleCalendarUrl(gathering, clubhouseUrl)

  function downloadIcs() {
    const ics = buildIcs(gathering, clubhouseUrl)
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(gathering.title || 'gathering').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.ics`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const [attendees, setAttendees] = useState<Attendee[] | null>(null)
  const liveCount = attendees ? attendees.length : (interestedCount ?? 0) + (sent ? 1 : 0)

  // Bunch the sheet by the host's pairings. Anyone without a group falls into
  // a single unlabelled block at the end, so a normal RSVP list looks exactly
  // as it did before groups existed.
  const groupedAttendees: Array<[string, Attendee[]]> = (() => {
    if (!attendees) return []
    const byLabel = new Map<string, Attendee[]>()
    for (const a of attendees) {
      const key = a.groupLabel?.trim() || ''
      const list = byLabel.get(key)
      if (list) list.push(a)
      else byLabel.set(key, [a])
    }
    return [...byLabel.entries()].sort((x, y) => {
      if (!x[0]) return 1
      if (!y[0]) return -1
      return x[0].localeCompare(y[0], undefined, { numeric: true })
    })
  })()

  // Approved members can see the attendee list. Re-fetch after a successful
  // RSVP so the user sees themselves on the sheet.
  useEffect(() => {
    if (!approved || gathering.isExample) return
    let alive = true
    fetch(`/api/gatherings/${gathering.id}/attendees`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (alive && d?.attendees) setAttendees(d.attendees as Attendee[])
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [approved, gathering.id, gathering.isExample, sent])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/gatherings/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamSlug,
          gatheringId: gathering.id,
          note: note.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Something went wrong. Try again.')
        setSubmitting(false)
        return
      }
      setSent(true)
    } catch {
      setError('Could not connect. Try again.')
      setSubmitting(false)
    }
  }

  if (removed) {
    return (
      <div className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-5 py-4">
        <p className="text-xs text-ink-muted">Removed. It&rsquo;s off the board.</p>
      </div>
    )
  }

  return (
    <div
      className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
    >
      {/* Host-supplied photo or short clip of the venue/vibe. */}
      {gathering.imageUrl && (
        VIDEO_EXT_RE.test(gathering.imageUrl) ? (
          <video
            src={gathering.imageUrl}
            controls
            playsInline
            preload="metadata"
            className="w-full aspect-[3/2] object-cover bg-black"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={gathering.imageUrl}
            alt={gathering.title}
            className="w-full aspect-[3/2] object-cover"
          />
        )
      )}

      <div className="border-l-4 border-[#0a1628] px-5 pt-5 pb-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-semibold text-[#0a1628] bg-[#0a1628]/8 px-2 py-0.5 rounded-full">
                {TYPE_LABEL[gathering.type]}
              </span>
              {gathering.vibe && (
                <span className="text-[10px] font-medium text-ink-muted bg-[#f5f2ee] border border-[rgba(180,168,150,0.4)] px-2 py-0.5 rounded-full">
                  {VIBE_LABEL[gathering.vibe]}
                </span>
              )}
              <GatheringStatusPill status={gathering.status} />
              {gathering.isExample && (
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted bg-[#fdfcf9] border border-[rgba(180,168,150,0.6)] px-2 py-0.5 rounded-full"
                  title="Sample gathering, host a real one to replace it."
                >
                  Example
                </span>
              )}
            </div>
            {detailHref ? (
              <Link
                href={detailHref}
                className="font-semibold text-[#0a1628] text-sm leading-snug hover:underline"
              >
                {gathering.title}
              </Link>
            ) : (
              <p className="font-semibold text-[#0a1628] text-sm leading-snug">{gathering.title}</p>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-[#3a4657]">
            <Calendar className="w-3 h-3 text-ink-muted flex-shrink-0" />
            <span>{gathering.dateText}{gathering.timeText ? ` · ${gathering.timeText}` : ''}</span>
          </div>
          {(gathering.city || gathering.venue) && (
            (() => {
              const mapUrl = gatheringMapUrl(gathering)
              const locationText = gathering.venue
                ? gathering.venue
                : `${gathering.city}${gathering.state ? `, ${gathering.state}` : ''}`
              return mapUrl ? (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[#3a4657] hover:text-[#0a1628] group/map"
                >
                  <MapPin className="w-3 h-3 text-ink-muted flex-shrink-0" />
                  <span className="group-hover/map:underline">{locationText}</span>
                  <span className="text-[#990000] text-[11px] font-medium">· Map</span>
                </a>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-[#3a4657]">
                  <MapPin className="w-3 h-3 text-ink-muted flex-shrink-0" />
                  <span>{locationText}</span>
                </div>
              )
            })()
          )}
          {(liveCount > 0 || gathering.capacity) && (
            <div className="flex items-center gap-1.5 text-xs text-ink-muted">
              <Users className="w-3 h-3 flex-shrink-0" />
              <span>
                {liveCount > 0 ? `${liveCount} on the sheet` : null}
                {liveCount > 0 && gathering.capacity ? ' · ' : null}
                {gathering.capacity ? `Up to ${gathering.capacity} members` : null}
              </span>
            </div>
          )}
          {gathering.hostName && (
            <div className="flex items-center gap-1.5 text-xs text-ink-muted">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span>
                Hosted by{' '}
                {gathering.hostName.split(/\s*&\s*/).map((who, i, all) => {
                  const href = gathering.hostLinks?.[who.trim()]
                  return (
                    <span key={who + i}>
                      {href ? (
                        <Link
                          href={href}
                          className="text-[#0a1628] hover:underline font-medium"
                        >
                          {who.trim()}
                        </Link>
                      ) : (
                        who.trim()
                      )}
                      {i < all.length - 1 ? ' & ' : ''}
                    </span>
                  )
                })}
              </span>
            </div>
          )}
        </div>

        {/* Map preview, a real map of the spot. Lazy-loaded so a list of
            cards doesn't fire every iframe at once.

            The keyless Google embed sometimes paints nothing (a query it can't
            place, or several embeds on one page), and a bare iframe failing
            leaves an empty bordered box that reads as broken. So the location
            sits UNDERNEATH as a styled fallback; the iframe covers it when it
            loads, and shows through when it doesn't. */}
        {gatheringMapEmbedUrl(gathering) && (
          <a
            href={gatheringMapUrl(gathering) ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block rounded-lg overflow-hidden border border-[rgba(180,168,150,0.4)] mb-3 h-32 bg-[#f3efe7] group/mapimg"
            title="Open in Google Maps"
          >
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-3 text-center pointer-events-none">
              <MapPin className="w-4 h-4 text-[#990000]" />
              <span className="text-[12.5px] font-medium text-[#0a1628] leading-snug">
                {gathering.venue ?? [gathering.city, gathering.state].filter(Boolean).join(', ')}
              </span>
              <span className="text-[11px] text-ink-muted">Open in Google Maps ↗</span>
            </span>
            <iframe
              src={gatheringMapEmbedUrl(gathering)!}
              title={`Map of ${gathering.venue ?? gathering.city ?? 'the gathering'}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="relative w-full h-32 pointer-events-none"
            />
          </a>
        )}

        {/* Description */}
        {gathering.description && (
          <p className="text-xs text-[#3a4657] leading-relaxed mb-4">{gathering.description}</p>
        )}

        {/* Add to calendar, instant Google Cal link + .ics download, right
            on the card so it works without depending on the RSVP email. */}
        {!gathering.isExample && (
          <div className="flex items-center gap-2 flex-wrap mb-4 text-xs">
            <span className="inline-flex items-center gap-1.5 text-ink-muted">
              <CalendarPlus className="w-3.5 h-3.5" />
              Add to calendar:
            </span>
            <a
              href={googleCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#990000] hover:underline"
            >
              Google
            </a>
            <span className="text-[#cfc6b8]" aria-hidden>·</span>
            <button
              type="button"
              onClick={downloadIcs}
              className="font-medium text-[#990000] hover:underline"
            >
              Apple / Outlook
            </button>
          </div>
        )}

        {/* Click into the full gathering page. */}
        {detailHref && (
          <Link
            href={detailHref}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0a1628] hover:underline mb-4"
          >
            View details &rarr;
          </Link>
        )}

        {/* Attendee list (approved members only) */}
        {approved && !gathering.isExample && attendees && attendees.length > 0 && (
          <div className="mb-4 pt-3 border-t border-[rgba(180,168,150,0.3)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted mb-1.5">
              On the sheet
            </p>
            {groupedAttendees.map(([label, rows]) => (
            <div key={label || '_'} className={label ? 'mb-2.5 last:mb-0' : ''}>
            {label && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#c8a84b] mb-1">
                {label}
              </p>
            )}
            <ul className={isHost ? 'space-y-1.5' : 'flex flex-wrap gap-x-3 gap-y-1'}>
              {rows.map(a => (
                <li
                  key={a.requestId}
                  className={`text-[12.5px] text-[#0a1628] ${isHost ? 'flex items-center justify-between gap-3' : ''}`}
                >
                  <span className="min-w-0">
                    {a.bookId || a.personId ? (
                      <Link
                        href={
                          a.bookId
                            ? `/member-book/${encodeURIComponent(a.bookId)}`
                            : `/player/alumni/${encodeURIComponent(a.personId!)}`
                        }
                        className="hover:underline font-heading"
                      >
                        {a.name}
                      </Link>
                    ) : (
                      <span className="font-heading">{a.name}</span>
                    )}
                    {a.status === 'accepted' && (
                      <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#2d6a4f]">
                        In
                      </span>
                    )}
                  </span>
                  {isHost && a.status === 'accepted' && (
                    <button
                      type="button"
                      disabled={rsvpBusy === a.requestId}
                      onClick={() => respondToRsvp(a.requestId, 'declined')}
                      className="flex-shrink-0 text-[11px] text-ink-muted hover:text-[#990000] disabled:opacity-40"
                      title="Take them off the sheet"
                    >
                      Remove
                    </button>
                  )}
                  {isHost && a.status !== 'accepted' && (
                    <span className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        disabled={rsvpBusy === a.requestId}
                        onClick={() => respondToRsvp(a.requestId, 'accepted')}
                        className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2d6a4f] hover:underline disabled:opacity-40"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        disabled={rsvpBusy === a.requestId}
                        onClick={() => respondToRsvp(a.requestId, 'declined')}
                        className="text-[11px] text-ink-muted hover:text-[#990000] disabled:opacity-40"
                      >
                        Pass
                      </button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
            </div>
            ))}
          </div>
        )}

        {/* Action */}
        {gathering.isExample ? (
          <p className="text-xs text-ink-muted italic">
            Sample gathering, host a real one to replace it.
          </p>
        ) : isHost ? (
          // Host view — no RSVP to your own event; a Remove control instead.
          <div className="mt-1 space-y-2">
            <p className="text-xs text-[#2d6a4f] font-medium">
              You&rsquo;re hosting this. Members can pencil themselves in.
            </p>
            {error && <p className="text-xs text-[#990000]">{error}</p>}
            {savedAt && <p className="text-xs text-[#2d6a4f]">{savedAt}</p>}
            {sentNote && <p className="text-xs text-[#2d6a4f]">{sentNote}</p>}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => { setEditOpen(v => !v); setMsgOpen(false) }}
                className="text-xs font-semibold text-[#0a1628] border border-[rgba(180,168,150,0.6)] hover:border-[#0a1628] px-3.5 py-2 rounded-lg transition-colors"
              >
                {editOpen ? 'Cancel edit' : 'Edit details'}
              </button>
              <button
                type="button"
                onClick={() => { setSheetOpen(v => !v); setEditOpen(false); setMsgOpen(false) }}
                className="text-xs font-semibold text-[#0a1628] border border-[rgba(180,168,150,0.6)] hover:border-[#0a1628] px-3.5 py-2 rounded-lg transition-colors"
              >
                {sheetOpen ? 'Done adding' : 'Add to the sheet'}
              </button>
              <button
                type="button"
                onClick={() => { setMsgOpen(v => !v); setEditOpen(false); setSheetOpen(false) }}
                className="text-xs font-semibold text-[#0a1628] border border-[rgba(180,168,150,0.6)] hover:border-[#0a1628] px-3.5 py-2 rounded-lg transition-colors"
              >
                {msgOpen ? 'Cancel note' : 'Message the sheet'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmRemoveOpen(true)}
                disabled={removing}
                className="text-xs font-semibold text-[#990000] border border-[#990000]/30 hover:bg-[#990000] hover:text-white px-3.5 py-2 rounded-lg transition-colors disabled:opacity-40"
              >
                {removing ? 'Removing…' : 'Cancel this round'}
              </button>
            </div>

            {sheetOpen && (
              <form onSubmit={addToSheet} className="mt-1 space-y-2 rounded-lg border border-[rgba(180,168,150,0.5)] p-3 bg-[#fdfcf9]">
                <p className="text-[11.5px] text-ink-muted">
                  Start typing a name from the Member Book, or write anyone in. The group
                  is free text, so use it for pairings or tee times.
                </p>
                <label className="block">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted mb-0.5">Who</span>
                  <input
                    list={`book-${gathering.id}`}
                    value={pick}
                    onChange={e => setPick(e.target.value)}
                    placeholder={bookOptions ? 'Start typing a name' : 'Loading the Member Book'}
                    className="w-full border border-[rgba(180,168,150,0.5)] rounded-md px-2.5 py-1.5 text-[13px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                  />
                  <datalist id={`book-${gathering.id}`}>
                    {(bookOptions ?? []).map(o => <option key={o.bookId} value={o.name} />)}
                  </datalist>
                </label>
                <label className="block">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted mb-0.5">Group or tee time</span>
                  <input
                    value={groupLabel}
                    onChange={e => setGroupLabel(e.target.value)}
                    placeholder="Group 1, or 8:10 AM"
                    className="w-full border border-[rgba(180,168,150,0.5)] rounded-md px-2.5 py-1.5 text-[13px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                  />
                </label>
                <button
                  type="submit"
                  disabled={adding || !pick.trim()}
                  className="text-[11.5px] font-semibold uppercase tracking-[0.12em] bg-[#0a1628] hover:bg-[#112240] text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
                >
                  {adding ? 'Adding…' : 'Add to the sheet'}
                </button>
              </form>
            )}

            {editOpen && (
              <form onSubmit={saveEdit} className="mt-1 space-y-2 rounded-lg border border-[rgba(180,168,150,0.5)] p-3 bg-[#fdfcf9]">
                {([
                  ['title', 'What is it'],
                  ['dateText', 'Date'],
                  ['timeText', 'Time'],
                  ['venue', 'Course or venue'],
                  ['city', 'City'],
                  ['state', 'State'],
                ] as const).map(([k, label]) => (
                  <label key={k} className="block">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted mb-0.5">{label}</span>
                    <input
                      value={edit[k]}
                      onChange={e => setEdit(p => ({ ...p, [k]: e.target.value }))}
                      className="w-full border border-[rgba(180,168,150,0.5)] rounded-md px-2.5 py-1.5 text-[13px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                    />
                  </label>
                ))}
                <label className="block">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted mb-0.5">Details</span>
                  <textarea
                    value={edit.description}
                    onChange={e => setEdit(p => ({ ...p, description: e.target.value }))}
                    rows={3}
                    className="w-full border border-[rgba(180,168,150,0.5)] rounded-md px-2.5 py-1.5 text-[13px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                  />
                </label>
                <button
                  type="submit"
                  disabled={saving}
                  className="text-[11.5px] font-semibold uppercase tracking-[0.12em] bg-[#0a1628] hover:bg-[#112240] text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </form>
            )}

            {msgOpen && (
              <form onSubmit={sendMessage} className="mt-1 space-y-2 rounded-lg border border-[rgba(180,168,150,0.5)] p-3 bg-[#fdfcf9]">
                <p className="text-[11.5px] text-ink-muted">
                  Goes to everyone on the sheet, in the Clubhouse and by email.
                </p>
                <textarea
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  rows={3}
                  maxLength={1200}
                  placeholder="Off the first tee at 8:10. Park in the lower lot and meet by the range."
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-md px-2.5 py-1.5 text-[13px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                />
                <button
                  type="submit"
                  disabled={sending || !msg.trim()}
                  className="text-[11.5px] font-semibold uppercase tracking-[0.12em] bg-[#0a1628] hover:bg-[#112240] text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
                >
                  {sending ? 'Sending…' : 'Send to the sheet'}
                </button>
              </form>
            )}
          </div>
        ) : gathering.status === 'open' ? (
          <>
            {!approved && sessionStatus !== 'loading' && (
              <p className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
                <Lock className="w-3 h-3" />
                <Link
                  href={sessionStatus === 'authenticated' ? '/account/setup' : '/login?next=/19th-hole'}
                  className="text-[#990000] hover:underline font-semibold"
                >
                  Claim your card to RSVP &rarr;
                </Link>
              </p>
            )}
            {approved && !sent && (
              <form onSubmit={handleSubmit} className="mt-2 space-y-2">
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Anything to add? (optional)"
                  maxLength={500}
                  rows={2}
                  className="w-full text-sm text-[#0a1628] placeholder-[#b5ad9e] bg-[#fbf9f6] border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 focus:outline-none focus:border-[#0a1628] transition-colors resize-none"
                />
                {error && <p className="text-xs text-[#990000]">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="text-xs font-semibold bg-[#0a1628] text-white px-4 py-2 rounded-lg disabled:opacity-40 hover:bg-[#0a1628]/85 transition-colors"
                >
                  {submitting ? 'Sending…' : 'Pencil me in'}
                </button>
              </form>
            )}
            {sent && (
              <p className="text-xs text-[#2d6a4f] font-medium mt-1">
                You&rsquo;re on the sheet. Confirmation + calendar invite sent to your inbox.
              </p>
            )}
          </>
        ) : gathering.status === 'full' ? (
          <p className="text-xs text-ink-muted">This gathering is full.</p>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmRemoveOpen}
        title="Remove this gathering?"
        message="It comes off the board for everyone."
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          setConfirmRemoveOpen(false)
          handleRemove()
        }}
        onCancel={() => setConfirmRemoveOpen(false)}
      />
    </div>
  )
}
