'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { MapPin, Clock, Users, Calendar, Lock } from 'lucide-react'

export interface GatheringData {
  id: string
  type: 'round' | 'coffee' | 'drinks' | 'dinner' | 'event'
  title: string
  description?: string
  hostName: string
  city?: string
  state?: string
  venue?: string
  dateText: string
  timeText?: string
  capacity?: number
  audience: 'players' | 'alumni' | 'both'
  vibe?: 'casual' | 'competitive' | 'career' | 'social' | 'formal'
  status: 'open' | 'full' | 'closed'
  isExample?: boolean
}

interface Attendee {
  requestId: string
  bookId: string | null
  name: string
  note?: string
  status: 'requested' | 'accepted' | 'declined' | 'closed'
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

export default function GatheringCard({ gathering, teamSlug = 'penn-mens-golf', interestedCount }: {
  gathering: GatheringData
  teamSlug?: string
  interestedCount?: number
}) {
  const { data: session, status: sessionStatus } = useSession()
  const approved = sessionStatus === 'authenticated' && !!session?.linkedPersonId

  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [attendees, setAttendees] = useState<Attendee[] | null>(null)
  const liveCount = attendees ? attendees.length : (interestedCount ?? 0) + (sent ? 1 : 0)

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

  return (
    <div
      className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
    >
      <div className="border-l-4 border-[#0a1628] px-5 pt-5 pb-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-semibold text-[#0a1628] bg-[#0a1628]/8 px-2 py-0.5 rounded-full">
                {TYPE_LABEL[gathering.type]}
              </span>
              {gathering.vibe && (
                <span className="text-[10px] font-medium text-[#8a7f70] bg-[#f5f2ee] border border-[rgba(180,168,150,0.4)] px-2 py-0.5 rounded-full">
                  {VIBE_LABEL[gathering.vibe]}
                </span>
              )}
              <GatheringStatusPill status={gathering.status} />
              {gathering.isExample && (
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a7f70] bg-[#faf7f2] border border-[rgba(180,168,150,0.6)] px-2 py-0.5 rounded-full"
                  title="Sample gathering — host a real one to replace it."
                >
                  Example
                </span>
              )}
            </div>
            <p className="font-semibold text-[#0a1628] text-sm leading-snug">{gathering.title}</p>
          </div>
        </div>

        {/* Meta */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-[#4a5568]">
            <Calendar className="w-3 h-3 text-[#8a7f70] flex-shrink-0" />
            <span>{gathering.dateText}{gathering.timeText ? ` · ${gathering.timeText}` : ''}</span>
          </div>
          {(gathering.city || gathering.venue) && (
            <div className="flex items-center gap-1.5 text-xs text-[#4a5568]">
              <MapPin className="w-3 h-3 text-[#8a7f70] flex-shrink-0" />
              <span>
                {gathering.venue
                  ? gathering.venue
                  : `${gathering.city}${gathering.state ? `, ${gathering.state}` : ''}`}
              </span>
            </div>
          )}
          {(liveCount > 0 || gathering.capacity) && (
            <div className="flex items-center gap-1.5 text-xs text-[#8a7f70]">
              <Users className="w-3 h-3 flex-shrink-0" />
              <span>
                {liveCount > 0 ? `${liveCount} on the sheet` : null}
                {liveCount > 0 && gathering.capacity ? ' · ' : null}
                {gathering.capacity ? `Up to ${gathering.capacity} members` : null}
              </span>
            </div>
          )}
          {gathering.hostName && (
            <div className="flex items-center gap-1.5 text-xs text-[#8a7f70]">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span>Hosted by {gathering.hostName}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {gathering.description && (
          <p className="text-xs text-[#4a5568] leading-relaxed mb-4">{gathering.description}</p>
        )}

        {/* Attendee list (approved members only) */}
        {approved && !gathering.isExample && attendees && attendees.length > 0 && (
          <div className="mb-4 pt-3 border-t border-[rgba(180,168,150,0.3)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a7f70] mb-1.5">
              On the sheet
            </p>
            <ul className="flex flex-wrap gap-x-3 gap-y-1">
              {attendees.map(a => (
                <li key={a.requestId} className="text-[12.5px] text-[#0a1628]">
                  {a.bookId ? (
                    <Link
                      href={`/member-book/${encodeURIComponent(a.bookId)}`}
                      className="hover:underline"
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      {a.name}
                    </Link>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-playfair)' }}>{a.name}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action */}
        {gathering.isExample && (
          <p className="text-xs text-[#8a7f70] italic">
            Sample gathering — host a real one to replace it.
          </p>
        )}
        {gathering.status === 'open' && !gathering.isExample && (
          <>
            {!approved && sessionStatus !== 'loading' && (
              <p className="inline-flex items-center gap-1.5 text-xs text-[#8a7f70]">
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
                  className="w-full text-sm text-[#0a1628] placeholder-[#b5ad9e] bg-[#f8f5f0] border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 focus:outline-none focus:border-[#0a1628] transition-colors resize-none"
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
        )}

        {gathering.status === 'full' && (
          <p className="text-xs text-[#8a7f70]">This gathering is full.</p>
        )}
      </div>
    </div>
  )
}
