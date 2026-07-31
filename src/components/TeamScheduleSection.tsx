/**
 * TeamScheduleSection — the season schedule on the Team Room, driven by
 * TeamTravelStop entries (one source of truth with /team/travel, where
 * the founder manages them and alumni can offer to host).
 *
 * "Next up" = first stop that hasn't ended yet; past stops dim. The
 * St Andrews / Scotland stop gets the navy treatment + a link to the
 * alumni Scotland Tour page. Renders nothing while the list is empty.
 */

import Link from 'next/link'
import type { TeamTravelStop } from '@/lib/store/types'

const SCOTLAND_RE = /scotland|st andrews/i

function formatRange(startDate: string, endDate?: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' }
  const start = new Date(`${startDate}T00:00:00Z`)
  if (!endDate || endDate === startDate) {
    return start.toLocaleDateString('en-US', opts)
  }
  const end = new Date(`${endDate}T00:00:00Z`)
  const sameMonth =
    start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear()
  const startStr = start.toLocaleDateString('en-US', opts)
  return sameMonth
    ? `${startStr}–${end.getUTCDate()}`
    : `${startStr} – ${end.toLocaleDateString('en-US', opts)}`
}

export default function TeamScheduleSection({ stops }: { stops: TeamTravelStop[] }) {
  if (stops.length === 0) return null

  const sorted = [...stops].sort((a, b) => a.startDate.localeCompare(b.startDate))
  const todayISO = new Date().toISOString().slice(0, 10)
  const nextUpId = sorted.find(s => (s.endDate ?? s.startDate) >= todayISO)?.id ?? null

  return (
    <section>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#990000] mb-1.5">
        The Season Ahead
      </p>
      <h2 className="text-base font-semibold text-[#0a1628] mb-1">2026–27 Schedule</h2>
      <p className="text-sm text-ink-muted mb-6">
        Where the team plays this year — follow along, or come out to a stop near you.
      </p>
      <ol className="space-y-3">
        {sorted.map(s => {
          const isScotland = SCOTLAND_RE.test(`${s.eventName} ${s.locationText}`)
          const isNextUp = s.id === nextUpId
          const isPast = (s.endDate ?? s.startDate) < todayISO
          return (
            <li
              key={s.id}
              className={`rounded-xl border p-5 ${
                isScotland
                  ? 'bg-[#0a1628] border-[#c8a84b]/50 text-white'
                  : `bg-white border-[rgba(180,168,150,0.35)] ${isPast ? 'opacity-55' : ''}`
              }`}
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] mb-0.5 ${isScotland ? 'text-[#c8a84b]' : 'text-[#990000]'}`}>
                    {formatRange(s.startDate, s.endDate)}
                    {isNextUp && (
                      <span className="ml-2 inline-block bg-[#c8a84b] text-[#0a1628] text-[9.5px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full align-middle">
                        Next up
                      </span>
                    )}
                  </p>
                  <h3 className={`text-[15px] font-semibold ${isScotland ? 'text-white' : 'text-[#0a1628]'}`}>
                    {s.eventName}
                  </h3>
                  <p className={`text-[13px] ${isScotland ? 'text-white/70' : 'text-ink-muted'}`}>
                    {s.locationText}
                    {s.note ? ` · ${s.note}` : ''}
                  </p>
                </div>
                {isScotland && (
                  <Link
                    href="/scotland"
                    className="text-[12.5px] font-semibold text-[#c8a84b] hover:underline whitespace-nowrap"
                  >
                    Alumni Scotland Tour · Oct 14–17 →
                  </Link>
                )}
              </div>
            </li>
          )
        })}
      </ol>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-xs font-semibold">
        <a
          href="https://pennathletics.com/sports/mens-golf/schedule"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#990000] hover:underline"
        >
          Full schedule &amp; results on pennathletics.com →
        </a>
        <Link href="/team/travel" className="text-[#0a1628] hover:underline">
          Near a stop? Offer to host the team →
        </Link>
      </div>
    </section>
  )
}
