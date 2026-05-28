/**
 * Founders Wall — the dark-navy + gold recognition block listing
 * Founding Members and the program Founder. Used full-size on
 * /member-book and as a preview block on /team-room.
 *
 * Pure presentational. Data is passed in by the caller — server pages
 * import computeFoundersForTeam() from '@/lib/founders'; client pages
 * fetch /api/founders.
 */

import Link from 'next/link'
import { Crown, Star } from 'lucide-react'
import type { FounderEntry } from '@/lib/founders'

interface Props {
  founders: FounderEntry[]
  /** When true, caps the list and shows a "See all" link instead of the
   *  full wall. Used by the Team Room preview. */
  preview?: boolean
  /** Max names to show in preview mode. Default 6. */
  limit?: number
  /** "See all" destination. Defaults to /member-book where the full wall
   *  lives today. */
  seeAllHref?: string
  /** Render-as-section className override for spacing tweaks. */
  className?: string
}

export default function FoundersWall({
  founders,
  preview = false,
  limit = 6,
  seeAllHref = '/member-book#founders',
  className,
}: Props) {
  if (!founders || founders.length === 0) return null

  const shown = preview ? founders.slice(0, limit) : founders
  const remaining = preview ? Math.max(0, founders.length - shown.length) : 0

  return (
    <div
      className={
        'bg-gradient-to-br from-[#0a1628] to-[#1a2d4a] text-white rounded-2xl px-7 py-7 sm:px-9 sm:py-8 border border-[#c8a84b]/30 ' +
        (className ?? '')
      }
      style={{
        boxShadow: '0 4px 14px rgba(10,22,40,0.18), 0 18px 40px rgba(10,22,40,0.10)',
      }}
      id="founders"
    >
      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]">
            The Founders Wall
          </p>
          <p
            className="text-white text-xl sm:text-2xl font-medium leading-tight mt-1"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Backers of the Clubhouse.
          </p>
        </div>
        <Link
          href="/support"
          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c8a84b] hover:text-white transition-colors whitespace-nowrap"
        >
          Become a Founding Member &rarr;
        </Link>
      </div>
      <p className="text-[13px] text-white/65 leading-relaxed mb-5 max-w-md">
        Members who stood up early to support Penn Men&rsquo;s Golf and the
        Clubhouse. Founding Members and the program Founder.
      </p>
      <ul className="space-y-2.5">
        {shown.map(f => (
          <li
            key={f.name}
            className="flex items-center gap-3 text-[14.5px]"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {f.isProgramFounder ? (
              <Crown className="w-4 h-4 text-[#c8a84b] flex-shrink-0" />
            ) : (
              <Star className="w-3.5 h-3.5 text-[#c8a84b] flex-shrink-0" />
            )}
            {f.bookId ? (
              <Link
                href={`/member-book/${encodeURIComponent(f.bookId)}`}
                className="text-white hover:text-[#c8a84b] transition-colors"
              >
                {f.name}
              </Link>
            ) : (
              <span className="text-white">{f.name}</span>
            )}
            {f.classLabel && (
              <span className="text-[12px] text-white/45">{f.classLabel}</span>
            )}
            {f.isProgramFounder && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c8a84b] ml-1">
                · Founder
              </span>
            )}
          </li>
        ))}
      </ul>
      {preview && remaining > 0 && (
        <div className="mt-5 pt-4 border-t border-white/10">
          <Link
            href={seeAllHref}
            className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#c8a84b] hover:text-white transition-colors"
          >
            See all {founders.length} founders &rarr;
          </Link>
        </div>
      )}
    </div>
  )
}
