'use client'

import { useState } from 'react'
import Link from 'next/link'
import GatheringCard, { type GatheringData } from '@/components/gatherings/GatheringCard'
import OpenRequestStrip from '@/components/OpenRequestStrip'
import type { OpenRequest } from '@/lib/store/types'

interface AlumniEntry {
  personId: string
  canonicalName: string
  memberRole?: 'current_player' | 'alumni' | 'coach' | 'parent'
  city?: string
  state?: string
  classLabel?: string
  currentRole?: string
  currentCompany?: string
  parentRelationship?: string
  handicap?: string
  openToCoffee?: boolean
  openToMentorship?: boolean
}

// Order matters — this is the rendered top-to-bottom group order.
const ROLE_GROUPS = [
  { key: 'current_player', label: 'Current Players' },
  { key: 'alumni', label: 'Alumni' },
  { key: 'coach', label: 'Coach' },
  { key: 'parent', label: 'Family & Affiliate' },
] as const

function MemberCard({ entry }: { entry: AlumniEntry }) {
  return (
    <Link
      href={`/player/alumni/${entry.personId}?teamSlug=penn-mens-golf`}
      className="block bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-4 hover:shadow-md transition-shadow group"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
    >
      <p className="font-semibold text-[#0a1628] text-sm">{entry.canonicalName}</p>
      {(entry.city || entry.state) && (
        <p className="text-xs text-[#8a7f70] mt-0.5">
          {[entry.city, entry.state].filter(Boolean).join(', ')}
        </p>
      )}
      {entry.memberRole === 'parent' && entry.parentRelationship ? (
        <p className="text-xs text-[#990000] mt-0.5">{entry.parentRelationship}</p>
      ) : (
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {entry.classLabel && (
            <p className="text-xs text-[#8a7f70]">{entry.classLabel}</p>
          )}
          {entry.handicap && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2d6a4f] bg-[#2d6a4f]/8 border border-[#2d6a4f]/25 px-1.5 py-0.5 rounded-full whitespace-nowrap">
              HCP {entry.handicap}
            </span>
          )}
        </div>
      )}
      {(entry.currentRole || entry.currentCompany) && (
        <p className="text-xs text-[#4a5568] mt-1">
          {[entry.currentRole, entry.currentCompany].filter(Boolean).join(' · ')}
        </p>
      )}
      <span className="text-xs font-medium text-[#990000] group-hover:underline mt-3 block">
        View profile &rarr;
      </span>
    </Link>
  )
}

interface Props {
  gatherings: GatheringData[]
  openToCoffee: AlumniEntry[]
  cityGroups: { city: string; count: number; coffeeCount: number }[]
  interestedCounts?: Record<string, number>
  /** True when the signed-in viewer has opted into "Open to Coffee" —
   *  used to render a subtle "you're on this list too" chip so they
   *  know they're visible without showing themselves in the grid. */
  viewerOptedToCoffee?: boolean
  /** Linked personId of the viewer; powers the "Edit" link target. */
  viewerPersonId?: string
  /** Open Requests with social intents (drinks/coffee/dinner). */
  openRequests?: OpenRequest[]
}

type TypeFilter = 'all' | 'coffee' | 'drinks' | 'dinner' | 'event'

const TYPE_LABELS: Record<TypeFilter, string> = {
  all: 'All',
  coffee: 'Coffee',
  drinks: 'Drinks',
  dinner: 'Dinner',
  event: 'Events',
}

