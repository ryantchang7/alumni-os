import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { SeasonUpdate } from '@/lib/store/types'

const KIND_LABELS: Record<SeasonUpdate['kind'], string> = {
  qualifying: 'Qualifying',
  tournament: 'Tournament',
  stat: 'Stat',
  note: 'Note',
}

/**
 * A short read-only view of the newest team updates, shown beside the Penn
 * Athletics feed so "From the box" carries both what Penn published and what
 * the team said itself. The full timeline, with filters, stays further down
 * the Team Room.
 */
export default function CompactSeasonUpdates({
  updates,
  limit = 3,
  href = '#season-updates',
}: {
  updates: SeasonUpdate[]
  limit?: number
  href?: string
}) {
  if (updates.length === 0) return null
  const recent = updates.slice(0, limit)

  return (
    <div className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl p-4 h-full flex flex-col"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
    >
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#990000]">
          From the team
        </p>
        <Link
          href={href}
          className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#0a1628] hover:text-[#990000] transition-colors whitespace-nowrap"
        >
          All updates
        </Link>
      </div>
      <ul className="space-y-2.5 flex-1">
        {recent.map(u => (
          <li key={u.id} className="flex items-start gap-2.5">
            <span className="flex-shrink-0 mt-[3px] text-[9px] font-bold uppercase tracking-[0.1em] text-[#0a1628] bg-[#f5f0e8] border border-[rgba(180,168,150,0.5)] rounded px-1.5 py-0.5">
              {KIND_LABELS[u.kind]}
            </span>
            <div className="min-w-0">
              <p className="text-[13px] text-[#0a1628] font-medium leading-snug line-clamp-2">
                {u.title}
              </p>
              <p className="text-[10.5px] text-ink-muted mt-0.5 flex items-center gap-1">
                {u.dateText}
                {u.linkUrl && <ArrowUpRight className="w-2.5 h-2.5" />}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
