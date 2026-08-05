'use client'

/**
 * Founders Wall — the dark-navy + gold recognition block. Two tabs:
 *
 *   Founding Members — paid Founding tier + the program Founder
 *   Family Supporters — Family & Affiliate tier subscribers
 *
 * Used full-size on /member-book and as a preview block on /team-room
 * (the preview shows only the Founding tab; the user expands by clicking
 * "See all" which lands on /member-book#founders).
 *
 * Data is passed in by the caller — server pages import
 * computeFoundersForTeam + computeFamilySupportersForTeam from
 * '@/lib/founders'; client pages fetch /api/founders which returns both.
 */

import { useState } from 'react'
import Link from 'next/link'
import { Crown, Heart, Star } from 'lucide-react'
import type { FounderEntry, FamilySupporterEntry } from '@/lib/founders'

interface Props {
  founders: FounderEntry[]
  familySupporters?: FamilySupporterEntry[]
  /** When true, caps each list and shows a "See all" link. Used by the
   *  Team Room preview block. */
  preview?: boolean
  /** Max names to show per tab in preview mode. Default 6. */
  limit?: number
  /** "See all" destination. Defaults to /member-book#founders. */
  seeAllHref?: string
  /** className passthrough for spacing tweaks. */
  className?: string
}

type Tab = 'founders' | 'family'

export default function FoundersWall({
  founders,
  familySupporters = [],
  preview = false,
  limit = 6,
  seeAllHref = '/member-book#founders',
  className,
}: Props) {
  const [tab, setTab] = useState<Tab>('founders')
  const hasFounders = founders.length > 0
  const hasFamily = familySupporters.length > 0
  // Nothing to render either tab — collapse the whole wall (matches
  // previous behavior; the page is responsible for the "become a
  // Founding Member" recruiting block elsewhere).
  if (!hasFounders && !hasFamily) return null

  // If the chosen tab is empty but the other has rows, auto-flip.
  const effectiveTab: Tab =
    tab === 'family' && !hasFamily
      ? 'founders'
      : tab === 'founders' && !hasFounders
        ? 'family'
        : tab

  const founderRows = preview ? founders.slice(0, limit) : founders
  const familyRows = preview ? familySupporters.slice(0, limit) : familySupporters
  const founderRemaining = preview
    ? Math.max(0, founders.length - founderRows.length)
    : 0
  const familyRemaining = preview
    ? Math.max(0, familySupporters.length - familyRows.length)
    : 0

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
      <div className="flex items-baseline justify-between gap-3 mb-4 flex-wrap">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]">
            The Founders Wall
          </p>
          <p
            className="text-white text-xl sm:text-2xl font-medium leading-tight mt-1 font-heading"
          >
            Backers of the Clubhouse.
          </p>
        </div>
        <Link
          href="/support"
          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c8a84b] hover:text-white transition-colors whitespace-nowrap"
        >
          {effectiveTab === 'family'
            ? 'Support the program →'
            : 'Become a Founding Member →'}
        </Link>
      </div>

      {/* Tab pills, quiet, sit just under the title. Only render the
          Family tab when there's at least one supporter, so empty-state
          chrome doesn't pollute the wall. */}
      {hasFamily && (
        <div className="flex items-center gap-2 mb-5">
          <button
            type="button"
            onClick={() => setTab('founders')}
            aria-pressed={effectiveTab === 'founders'}
            className={`inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] px-3 py-1.5 rounded-full transition-colors ${
              effectiveTab === 'founders'
                ? 'bg-[#c8a84b] text-[#0a1628]'
                : 'text-[#c8a84b]/75 border border-[#c8a84b]/35 hover:text-white'
            }`}
          >
            <Star className="w-3 h-3" />
            Founding Members
            <span
              className={`text-[10px] tabular-nums ${
                effectiveTab === 'founders' ? 'opacity-70' : 'opacity-60'
              }`}
            >
              {founders.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab('family')}
            aria-pressed={effectiveTab === 'family'}
            className={`inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] px-3 py-1.5 rounded-full transition-colors ${
              effectiveTab === 'family'
                ? 'bg-[#990000] text-white'
                : 'text-white/70 border border-[#990000]/45 hover:text-white hover:bg-[#990000]/15'
            }`}
          >
            <Heart className="w-3 h-3" />
            Family Supporters
            <span
              className={`text-[10px] tabular-nums ${
                effectiveTab === 'family' ? 'opacity-80' : 'opacity-60'
              }`}
            >
              {familySupporters.length}
            </span>
          </button>
        </div>
      )}

      {effectiveTab === 'founders' && hasFounders && (
        <>
          <p className="text-[13px] text-white/75 leading-relaxed mb-5 max-w-md">
            Members who stood up early to support Penn Men&rsquo;s Golf and the
            Clubhouse. Founding Members and the program Founder.
          </p>
          <ul className="space-y-2.5">
            {founderRows.map(f => (
              <li
                key={f.name}
                className="flex items-center gap-3 text-[14.5px] font-heading"
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
                  <span className="text-[12px] text-white/70">&middot; {f.classLabel}</span>
                )}
                {f.isProgramFounder && (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c8a84b] ml-1">
                    · Founder
                  </span>
                )}
              </li>
            ))}
          </ul>
          {preview && founderRemaining > 0 && (
            <div className="mt-5 pt-4 border-t border-white/10">
              <Link
                href={seeAllHref}
                className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#c8a84b] hover:text-white transition-colors"
              >
                See all {founders.length} founders &rarr;
              </Link>
            </div>
          )}
        </>
      )}

      {effectiveTab === 'family' && hasFamily && (
        <>
          <p className="text-[13px] text-white/75 leading-relaxed mb-5 max-w-md">
            Family, parents, and longtime affiliates who support the program
            through the Family &amp; Affiliate tier.
          </p>
          <ul className="space-y-2.5">
            {familyRows.map(f => (
              <li
                key={f.name}
                className="flex items-center gap-3 text-[14.5px] font-heading"
              >
                <Heart className="w-3.5 h-3.5 text-[#990000] flex-shrink-0" />
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
                {f.parentRelationship && (
                  <span className="text-[12px] text-white/70 truncate">
                    {f.parentRelationship}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {preview && familyRemaining > 0 && (
            <div className="mt-5 pt-4 border-t border-white/10">
              <Link
                href={seeAllHref}
                className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#c8a84b] hover:text-white transition-colors"
              >
                See all {familySupporters.length} supporters &rarr;
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
