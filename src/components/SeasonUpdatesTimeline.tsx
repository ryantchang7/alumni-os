'use client'

/**
 * SeasonUpdatesTimeline — the "Latest updates" feed on the Season hub.
 * Client component so the kind pills (All / Qualifying / Tournaments /
 * Stats / Notes) can filter without a round-trip. Pills only render for
 * kinds that actually have posts, and only once there are 2+ updates.
 */

import { useState } from 'react'
import { ArrowUpRight, Link as LinkIcon } from 'lucide-react'
import type { SeasonUpdate } from '@/lib/store/types'
import LinkPreviewImage from '@/components/LinkPreviewImage'

const KIND_LABELS: Record<SeasonUpdate['kind'], string> = {
  qualifying: 'Qualifying',
  tournament: 'Tournament',
  stat: 'Stat',
  note: 'Note',
}
const KIND_FILTERS: Array<{ kind: SeasonUpdate['kind']; label: string }> = [
  { kind: 'qualifying', label: 'Qualifying' },
  { kind: 'tournament', label: 'Tournaments' },
  { kind: 'stat', label: 'Stats' },
  { kind: 'note', label: 'Notes' },
]

function linkDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'link'
  }
}

export default function SeasonUpdatesTimeline({ updates }: { updates: SeasonUpdate[] }) {
  const [filter, setFilter] = useState<SeasonUpdate['kind'] | 'all'>('all')

  if (updates.length === 0) {
    return (
      <div
        className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-6 py-12 text-center"
        style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
      >
        <p className="text-sm font-semibold text-[#0a1628]">
          Live qualifying, tournament results, and stats are coming soon.
        </p>
        <p className="text-xs text-ink-muted mt-2 max-w-md mx-auto">
          Updates will appear here as the season unfolds.
        </p>
      </div>
    )
  }

  const presentKinds = KIND_FILTERS.filter(f => updates.some(u => u.kind === f.kind))
  const visible = filter === 'all' ? updates : updates.filter(u => u.kind === filter)

  return (
    <div>
      {updates.length >= 2 && presentKinds.length >= 2 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {[{ kind: 'all' as const, label: 'All' }, ...presentKinds].map(f => (
            <button
              key={f.kind}
              type="button"
              onClick={() => setFilter(f.kind)}
              className={`text-[11px] font-semibold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border transition-colors ${
                filter === f.kind
                  ? 'bg-[#0a1628] text-white border-[#0a1628]'
                  : 'bg-white text-[#3d4a5c] border-[rgba(180,168,150,0.5)] hover:border-[#0a1628]/40'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
      <ol className="relative border-l border-[rgba(180,168,150,0.45)] pl-6 space-y-5">
        {visible.map(u => (
          <li key={u.id} className="relative">
            <span className="absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#990000] ring-4 ring-[#fbf9f6]" />
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#0a1628] bg-[#0a1628]/8 px-2 py-0.5 rounded-full">
                  {KIND_LABELS[u.kind]}
                </span>
                <span className="text-[11px] text-ink-muted">{u.dateText}</span>
              </div>
              <p className="text-sm font-semibold text-[#0a1628]">{u.title}</p>
              {u.body && (
                <p className="text-sm text-ink-muted mt-1.5 leading-relaxed whitespace-pre-line">{u.body}</p>
              )}
              {u.media && u.media.length > 0 && (
                <div
                  className={`mt-3 grid gap-1.5 ${
                    u.media.length === 1
                      ? 'grid-cols-1'
                      : u.media.length === 2
                        ? 'grid-cols-2'
                        : 'grid-cols-2 sm:grid-cols-3'
                  }`}
                >
                  {u.media.map(m =>
                    m.type === 'video' ? (
                      <video
                        key={m.url}
                        src={m.url}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full rounded-lg border border-[rgba(180,168,150,0.35)] bg-black aspect-[4/3] object-cover"
                      />
                    ) : (
                      <img
                        key={m.url}
                        src={m.url}
                        alt=""
                        loading="lazy"
                        className="w-full rounded-lg border border-[rgba(180,168,150,0.35)] aspect-[4/3] object-cover"
                      />
                    ),
                  )}
                </div>
              )}
              {u.linkUrl && (
                /* One card shape whether or not the link had an OG image.
                   The old no-image branch was a thin outlined pill that read
                   as a tag rather than something to press, so pasted links
                   with no preview were being missed. */
                <a
                  href={u.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-3 rounded-xl overflow-hidden border border-[rgba(180,168,150,0.45)] bg-white hover:border-[#0a1628]/40 hover:shadow-md transition-all group/link"
                  style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05)' }}
                >
                  {u.previewImageUrl ? (
                    <LinkPreviewImage
                      src={u.previewImageUrl}
                      className="w-full h-40 object-cover bg-[#fdfcf9]"
                    />
                  ) : null}
                  <div className="flex items-center gap-3 px-3.5 py-3">
                    {!u.previewImageUrl && (
                      /* Stands in for the missing thumbnail so the row still
                         reads as a link card and not a line of text. */
                      <span className="flex-shrink-0 w-11 h-11 rounded-lg bg-[#0a1628] flex items-center justify-center">
                        <LinkIcon className="w-4 h-4 text-[#c8a84b]" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                        {linkDomain(u.linkUrl)}
                      </p>
                      {(u.previewTitle || u.linkLabel) && (
                        <p className="text-[13px] font-semibold text-[#0a1628] mt-0.5 leading-snug line-clamp-2">
                          {u.previewTitle || u.linkLabel}
                        </p>
                      )}
                      <span className="text-xs text-[#990000] font-semibold mt-1 inline-flex items-center gap-1 group-hover/link:underline">
                        {u.linkLabel || 'Open link'}
                        <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
