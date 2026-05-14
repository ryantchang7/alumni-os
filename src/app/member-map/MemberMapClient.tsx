'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { MapPlace, MapMember } from '@/app/api/member-map/route'

type Filter = 'all' | 'current_player' | 'alumni' | 'coffee' | 'golf'

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All Members',
  current_player: 'Current Players',
  alumni: 'Alumni',
  coffee: 'Open to Coffee',
  golf: 'Open to Golf',
}

function Pin({
  place,
  selected,
  filtered,
  onClick,
}: {
  place: MapPlace
  selected: boolean
  filtered: boolean
  onClick: () => void
}) {
  const count = place.currentPlayerCount + place.alumniCount
  if (count === 0 || !filtered) return null

  const hasCurrentPlayers = place.currentPlayerCount > 0
  const size = count === 1 ? 'w-5 h-5' : count <= 3 ? 'w-6 h-6' : 'w-7 h-7'

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ left: `${place.x}%`, top: `${place.y}%` }}
      className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-all z-10 ${size} ${
        selected
          ? 'ring-2 ring-white ring-offset-1 ring-offset-transparent scale-125'
          : 'hover:scale-110'
      } ${
        hasCurrentPlayers
          ? 'bg-[#0a1628] text-white'
          : 'bg-[#990000] text-white'
      }`}
      title={`${place.label} — ${count} member${count === 1 ? '' : 's'}`}
    >
      <span className="text-[9px] font-bold leading-none">{count}</span>
    </button>
  )
}

function MemberCard({ member }: { member: MapMember }) {
  const isCurrentPlayer = member.memberRole === 'current_player'
  const classShort = member.classYearEstimate?.split(' / ')[0] ?? member.classLabel
  const years = member.rosterStartYear && member.rosterEndYear
    ? `${member.rosterStartYear}–${String(member.rosterEndYear).slice(-2)}`
    : member.rosterStartYear ? String(member.rosterStartYear) : null

  return (
    <Link
      href={`/player/alumni/${member.personId}`}
      className="block bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-3 hover:border-[#0a1628]/30 transition-colors"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-[#0a1628] text-xs">{member.canonicalName}</p>
        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${
          isCurrentPlayer
            ? 'text-[#2d6a4f] bg-[#2d6a4f]/10'
            : 'text-[#8a7f70] bg-[#f8f5f0] border border-[rgba(180,168,150,0.4)]'
        }`}>
          {isCurrentPlayer ? 'Current Player' : 'Alumni'}
        </span>
      </div>
      {isCurrentPlayer && classShort && (
        <p className="text-[10px] text-[#8a7f70] mt-0.5">{classShort}</p>
      )}
      {!isCurrentPlayer && years && (
        <p className="text-[10px] text-[#8a7f70] mt-0.5">Penn Golf {years}</p>
      )}
      {member.hometown && (
        <p className="text-[10px] text-[#8a7f70]">{member.hometown}</p>
      )}
      {(member.openToCoffee || member.openToGolfRounds) && (
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {member.openToCoffee && (
            <span className="text-[9px] font-medium text-[#2d6a4f] bg-[#2d6a4f]/8 px-1.5 py-0.5 rounded-full border border-[#2d6a4f]/20">
              Coffee
            </span>
          )}
          {member.openToGolfRounds && (
            <span className="text-[9px] font-medium text-[#2d6a4f] bg-[#2d6a4f]/8 px-1.5 py-0.5 rounded-full border border-[#2d6a4f]/20">
              Golf
            </span>
          )}
        </div>
      )}
    </Link>
  )
}

