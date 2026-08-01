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

function daysUntilStart(startDate: string): number {
  const today = new Date().toISOString().slice(0, 10)
  return Math.round((Date.parse(startDate + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86400000)
}

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
  const nextUp = sorted.find(s => s.startDate > todayISO) ?? null
  const liveIds = new Set(
    sorted.filter(s => s.startDate <= todayISO && todayISO <= (s.endDate ?? s.startDate)).map(s => s.id),
  )
  const daysToNext = nextUp
    ? Math.round((Date.parse(nextUp.startDate + 'T00:00:00Z') - Date.parse(todayISO + 'T00:00:00Z')) / 86400000)
    : null

  return (
    <div>
      <h3 className="text-sm font-semibold text-[#0a1628] mb-4 uppercase tracking-[0.1em]">2026–27 Schedule</h3>
      <ol className="space-y-3">
        {sorted.map(s => {
          const isScotland = SCOTLAND_RE.test(`${s.eventName} ${s.locationText}`)
          const isLive = liveIds.has(s.id)
          const isNextUp = !isLive && liveIds.size === 0 && nextUp?.id === s.id
          const isPast = (s.endDate ?? s.startDate) < todayISO
          return (
            <li
              key={s.id}
              className={`rounded-xl border p-5 ${
                isScotland
                  ? 'bg-[#0a1628] border-[#c8a84b]/50 text-white'
                  : `bg-white border-[rgba(180,168,150,0.35)] ${isPast && !s.resultText ? 'opacity-55' : ''}`
              }`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3.5 min-w-0">
                  {s.imageUrl && (
                    <span className={`flex-shrink-0 w-12 h-12 rounded-lg border flex items-center justify-center overflow-hidden ${isScotland ? 'bg-white/95 border-[#c8a84b]/40' : 'bg-[#fdfcf9] border-[rgba(180,168,150,0.4)]'}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.imageUrl} alt="" className="w-9 h-9 object-contain" loading="lazy" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] mb-0.5 ${isScotland ? 'text-[#c8a84b]' : 'text-[#990000]'}`}>
                      {formatRange(s.startDate, s.endDate)}
                      {isLive && (
                        <span className="ml-2 inline-flex items-center gap-1 bg-[#990000] text-white text-[9.5px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full align-middle">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Live
                        </span>
                      )}
                      {isNextUp && (
                        <span className="ml-2 inline-block bg-[#c8a84b] text-[#0a1628] text-[9.5px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full align-middle">
                          Next up{daysToNext !== null && daysToNext > 0
                            ? ` · ${daysToNext === 1 ? 'tomorrow' : `in ${daysToNext} days`}`
                            : ''}
                        </span>
                      )}
                    </p>
                    <h3 className={`text-[15px] font-semibold ${isScotland ? 'text-white' : 'text-[#0a1628]'}`}>
                      {isScotland ? (
                        <Link href="/scotland" className="hover:underline">
                          {s.eventName}
                        </Link>
                      ) : (
                        s.eventName
                      )}
                    </h3>
                    <p className={`text-[13px] ${isScotland ? 'text-white/70' : 'text-ink-muted'}`}>
                      {s.locationText}
                      {s.note ? ` · ${s.note}` : ''}
                      {s.courseUrl && (
                        <>
                          {' · '}
                          <a
                            href={s.courseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`font-medium hover:underline ${isScotland ? 'text-[#c8a84b]' : 'text-[#0a1628]'}`}
                          >
                            {/maps\.google|google\.com\/maps/.test(s.courseUrl) ? 'Map ↗' : 'Course ↗'}
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  {isScotland && (
                    <Link
                      href="/scotland"
                      className="text-[12.5px] font-semibold text-[#c8a84b] hover:underline whitespace-nowrap"
                    >
                      Alumni Scotland Tour · Oct 14–17 →
                    </Link>
                  )}
                  {isPast && s.resultText ? (
                    <span className={`text-[12.5px] font-semibold whitespace-nowrap ${isScotland ? 'text-[#c8a84b]' : 'text-[#0a1628]'}`}>
                      Final: {s.resultText}
                    </span>
                  ) : s.linkUrl ? (
                    <a
                      href={s.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`whitespace-nowrap hover:underline font-semibold ${
                        isLive
                          ? 'text-[13.5px] bg-[#990000] text-white px-3 py-1.5 rounded-lg hover:no-underline hover:bg-[#7a0000] transition-colors'
                          : `text-[12.5px] ${isScotland ? 'text-[#c8a84b]' : 'text-[#990000]'}`
                      }`}
                    >
                      View leaderboard →
                    </a>
                  ) : !isPast ? (
                    isLive || daysUntilStart(s.startDate) <= 7 ? (
                      <a
                        href="https://scoreboard.clippd.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-[12.5px] font-semibold whitespace-nowrap hover:underline ${isScotland ? 'text-[#c8a84b]' : 'text-[#990000]'}`}
                      >
                        Find scoring on Clippd ↗
                      </a>
                    ) : (
                      <span className={`text-[11.5px] whitespace-nowrap ${isScotland ? 'text-white/45' : 'text-[#b0a898]'}`}>
                        Leaderboard coming soon
                      </span>
                    )
                  ) : null}
                </div>
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
        <a href="/api/season-calendar" className="text-[#0a1628] hover:underline">
          Add the season to your calendar →
        </a>
        <Link href="/team/travel" className="text-[#0a1628] hover:underline">
          Near a stop? Offer to host the team →
        </Link>
      </div>
    </div>
  )
}
