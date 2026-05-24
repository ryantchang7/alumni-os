'use client'

import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import type { TeamNewsItem } from '@/lib/store/types'

interface Props {
  items: TeamNewsItem[]
}

function timeAgo(iso?: string): string {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'today'
  if (days === 1) return '1d ago'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months === 1) return '1mo ago'
  return `${months}mo ago`
}

/** Fallback placeholder used when there's no imageUrl or the image fails
 * to load (Sidearm Sports blocks hot-linking from some domains). */
function PlaceholderThumb() {
  return (
    <div className="w-full h-32 bg-[#0a1628] flex items-center justify-center">
      <span className="text-[#c8a84b] text-[10px] font-semibold uppercase tracking-[0.22em]">
        Penn Athletics
      </span>
    </div>
  )
}

function NewsThumb({ src }: { src: string }) {
  const [errored, setErrored] = useState(false)
  if (errored) return <PlaceholderThumb />
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="w-full h-32 object-cover bg-[#0a1628]"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
    />
  )
}

/**
 * Horizontal news strip pulled from Penn Athletics. Renders nothing if
 * empty so the page doesn't show a hollow shell. Individual thumbs fall
 * back to a styled placeholder if the source image fails (hot-link
 * blocking on Sidearm Sports' CDN).
 */
export default function TeamNewsStrip({ items }: Props) {
  if (items.length === 0) return null

  return (
    <section data-testid="team-news-strip">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#990000] mb-0.5">
            From the box
          </p>
          <h2
            className="text-[#0a1628] text-base font-medium"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Penn Men&rsquo;s Golf — Latest
          </h2>
        </div>
        <a
          href="https://pennathletics.com/sports/mens-golf"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0a1628] hover:text-[#990000] transition-colors"
        >
          Penn Athletics
          <ArrowUpRight className="w-3 h-3" />
        </a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.slice(0, 4).map(item => (
          <a
            key={item.id}
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-white border border-[rgba(180,168,150,0.4)] rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            {item.imageUrl ? <NewsThumb src={item.imageUrl} /> : <PlaceholderThumb />}
            <div className="p-4">
              <p
                className="text-[#0a1628] text-[13.5px] font-medium leading-snug line-clamp-3 group-hover:text-[#990000] transition-colors"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                {item.title}
              </p>
              <p className="text-[10.5px] text-[#8a7f70] mt-2 flex items-center gap-1">
                {timeAgo(item.publishedAt)}
                <ArrowUpRight className="w-2.5 h-2.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
