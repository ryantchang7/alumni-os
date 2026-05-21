'use client'

import { useState } from 'react'
import Link from 'next/link'
import GatheringCard, { type GatheringData } from '@/components/gatherings/GatheringCard'

interface AlumniEntry {
  personId: string
  canonicalName: string
  city?: string
  classLabel?: string
  currentRole?: string
  currentCompany?: string
  openToCoffee?: boolean
  openToMentorship?: boolean
}

interface Props {
  gatherings: GatheringData[]
  openToCoffee: AlumniEntry[]
  cityGroups: { city: string; count: number; coffeeCount: number }[]
}

type TypeFilter = 'all' | 'coffee' | 'drinks' | 'dinner' | 'event'

const TYPE_LABELS: Record<TypeFilter, string> = {
  all: 'All',
  coffee: 'Coffee',
  drinks: 'Drinks',
  dinner: 'Dinner',
  event: 'Events',
}

export default function NineteenthHoleClient({ gatherings, openToCoffee, cityGroups }: Props) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  const filteredGatherings = typeFilter === 'all'
    ? gatherings
    : gatherings.filter(g => g.type === typeFilter)

  return (
    <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-10 space-y-14">

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
                <GatheringCard key={g.id} gathering={g} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Open to Coffee */}
      <section>
        <div className="flex items-baseline gap-3 mb-1">
          <h2 className="text-base font-semibold text-[#0a1628]">Open to Coffee</h2>
          {openToCoffee.length > 0 && (
            <span className="text-xs font-medium text-[#2d6a4f] bg-[#2d6a4f]/10 px-2 py-0.5 rounded-full">
              {openToCoffee.length} available
            </span>
          )}
        </div>
        <p className="text-sm text-[#8a7f70] mb-6">Alumni open to an informal catch-up.</p>
        {openToCoffee.length === 0 ? (
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 text-sm text-[#8a7f70]"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
          >
            No alumni have marked themselves open to coffee yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {openToCoffee.map(entry => (
              <Link
                key={entry.personId}
                href={`/player/alumni/${entry.personId}?teamSlug=penn-mens-golf`}
                className="block bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-4 hover:shadow-md transition-shadow group"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
              >
                <p className="font-semibold text-[#0a1628] text-sm">{entry.canonicalName}</p>
                {entry.city && <p className="text-xs text-[#8a7f70] mt-0.5">{entry.city}</p>}
                {entry.classLabel && <p className="text-xs text-[#8a7f70]">{entry.classLabel}</p>}
                {(entry.currentRole || entry.currentCompany) && (
                  <p className="text-xs text-[#4a5568] mt-1">
                    {[entry.currentRole, entry.currentCompany].filter(Boolean).join(' · ')}
                  </p>
                )}
                <span className="text-xs font-medium text-[#990000] group-hover:underline mt-3 block">
                  View profile &rarr;
                </span>
              </Link>
            ))}
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
          <p className="font-semibold text-[#0a1628] text-sm">Alumni in Your City</p>
          <p className="text-xs text-[#8a7f70] mt-0.5">
            Mark yourself open to meeting players or organizing a gathering in your Alumni profile.
          </p>
        </div>
        <Link href="/alumni" className="text-sm font-semibold text-[#990000] hover:underline whitespace-nowrap">
          Update your profile &rarr;
        </Link>
      </div>

    </div>
  )
}
