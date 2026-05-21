'use client'

import { useState } from 'react'
import { MapPin, Clock, Users, Calendar } from 'lucide-react'

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
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const liveCount = (interestedCount ?? 0) + (sent ? 1 : 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/gatherings/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamSlug,
          gatheringId: gathering.id,
          fromName: trimmed,
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
                {liveCount > 0 ? `${liveCount} interested` : null}
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

        {/* Action */}
        {gathering.status === 'open' && (
          <>
            {!open && !sent && (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="text-xs font-semibold text-[#990000] hover:underline"
              >
                Express interest &rarr;
              </button>
            )}

            {open && !sent && (
              <form onSubmit={handleSubmit} className="mt-2 space-y-2">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  maxLength={100}
                  required
                  className="w-full text-sm text-[#0a1628] placeholder-[#b5ad9e] bg-[#f8f5f0] border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 focus:outline-none focus:border-[#0a1628] transition-colors"
                />
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Anything to add? (optional)"
                  maxLength={500}
                  rows={2}
                  className="w-full text-sm text-[#0a1628] placeholder-[#b5ad9e] bg-[#f8f5f0] border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 focus:outline-none focus:border-[#0a1628] transition-colors resize-none"
                />
                {error && <p className="text-xs text-[#990000]">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting || !name.trim()}
                    className="text-xs font-semibold bg-[#0a1628] text-white px-4 py-2 rounded-lg disabled:opacity-40 hover:bg-[#0a1628]/85 transition-colors"
                  >
                    {submitting ? 'Sending…' : 'Send'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOpen(false); setError(null) }}
                    className="text-xs text-[#8a7f70] hover:text-[#0a1628] px-3 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {sent && (
              <p className="text-xs text-[#2d6a4f] font-medium mt-1">
                Interest noted. The host will be in touch.
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