export default function NineteenthHoleClient({
  gatherings,
  openToCoffee,
  cityGroups,
  interestedCounts,
  viewerOptedToCoffee,
  viewerPersonId,
  openRequests = [],
}: Props) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  const filteredGatherings = typeFilter === 'all'
    ? gatherings
    : gatherings.filter(g => g.type === typeFilter)

  return (
    <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-10 space-y-14">

      {/* Host CTA — prominent, always visible at the top. */}
      <section>
        <div
          className="bg-gradient-to-r from-[#0a1628] to-[#112240] text-white rounded-2xl px-6 py-7 sm:px-8 sm:py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border border-[#c8a84b]/25"
          style={{ boxShadow: '0 4px 14px rgba(10,22,40,0.18), 0 18px 40px rgba(10,22,40,0.10)' }}
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b] mb-2">
              Open the wall
            </p>
            <p
              className="text-white text-xl sm:text-2xl font-medium leading-snug"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Pick a spot. Penn Golf finds you there.
            </p>
            <p className="text-[13px] text-white/70 mt-1.5">
              Drinks, dinner, coffee, or a watch party — host it and members will show up.
            </p>
          </div>
          <Link
            href="/19th-hole/host"
            data-testid="host-the-19th"
            className="bg-[#c8a84b] hover:bg-[#d4b75a] text-[#0a1628] text-[13px] font-semibold uppercase tracking-[0.14em] px-7 py-3.5 rounded-lg transition-colors whitespace-nowrap"
          >
            Host the 19th &rarr;
          </Link>
        </div>
      </section>

      {/* Type filter pills + gatherings */}
      {gatherings.length > 0 && (
        <section data-testid="social-gatherings-section">
          <div className="flex items-baseline justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-semibold text-[#0a1628]">Upcoming Gatherings</h2>
              <p className="text-sm text-[#8a7f70] mt-0.5">
                Coffee, dinners, and signature events organized by Penn Golf alumni.
              </p>
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            {(Object.keys(TYPE_LABELS) as TypeFilter[]).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  typeFilter === t
                    ? 'bg-[#0a1628] text-white border-[#0a1628]'
                    : 'bg-white text-[#8a7f70] border-[rgba(180,168,150,0.5)] hover:border-[#0a1628]/30 hover:text-[#0a1628]'
                }`}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {filteredGatherings.length === 0 ? (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 text-sm text-[#8a7f70]"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              No {typeFilter === 'all' ? '' : typeFilter + ' '}gatherings scheduled right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredGatherings.map(g => (
                <GatheringCard
                  key={g.id}
                  gathering={g}
                  interestedCount={interestedCounts?.[g.id] ?? 0}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Open Requests — visiting members looking for drinks / coffee /
          dinner. Empty-state strip still renders to advertise the
          "Post a request" CTA. */}
      <section>
        <OpenRequestStrip
          requests={openRequests}
          eyebrow="Open Requests"
          title="In town and want company."
          subtitle="Penn Golf members visiting somewhere — drop a note if you can host them."
          accent="#b8860b"
          limit={6}
        />
      </section>

      {/* Open to Coffee — grouped by role so every list of "who's
          open" reads cleanly: Current Players, then Alumni, then Coach,
          then Family & Affiliate. Groups with zero members are hidden. */}
      <section>
        <div className="flex items-baseline gap-3 mb-1">
          <h2 className="text-base font-semibold text-[#0a1628]">Open to Coffee</h2>
          {openToCoffee.length > 0 && (
            <span className="text-xs font-medium text-[#2d6a4f] bg-[#2d6a4f]/10 px-2 py-0.5 rounded-full">
              {openToCoffee.length} available
            </span>
          )}
        </div>
        <p className="text-sm text-[#8a7f70] mb-3">
          Penn Golf members open to an informal catch-up.
        </p>
        {viewerOptedToCoffee && viewerPersonId && (
          <div className="mb-6 inline-flex items-center gap-2 bg-[#0a1628]/5 border border-[#0a1628]/15 rounded-full px-3.5 py-1.5 text-[11.5px] text-[#3d4a5c]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]" />
            You&rsquo;re on this list too.
            <Link
              href={`/alumni/profile/${encodeURIComponent(viewerPersonId)}?teamSlug=penn-mens-golf`}
              className="font-semibold text-[#990000] hover:underline"
            >
              Edit
            </Link>
          </div>
        )}
        {openToCoffee.length === 0 ? (
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 text-sm text-[#8a7f70]"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
          >
            No one has marked themselves open to coffee yet.
          </div>
        ) : (
          <div className="space-y-8">
            {ROLE_GROUPS.map(group => {
              const rows = openToCoffee.filter(
                e => (e.memberRole ?? 'alumni') === group.key,
              )
              if (rows.length === 0) return null
              return (
                <div key={group.key}>
                  <div className="flex items-baseline gap-2 mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a7f70]">
                      {group.label}
                    </p>
                    <span className="text-[10.5px] tabular-nums text-[#8a7f70]">
                      · {rows.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rows.slice(0, 12).map(entry => (
                      <MemberCard key={entry.personId} entry={entry} />
                    ))}
                  </div>
                  {rows.length > 12 && (
                    <div className="mt-3">
                      <Link
                        href="/member-book"
                        className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#990000] hover:underline"
                      >
                        See all {rows.length} in the Member Book &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Alumni by City */}
      {cityGroups.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-[#0a1628] mb-1">Alumni by City</h2>
          <p className="text-sm text-[#8a7f70] mb-6">Cities with two or more Penn Golf members.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cityGroups.map(({ city, count, coffeeCount }) => (
              <Link
                key={city}
                href={`/member-book`}
                className="block bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5 hover:shadow-md transition-shadow group"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
              >
                <p className="font-semibold text-[#0a1628] text-sm">{city}</p>
                <p className="text-xs text-[#8a7f70] mt-0.5">
                  {count} {count === 1 ? 'member' : 'members'}
                  {coffeeCount > 0 && ` · ${coffeeCount} open to coffee`}
                </p>
                <span className="text-xs font-medium text-[#990000] group-hover:underline mt-3 block">
                  View members &rarr;
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Alumni CTA */}
      <div
        className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
      >
        <div>
          <p
            className="text-[#0a1628] text-base font-medium"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Alumni in your city
          </p>
          <p className="text-[12.5px] text-[#8a7f70] mt-1">
            Mark yourself open to a coffee or dinner and other members will find you.
          </p>
        </div>
        <Link
          href="/account/profile"
          className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#990000] hover:underline whitespace-nowrap"
        >
          Update your profile &rarr;
        </Link>
      </div>

    </div>
  )
}
