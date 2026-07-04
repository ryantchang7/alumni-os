'use client'

import { useState } from 'react'
import Link from 'next/link'
import GatheringCard, { type GatheringData } from '@/components/gatherings/GatheringCard'
import OpenRequestStrip from '@/components/OpenRequestStrip'
import AlumniCard from '@/components/alumni/AlumniCard'
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
  photoUrl?: string | null
}

// Order matters — this is the rendered top-to-bottom group order.
const ROLE_GROUPS = [
  { key: 'current_player', label: 'Current Players' },
  { key: 'alumni', label: 'Alumni' },
  { key: 'coach', label: 'Coach' },
  { key: 'parent', label: 'Family & Affiliate' },
] as const

function memberCareerLine(entry: AlumniEntry): string | null {
  return [entry.currentRole, entry.currentCompany].filter(Boolean).join(' · ') || null
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
  /** Account id of the viewer — the request strip pins + badges their own posts. */
  viewerAccountId?: string
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
  viewerAccountId,
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
              className="text-white text-xl sm:text-2xl font-medium leading-snug font-heading"
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
              <p className="text-sm text-ink-muted mt-0.5">
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
                    : 'bg-white text-ink-muted border-[rgba(180,168,150,0.5)] hover:border-[#0a1628]/30 hover:text-[#0a1628]'
                }`}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {filteredGatherings.length === 0 ? (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 text-sm text-ink-muted"
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
                  detailHref={`/gatherings/${g.id}`}
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
          viewerAccountId={viewerAccountId}
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
        <p className="text-sm text-ink-muted mb-3">
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
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 text-sm text-ink-muted"
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
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-muted">
                      {group.label}
                    </p>
                    <span className="text-[10.5px] tabular-nums text-ink-muted">
                      · {rows.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rows.slice(0, 24).map(entry => (
                      <AlumniCard
                        key={entry.personId}
                        href={`/player/alumni/${entry.personId}?teamSlug=penn-mens-golf`}
                        name={entry.canonicalName}
                        photoUrl={entry.photoUrl}
                        avatarTone={entry.memberRole === 'parent' ? 'red' : 'navy'}
                        subline={entry.classLabel}
                        relationship={entry.memberRole === 'parent' ? entry.parentRelationship : null}
                        location={[entry.city, entry.state].filter(Boolean).join(', ') || null}
                        handicap={entry.handicap}
                        careerLine={memberCareerLine(entry)}
                        accentColor="#0a1628"
                      />
                    ))}
                  </div>
                  {rows.length > 24 && (
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
          <p className="text-sm text-ink-muted mb-6">Cities with two or more Penn Golf members.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cityGroups.map(({ city, count, coffeeCount }) => (
              <Link
                key={city}
                href={`/member-book`}
                className="block bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5 hover:shadow-md transition-shadow group"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
              >
                <p className="font-semibold text-[#0a1628] text-sm">{city}</p>
                <p className="text-xs text-ink-muted mt-0.5">
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
            className="text-[#0a1628] text-base font-medium font-heading"
          >
            Alumni in your city
          </p>
          <p className="text-[12.5px] text-ink-muted mt-1">
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