export default function MemberMapClient({ initialPlaces }: { initialPlaces: MapPlace[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null)

  const visiblePlaces = useMemo(() => {
    return initialPlaces.map(place => {
      const filtered = place.members.filter(m => {
        if (filter === 'current_player') return m.memberRole === 'current_player'
        if (filter === 'alumni') return m.memberRole === 'alumni'
        if (filter === 'coffee') return m.openToCoffee
        if (filter === 'golf') return m.openToGolfRounds
        return true
      })
      return { ...place, members: filtered, currentPlayerCount: filtered.filter(m => m.memberRole === 'current_player').length, alumniCount: filtered.filter(m => m.memberRole === 'alumni').length }
    }).filter(p => p.members.length > 0)
  }, [initialPlaces, filter])

  const totalMembers = visiblePlaces.reduce((s, p) => s + p.members.length, 0)
  const totalPlaces = visiblePlaces.length

  const selectedFiltered = selectedPlace
    ? visiblePlaces.find(p => p.id === selectedPlace.id) ?? null
    : null

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(FILTER_LABELS) as Filter[]).map(f => (
          <button
            key={f}
            type="button"
            onClick={() => { setFilter(f); setSelectedPlace(null) }}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              filter === f
                ? 'bg-[#0a1628] text-white border-[#0a1628]'
                : 'bg-white text-[#4a5568] border-[rgba(180,168,150,0.5)] hover:border-[#0a1628]/40'
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="flex gap-6">
        <div>
          <p className="text-xl font-semibold text-[#0a1628]">{totalMembers}</p>
          <p className="text-xs text-[#8a7f70]">Members shown</p>
        </div>
        <div>
          <p className="text-xl font-semibold text-[#0a1628]">{totalPlaces}</p>
          <p className="text-xs text-[#8a7f70]">Places</p>
        </div>
      </div>

      {/* Map + side panel */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* USA map */}
        <div
          className="flex-1 relative bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
          style={{
            boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)',
            minHeight: '340px',
          }}
        >
          {/* USA SVG outline */}
          <svg
            viewBox="0 0 1000 620"
            className="absolute inset-0 w-full h-full"
            style={{ opacity: 0.06 }}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Simplified continental US silhouette */}
            <path
              d="M 150 80 L 820 80 L 900 120 L 920 200 L 880 300 L 820 350 L 800 400 L 750 440 L 730 500 L 700 540 L 650 560 L 580 580 L 480 590 L 380 570 L 300 560 L 240 530 L 180 480 L 130 420 L 100 340 L 80 260 L 90 180 Z"
              fill="#0a1628"
            />
          </svg>

          {/* Grid lines for visual interest */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, rgba(10,22,40,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />

          {/* Pins */}
          <div className="absolute inset-0">
            {visiblePlaces.map(place => (
              <Pin
                key={place.id}
                place={place}
                selected={selectedPlace?.id === place.id}
                filtered
                onClick={() => setSelectedPlace(prev => prev?.id === place.id ? null : place)}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 flex gap-3">
            <div className="flex items-center gap-1.5 bg-white/90 rounded-lg px-2 py-1 border border-[rgba(180,168,150,0.4)]">
              <span className="w-3 h-3 rounded-full bg-[#0a1628] inline-block" />
              <span className="text-[9px] text-[#4a5568] font-medium">Current Player</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/90 rounded-lg px-2 py-1 border border-[rgba(180,168,150,0.4)]">
              <span className="w-3 h-3 rounded-full bg-[#990000] inline-block" />
              <span className="text-[9px] text-[#4a5568] font-medium">Alumni</span>
            </div>
          </div>

          {visiblePlaces.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-[#8a7f70]">No members match this filter.</p>
            </div>
          )}
        </div>

        {/* Side panel */}
        {selectedFiltered ? (
          <div
            className="lg:w-72 bg-white border border-[rgba(180,168,150,0.35)] rounded-xl flex flex-col"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <div className="px-4 py-3 border-b border-[rgba(180,168,150,0.3)] flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-[#0a1628] text-sm">{selectedFiltered.label}</p>
                <div className="flex gap-3 mt-0.5">
                  {selectedFiltered.currentPlayerCount > 0 && (
                    <p className="text-[10px] text-[#2d6a4f]">{selectedFiltered.currentPlayerCount} current player{selectedFiltered.currentPlayerCount > 1 ? 's' : ''}</p>
                  )}
                  {selectedFiltered.alumniCount > 0 && (
                    <p className="text-[10px] text-[#8a7f70]">{selectedFiltered.alumniCount} alum{selectedFiltered.alumniCount > 1 ? 'ni' : ''}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlace(null)}
                className="text-[#8a7f70] hover:text-[#0a1628] text-lg leading-none mt-0.5"
              >
                &times;
              </button>
            </div>
            <div className="p-3 space-y-2 overflow-y-auto flex-1" style={{ maxHeight: '380px' }}>
              {selectedFiltered.members.map(m => (
                <MemberCard key={m.personId} member={m} />
              ))}
            </div>
          </div>
        ) : (
          <div
            className="lg:w-72 bg-white border border-[rgba(180,168,150,0.35)] rounded-xl flex items-center justify-center"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)', minHeight: '200px' }}
          >
            <p className="text-xs text-[#8a7f70] text-center px-4">Click a pin to see members from that place.</p>
          </div>
        )}
      </div>

      {/* City list fallback / mobile */}
      <section>
        <h2 className="text-base font-semibold text-[#0a1628] mb-1">2026–27 Roster Hometowns</h2>
        <p className="text-sm text-[#8a7f70] mb-4">Where this year&apos;s team comes from.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visiblePlaces
            .filter(p => p.currentPlayerCount > 0)
            .map(place => (
              <button
                key={place.id}
                type="button"
                onClick={() => setSelectedPlace(prev => prev?.id === place.id ? null : place)}
                className={`text-left bg-white border rounded-xl p-4 transition-all ${
                  selectedPlace?.id === place.id
                    ? 'border-[#0a1628]/40 shadow-md'
                    : 'border-[rgba(180,168,150,0.35)] hover:border-[#0a1628]/30'
                }`}
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
              >
                <p className="font-semibold text-[#0a1628] text-sm">{place.label}</p>
                <p className="text-xs text-[#2d6a4f] mt-0.5">
                  {place.currentPlayerCount} current player{place.currentPlayerCount > 1 ? 's' : ''}
                  {place.alumniCount > 0 ? ` · ${place.alumniCount} alumni` : ''}
                </p>
                <div className="mt-2 space-y-0.5">
                  {place.members.filter(m => m.memberRole === 'current_player').map(m => {
                    const cls = m.classYearEstimate?.split(' / ')[0] ?? m.classLabel
                    return (
                      <p key={m.personId} className="text-xs text-[#4a5568]">
                        {m.canonicalName}{cls ? ` · ${cls}` : ''}
                      </p>
                    )
                  })}
                </div>
              </button>
            ))}
        </div>
      </section>
    </div>
  )
}
