'use client'

/**
 * NextEventChip — one-line "next tournament" bar for the Clubhouse home.
 * Reads the public schedule; renders nothing while loading or when the
 * season has no upcoming stop.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { TeamTravelStop } from '@/lib/store/types'

function daysUntil(iso: string): number {
  const today = new Date()
  const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((Date.parse(`${iso}T00:00:00Z`) - t) / 86400000)
}

export default function NextEventChip() {
  const [next, setNext] = useState<TeamTravelStop | null>(null)

  useEffect(() => {
    fetch('/api/team-travel')
      .then(r => (r.ok ? r.json() : { stops: [] }))
      .then((d: { stops?: TeamTravelStop[] }) => {
        const today = new Date().toISOString().slice(0, 10)
        const upcoming = (d.stops ?? [])
          .filter(s => (s.endDate ?? s.startDate) >= today)
          .sort((a, b) => a.startDate.localeCompare(b.startDate))
        setNext(upcoming[0] ?? null)
      })
      .catch(() => {})
  }, [])

  if (!next) return null
  const n = daysUntil(next.startDate)
  const when = n <= 0 ? 'live now' : n === 1 ? 'tomorrow' : `in ${n} days`

  return (
    <Link
      href="/team-room"
      className="flex items-center justify-between gap-3 bg-white border border-[rgba(180,168,150,0.45)] rounded-xl px-5 py-3 hover:border-[#0a1628]/35 transition-colors group"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05)' }}
    >
      <p className="text-[13px] text-[#3d4a5c] leading-snug min-w-0 truncate">
        <span className="font-semibold text-[#990000] uppercase tracking-[0.1em] text-[11px] mr-2">
          Next up
        </span>
        <span className="font-semibold text-[#0a1628]">{next.eventName}</span>
        <span className="text-ink-muted"> · {next.locationText} · {when}</span>
      </p>
      <span className="text-[12.5px] font-semibold text-[#0a1628] whitespace-nowrap group-hover:translate-x-0.5 transition-transform">
        The Season →
      </span>
    </Link>
  )
}
