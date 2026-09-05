'use client'

import Link from 'next/link'
import { ArrowUpRight, Link as LinkIcon } from 'lucide-react'
import type { SeasonUpdate } from '@/lib/store/types'

const KIND_LABELS: Record<SeasonUpdate['kind'], string> = {
  qualifying: 'Qualifying',
  tournament: 'Tournament',
  stat: 'Stat',
  note: 'Note',
}

function thumbFor(u: SeasonUpdate): string | null {
  const firstImage = (u.media ?? []).find(m => m.type === 'image')
  return firstImage?.url ?? u.previewImageUrl ?? null
}

/**
 * The team's own updates as tiles on the Clubhouse home, sitting in the same
 * row as the new-coach card and directly under the Penn Athletics strip.
 *
 * Deliberately a size down from the news tiles above: shorter thumbnail,
 * tighter padding, smaller title. Penn's headlines are the loudest thing in
 * "From the box" and these are the quieter, more frequent counterpart, so
 * matching the news tiles exactly made the block read as eight equal
 * headlines instead of four plus a follow-on.
 */
export default function SeasonUpdateTiles({
  updates,
  limit = 3,
  href = '/team-room#season-updates',
}: {
  updates: SeasonUpdate[]
  limit?: number
  href?: string
}) {
  if (updates.length === 0) return null

  return (
    <>
      {updates.slice(0, limit).map(u => {
        const thumb = thumbFor(u)
        const inner = (
          <>
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumb}
                alt=""
                loading="lazy"
                className="w-full h-24 object-cover bg-[#fdfcf9]"
              />
            ) : (
              <div className="w-full h-24 bg-[#0a1628] flex items-center justify-center">
                {u.linkUrl ? (
                  <LinkIcon className="w-4 h-4 text-[#c8a84b]" />
                ) : (
                  <span className="text-[#c8a84b] text-[9.5px] font-semibold uppercase tracking-[0.22em]">
                    {KIND_LABELS[u.kind]}
                  </span>
                )}
              </div>
            )}
            <div className="p-3 flex flex-col flex-1">
              <p className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-[#990000] mb-1">
                {KIND_LABELS[u.kind]}
              </p>
              <p className="text-[#0a1628] text-[12.5px] font-medium leading-snug line-clamp-2 font-heading group-hover:text-[#990000] transition-colors">
                {u.title}
              </p>
              {/* The note written with the post. Clamped, because these run
                  from one line to a paragraph and the tiles sit in a row
                  with the coach card. */}
              {u.body && (
                <p className="text-[11px] text-[#3d4a5c] leading-relaxed mt-1.5 line-clamp-3 whitespace-pre-line">
                  {u.body}
                </p>
              )}
              <p className="text-[10px] text-ink-muted mt-auto pt-2 flex items-center gap-1">
                {u.dateText}
                <ArrowUpRight className="w-2.5 h-2.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </div>
          </>
        )
        const cls =
          'group flex flex-col h-full bg-white border border-[rgba(180,168,150,0.4)] rounded-xl overflow-hidden hover:shadow-md transition-shadow'
        const style = { boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }
        return u.linkUrl ? (
          <a
            key={u.id}
            href={u.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cls}
            style={style}
          >
            {inner}
          </a>
        ) : (
          <Link key={u.id} href={href} className={cls} style={style}>
            {inner}
          </Link>
        )
      })}
    </>
  )
}
