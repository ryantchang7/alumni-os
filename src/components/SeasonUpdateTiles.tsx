'use client'

import { useState } from 'react'
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
 * How much room the picture gets, decided by how much there is to read.
 *
 * A post with no note was showing a small thumbnail over a block of empty
 * card, which wasted the only interesting thing on it. A post with a long
 * note needs the opposite. So the media grows to fill whatever the text
 * does not use, and shrinks as the note gets longer.
 */
function mediaSizing(bodyLength: number): string {
  if (bodyLength === 0) return 'flex-1 min-h-[10rem]'
  if (bodyLength > 140) return 'h-20'
  return 'h-28'
}

function UpdateTile({ u, href }: { u: SeasonUpdate; href: string }) {
  const [expanded, setExpanded] = useState(false)
  const thumb = thumbFor(u)
  const body = (u.body ?? '').trim()
  const hasBody = body.length > 0
  const mediaCls = mediaSizing(body.length)

  const media = (
    <div className={`relative w-full ${mediaCls}`}>
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" loading="lazy" className="w-full h-full object-cover bg-[#fdfcf9]" />
      ) : (
        <div className="w-full h-full bg-[#0a1628] flex items-center justify-center">
          {u.linkUrl ? (
            <LinkIcon className="w-4 h-4 text-[#c8a84b]" />
          ) : (
            <span className="text-[#c8a84b] text-[9.5px] font-semibold uppercase tracking-[0.22em]">
              {KIND_LABELS[u.kind]}
            </span>
          )}
        </div>
      )}
    </div>
  )

  // The picture is the way out to the link. The words are the way to the
  // rest of the words. Wrapping the whole tile in one anchor meant reading
  // the note was impossible without leaving the page.
  const mediaWrapCls = `block ${!hasBody ? 'flex-1 flex' : ''}`
  const mediaNode = u.linkUrl ? (
    <a
      href={u.linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={mediaWrapCls}
      aria-label={`Open ${u.title}`}
    >
      {media}
    </a>
  ) : (
    <Link href={href} className={mediaWrapCls} aria-label={u.title}>
      {media}
    </Link>
  )

  const text = (
    <>
      <p className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-[#990000] mb-1">
        {KIND_LABELS[u.kind]}
      </p>
      <p className="text-[#0a1628] text-[12.5px] font-medium leading-snug font-heading">
        {u.title}
      </p>
      {hasBody && (
        <p
          className={`text-[11px] text-[#3d4a5c] leading-relaxed mt-1.5 whitespace-pre-line ${
            expanded ? '' : 'line-clamp-3'
          }`}
        >
          {body}
        </p>
      )}
      <span className="text-[10px] text-ink-muted mt-auto pt-2 flex items-center gap-1">
        {u.dateText}
        {hasBody ? (
          <span className="ml-auto text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[#990000]">
            {expanded ? 'Less' : 'More'}
          </span>
        ) : (
          <ArrowUpRight className="w-2.5 h-2.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </span>
    </>
  )

  const textCls = 'p-3 flex flex-col flex-1 text-left w-full'

  return (
    <div
      className="group flex flex-col h-full bg-white border border-[rgba(180,168,150,0.4)] rounded-xl overflow-hidden hover:shadow-md transition-shadow"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
    >
      {mediaNode}
      {hasBody ? (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
          className={`${textCls} hover:bg-[#fdfcf9] transition-colors cursor-pointer`}
        >
          {text}
        </button>
      ) : u.linkUrl ? (
        <a href={u.linkUrl} target="_blank" rel="noopener noreferrer" className={textCls}>
          {text}
        </a>
      ) : (
        <Link href={href} className={textCls}>
          {text}
        </Link>
      )}
    </div>
  )
}

/**
 * The team's own updates as tiles on the Clubhouse home, sitting in the same
 * row as the new-coach card and directly under the Penn Athletics strip.
 *
 * Deliberately a size down from the news tiles above: shorter thumbnail,
 * tighter padding, smaller title. Penn's headlines are the loudest thing in
 * "From the box" and these are the quieter, more frequent counterpart.
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
      {updates.slice(0, limit).map(u => (
        <UpdateTile key={u.id} u={u} href={href} />
      ))}
    </>
  )
}
