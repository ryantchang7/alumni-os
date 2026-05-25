'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plane, Lock } from 'lucide-react'

interface OnTheLoopMember {
  personId: string
  bookId: string | null
  name: string
  city?: string
  state?: string
  startDate?: string
  endDate?: string
  note?: string
}

interface Props {
  /** True if the viewer is signed in + captain-approved. Non-approved
   * viewers see a tease (count + value prop), not the actual travelers. */
  approved: boolean
}

function formatTripWindow(startDate?: string, endDate?: string): string | null {
  if (!startDate && !endDate) return null
  const fmt = (iso?: string) => {
    if (!iso) return null
    const [y, m, d] = iso.split('-').map(Number)
    if (!y || !m || !d) return null
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }
  const s = fmt(startDate)
  const e = fmt(endDate)
  if (s && e) return `${s} – ${e}`
  if (s) return `from ${s}`
  if (e) return `through ${e}`
  return null
}

/**
 * On the Loop — alumni passing through somewhere this week. Surfaces on
 * /player so a Penn Golf member in NYC sees who else is in town.
 *
 * Approved members see the actual list. Non-approved viewers see a
 * count-only tease — the feature exists, but cities/dates/names stay
 * private until you're approved.
 *
 * Returns null when nobody is on the loop (approved view) — the section
 * disappears silently rather than showing a sad empty state.
 */
export default function OnTheLoopStrip({ approved }: Props) {
  const [members, setMembers] = useState<OnTheLoopMember[] | null>(null)

  useEffect(() => {
    fetch('/api/clubhouse/activity')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMembers((d?.onTheLoop ?? []) as OnTheLoopMember[]))
      .catch(() => setMembers([]))
  }, [])

  if (members === null) return null
  if (members.length === 0) return null

  if (!approved) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="pb-8"
      >
        <div className="flex items-baseline gap-2 mb-3">
          <Plane className="w-4 h-4 text-[#c8a84b]" />
          <h2 className="text-base font-semibold text-[#0a1628]">On the Loop</h2>
          <p className="text-[12px] text-[#8a7f70] italic ml-1">
            — Penn Golf passing through
          </p>
        </div>
        <div
          className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl px-5 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          <div className="flex items-start gap-3">
            <span
              className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#0a1628] text-white flex-shrink-0 mt-0.5"
              aria-hidden
            >
              <Lock className="w-4 h-4" />
            </span>
            <div>
              <p className="text-[#0a1628] text-[14px] font-medium leading-snug">
                <span className="text-[#c8a84b]">{members.length}</span>{' '}
                {members.length === 1 ? 'alum is' : 'alumni are'} traveling right now.
              </p>
              <p className="text-[12.5px] text-[#8a7f70] mt-0.5">
                Members see cities, dates, and who&rsquo;s in town to say hello to.
              </p>
            </div>
          </div>
          <Link
            href="/account/setup"
            className="bg-[#0a1628] hover:bg-[#112240] text-white text-[11.5px] font-semibold uppercase tracking-[0.14em] px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
          >
            Claim to see
          </Link>
        </div>
      </motion.section>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="pb-8"
    >
      <div className="flex items-baseline gap-2 mb-3">
        <Plane className="w-4 h-4 text-[#c8a84b]" />
        <h2 className="text-base font-semibold text-[#0a1628]">On the Loop</h2>
        <p className="text-[12px] text-[#8a7f70] italic ml-1">
          — Penn Golf passing through
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {members.map((m) => {
          const place = [m.city, m.state].filter(Boolean).join(', ')
          const window = formatTripWindow(m.startDate, m.endDate)
          const href = m.bookId
            ? `/member-book/${encodeURIComponent(m.bookId)}`
            : `/player/alumni/${m.personId}`
          return (
            <Link
              key={m.personId}
              href={href}
              className="group block bg-white border border-[rgba(180,168,150,0.4)] rounded-xl px-4 py-3.5 hover:border-[#c8a84b]/60 hover:shadow-md transition-all"
              style={{
                boxShadow: '0 1px 3px rgba(10,22,40,0.06)',
              }}
            >
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <p
                  className="text-[#0a1628] text-[15px] leading-snug truncate"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  {m.name}
                </p>
                {place && (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c8a84b] whitespace-nowrap">
                    {place}
                  </span>
                )}
              </div>
              {window && (
                <p className="text-[11.5px] text-[#8a7f70]">{window}</p>
              )}
              {m.note && (
                <p className="text-[12.5px] text-[#3d4a5c] mt-1.5 italic leading-snug line-clamp-2">
                  &ldquo;{m.note}&rdquo;
                </p>
              )}
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#990000] mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Say hello →
              </p>
            </Link>
          )
        })}
      </div>
    </motion.section>
  )
}
