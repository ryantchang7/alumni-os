import Link from 'next/link'
import { ArrowUpRight, Link as LinkIcon } from 'lucide-react'
import type { SeasonUpdate } from '@/lib/store/types'

const KIND_LABELS: Record<SeasonUpdate['kind'], string> = {
  qualifying: 'Qualifying',
  tournament: 'Tournament',
  stat: 'Stat',
  note: 'Note',
}

function linkDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'link'
  }
}

/** First still image on the update, if it has one. Videos are skipped: a
 * paused frame is not reliably a usable thumbnail at this size. */
function thumbFor(u: SeasonUpdate): string | null {
  const firstImage = (u.media ?? []).find(m => m.type === 'image')
  return firstImage?.url ?? u.previewImageUrl ?? null
}

/**
 * A short read-only view of the newest team updates, shown beside the Penn
 * Athletics feed so "From the box" carries both what Penn published and what
 * the team said itself.
 *
 * Each row carries whatever visual it has: a photo off the post, or a link
 * chip when the post is a pasted link. That is deliberate. Without it the
 * block was a wall of small text sitting next to four image tiles and read
 * as a footnote rather than as content. The full timeline, with filters and
 * full-size media, stays further down the page.
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
    <div
      className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl p-4 h-full flex flex-col"
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
        {recent.map(u => {
          const thumb = thumbFor(u)
          const body = (
            <>
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumb}
                  alt=""
                  loading="lazy"
                  className="flex-shrink-0 w-11 h-11 rounded-lg object-cover border border-[rgba(180,168,150,0.4)]"
                />
              ) : u.linkUrl ? (
                <span className="flex-shrink-0 w-11 h-11 rounded-lg bg-[#0a1628] flex items-center justify-center">
                  <LinkIcon className="w-3.5 h-3.5 text-[#c8a84b]" />
                </span>
              ) : (
                <span className="flex-shrink-0 w-11 h-11 rounded-lg bg-[#f5f0e8] border border-[rgba(180,168,150,0.4)] flex items-center justify-center">
                  <span className="text-[8.5px] font-bold uppercase tracking-[0.06em] text-[#0a1628]">
                    {KIND_LABELS[u.kind].slice(0, 4)}
                  </span>
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-[#0a1628] bg-[#f5f0e8] border border-[rgba(180,168,150,0.5)] rounded px-1.5 py-0.5">
                    {KIND_LABELS[u.kind]}
                  </span>
                  {u.linkUrl && (
                    <span className="text-[9.5px] text-ink-muted truncate">
                      {linkDomain(u.linkUrl)}
                    </span>
                  )}
                </span>
                <span className="block text-[13px] text-[#0a1628] font-medium leading-snug line-clamp-2 mt-1">
                  {u.title}
                </span>
                <span className="block text-[10.5px] text-ink-muted mt-0.5">{u.dateText}</span>
              </span>
              {u.linkUrl && (
                <ArrowUpRight className="w-3 h-3 flex-shrink-0 text-ink-muted mt-1" />
              )}
            </>
          )
          return (
            <li key={u.id}>
              {u.linkUrl ? (
                <a
                  href={u.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 rounded-lg -mx-1.5 px-1.5 py-1.5 hover:bg-[#fdfcf9] transition-colors"
                >
                  {body}
                </a>
              ) : (
                <Link
                  href={href}
                  className="flex items-start gap-3 rounded-lg -mx-1.5 px-1.5 py-1.5 hover:bg-[#fdfcf9] transition-colors"
                >
                  {body}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
