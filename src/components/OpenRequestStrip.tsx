/**
 * Open Requests strip — compact cards for member-posted
 * "I'm in town and want to play / grab coffee" notes.
 *
 * Renders on:
 *   /the-course   → intent='round'
 *   /19th-hole    → intent in ('drinks','coffee','dinner')
 *
 * Server pages pass the filtered list. The strip is presentational; it
 * does not fetch. Hide-self is applied by the caller (so the viewer
 * doesn't see their own request mixed in — "Your Requests" in the
 * account dropdown is the surface for that).
 */

import Link from 'next/link'
import { Beer, Coffee, Flag, MapPin, Plane, Utensils, Plus } from 'lucide-react'
import type { OpenRequest, OpenRequestIntent } from '@/lib/store/types'
import RespondButton from './RespondButton'

const INTENT_ICON: Record<OpenRequestIntent, typeof Flag> = {
  round: Flag,
  drinks: Beer,
  coffee: Coffee,
  dinner: Utensils,
}

const INTENT_LABEL: Record<OpenRequestIntent, string> = {
  round: 'Round',
  drinks: 'Drinks',
  coffee: 'Coffee',
  dinner: 'Dinner',
}

function formatDateWindow(start?: string, end?: string): string | null {
  if (!start && !end) return null
  const fmt = (iso?: string) => {
    if (!iso) return null
    const [y, m, d] = iso.split('-').map(Number)
    if (!y || !m || !d) return null
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }
  const s = fmt(start)
  const e = fmt(end)
  if (s && e) return `${s} – ${e}`
  if (s) return `from ${s}`
  if (e) return `through ${e}`
  return null
}

interface Props {
  /** Pre-filtered list. Caller decides what to include. */
  requests: OpenRequest[]
  /** Eyebrow text — defaults to "Open Requests". */
  eyebrow?: string
  /** Section title — defaults vary per surface ("In town, looking for a round" etc.) */
  title?: string
  /** Subtitle — short paragraph below the title. */
  subtitle?: string
  /** Accent color for the section header and "Respond" button. */
  accent?: string
  /** Cap on how many rows to render. Default 6. */
  limit?: number
}

export default function OpenRequestStrip({
  requests,
  eyebrow = 'Open Requests',
  title = 'Members in town.',
  subtitle = 'Penn Golf members visiting somewhere — ping them if you can play host.',
  accent = '#0a1628',
  limit = 6,
}: Props) {
  if (requests.length === 0) {
    return (
      <div
        className="rounded-xl px-6 py-5 flex items-center justify-between gap-4 flex-wrap border"
        style={{
          backgroundColor: `${accent}0A`,
          borderColor: `${accent}30`,
          boxShadow: '0 1px 3px rgba(10,22,40,0.04)',
        }}
      >
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-1 inline-flex items-center gap-1.5"
            style={{ color: accent }}
          >
            <Plane className="w-3 h-3" />
            {eyebrow}
          </p>
          <p className="text-[14px] font-medium text-[#3d4a5c]">
            Nobody&rsquo;s in town with an open ask right now.
          </p>
        </div>
        <Link
          href="/requests/new"
          className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] px-4 py-2 rounded-lg border transition-colors"
          style={{ color: accent, borderColor: `${accent}40` }}
        >
          <Plus className="w-3.5 h-3.5" />
          Post a request
        </Link>
      </div>
    )
  }
  const shown = requests.slice(0, limit)
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-1"
            style={{ color: accent }}
          >
            {eyebrow}
          </p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3
              className="text-[#0a1628] text-xl font-medium"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {title}
            </h3>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ color: accent, backgroundColor: `${accent}1A` }}
            >
              {requests.length} active
            </span>
          </div>
          {subtitle && (
            <p className="text-[12.5px] text-[#8a7f70] mt-0.5 max-w-md">{subtitle}</p>
          )}
        </div>
        <Link
          href="/requests/new"
          className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] px-4 py-2 rounded-lg border transition-colors"
          style={{ color: accent, borderColor: `${accent}40` }}
        >
          <Plus className="w-3.5 h-3.5" />
          Post a request
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {shown.map(req => {
          const Icon = INTENT_ICON[req.intent]
          const location = [req.city, req.state].filter(Boolean).join(', ')
          const window = formatDateWindow(req.startDate, req.endDate)
          const firstName = req.fromName.split(/\s+/)[0]
          // Pre-compose a kickoff message — RespondButton stashes it in
          // sessionStorage so a future chat-thread enhancement can pull
          // it back as a pre-filled message.
          const kickoff = `Hey ${firstName}, saw your open ${INTENT_LABEL[req.intent].toLowerCase()} request${location ? ` in ${location}` : ''} — `
          return (
            <div
              key={req.id}
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-4 py-3.5 flex flex-col"
              style={{
                boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 4px 12px rgba(10,22,40,0.04)',
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{
                    color: accent,
                    backgroundColor: `${accent}10`,
                    border: `1px solid ${accent}30`,
                  }}
                >
                  <Icon className="w-3 h-3" />
                  {INTENT_LABEL[req.intent]}
                </span>
                {req.guestFeesOffered && (
                  <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#2d6a4f] bg-[#2d6a4f]/8 border border-[#2d6a4f]/25 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    Guest fees on me
                  </span>
                )}
              </div>
              <p
                className="text-[#0a1628] text-[15px] font-medium leading-snug"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                {req.fromPersonId ? (
                  <Link
                    href={`/player/alumni/${encodeURIComponent(req.fromPersonId)}?teamSlug=penn-mens-golf`}
                    className="hover:underline"
                  >
                    {req.fromName}
                  </Link>
                ) : (
                  req.fromName
                )}
              </p>
              {(location || window) && (
                <div className="flex items-center gap-2 text-[11.5px] text-[#8a7f70] mt-0.5 flex-wrap">
                  {location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {location}
                    </span>
                  )}
                  {window && <span>· {window}</span>}
                </div>
              )}
              <p className="text-[12.5px] text-[#3d4a5c] mt-2 leading-relaxed line-clamp-3 whitespace-pre-line">
                {req.note}
              </p>
              <div className="mt-3">
                <RespondButton
                  targetAccountId={req.fromAccountId}
                  kickoff={kickoff}
                  bgColor={accent}
                  className="w-full"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
