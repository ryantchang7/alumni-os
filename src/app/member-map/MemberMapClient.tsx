'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { MapState, MapMember } from '@/app/api/member-map/route'

// ── Minimal topojson decoder ──────────────────────────────────────────────────
// Decodes us-atlas states topojson without any npm packages.
// Spec: https://github.com/topojson/topojson-specification

interface Topology {
  type: 'Topology'
  bbox?: number[]
  transform?: { scale: [number, number]; translate: [number, number] }
  arcs: number[][][]
  objects: {
    states: {
      type: 'GeometryCollection'
      geometries: Array<{
        type: 'Polygon' | 'MultiPolygon'
        arcs: number[][]  | number[][][]
        id: string
        properties: { name: string }
      }>
    }
  }
}

interface StateGeo {
  id: string   // FIPS code e.g. "06"
  name: string // "California"
  d: string    // SVG path string
}

function decodeTopojson(topo: Topology): StateGeo[] {
  const { scale = [1, 1], translate = [0, 0] } = topo.transform ?? {}

  // Delta-decode arcs into projected coordinates
  const decoded: [number, number][][] = topo.arcs.map(arc => {
    let x = 0, y = 0
    return arc.map(([dx, dy]) => {
      x += dx
      y += dy
      return [x * scale[0] + translate[0], y * scale[1] + translate[1]] as [number, number]
    })
  })

  function arcToPoints(idx: number): [number, number][] {
    return idx >= 0 ? decoded[idx] : [...decoded[~idx]].reverse()
  }

  function ringToPath(arcIndices: number[]): string {
    const pts: [number, number][] = []
    for (const idx of arcIndices) {
      const arc = arcToPoints(idx)
      if (pts.length > 0) pts.pop() // remove shared junction point
      pts.push(...arc)
    }
    if (pts.length === 0) return ''
    return pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join('') + 'Z'
  }

  function geometryToPath(geom: Topology['objects']['states']['geometries'][number]): string {
    if (geom.type === 'Polygon') {
      return (geom.arcs as number[][]).map(ring => ringToPath(ring)).join('')
    }
    if (geom.type === 'MultiPolygon') {
      return (geom.arcs as number[][][])
        .map(poly => (poly as number[][]).map(ring => ringToPath(ring)).join(''))
        .join('')
    }
    return ''
  }

  return topo.objects.states.geometries.map(geo => ({
    id: geo.id,
    name: geo.properties.name,
    d: geometryToPath(geo),
  }))
}

// ── FIPS → state code lookup ──────────────────────────────────────────────────
const FIPS_TO_CODE: Record<string, string> = {
  '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE',
  '11':'DC','12':'FL','13':'GA','15':'HI','16':'ID','17':'IL','18':'IN','19':'IA',
  '20':'KS','21':'KY','22':'LA','23':'ME','24':'MD','25':'MA','26':'MI','27':'MN',
  '28':'MS','29':'MO','30':'MT','31':'NE','32':'NV','33':'NH','34':'NJ','35':'NM',
  '36':'NY','37':'NC','38':'ND','39':'OH','40':'OK','41':'OR','42':'PA','44':'RI',
  '45':'SC','46':'SD','47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA',
  '54':'WV','55':'WI','56':'WY',
}

// ── Filter types ──────────────────────────────────────────────────────────────
type Filter = 'all' | 'current_player' | 'alumni' | 'coffee' | 'golf'

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All Members',
  current_player: 'Current Players',
  alumni: 'Alumni',
  coffee: 'Open to Coffee',
  golf: 'Open to Golf',
}

// ── Member card ───────────────────────────────────────────────────────────────
function MemberCard({ member }: { member: MapMember }) {
  const isCP = member.memberRole === 'current_player'
  const classShort = member.classYearEstimate?.split(' / ')[0] ?? member.classLabel
  const years =
    member.rosterStartYear && member.rosterEndYear
      ? `${member.rosterStartYear}–${String(member.rosterEndYear).slice(-2)}`
      : member.rosterStartYear
        ? String(member.rosterStartYear)
        : null
  const location = member.city
    ? member.state ? `${member.city}, ${member.state}` : member.city
    : member.hometown

  return (
    <Link
      href={`/player/alumni/${member.personId}`}
      className="block bg-[#f8f5f0] border border-[rgba(180,168,150,0.4)] rounded-lg p-3 hover:border-[#0a1628]/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-[#0a1628] text-xs leading-snug">{member.canonicalName}</p>
        <span
          className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${
            isCP
              ? 'text-[#2d6a4f] bg-[#2d6a4f]/12 border border-[#2d6a4f]/25'
              : 'text-[#8a7f70] bg-white border border-[rgba(180,168,150,0.5)]'
          }`}
        >
          {isCP ? 'Current Player' : 'Alumni'}
        </span>
      </div>
      {isCP && classShort && (
        <p className="text-[10px] text-[#8a7f70] mt-0.5">{classShort}</p>
      )}
      {!isCP && years && (
        <p className="text-[10px] text-[#8a7f70] mt-0.5">Penn Golf {years}</p>
      )}
      {location && <p className="text-[10px] text-[#8a7f70]">{location}</p>}
      {(member.openToCoffee || member.openToGolfRounds) && (
        <div className="flex gap-1 mt-1.5">
          {member.openToCoffee && (
            <span className="text-[9px] font-medium text-[#2d6a4f] bg-white px-1.5 py-0.5 rounded-full border border-[#2d6a4f]/25">
              Coffee
            </span>
          )}
          {member.openToGolfRounds && (
            <span className="text-[9px] font-medium text-[#2d6a4f] bg-white px-1.5 py-0.5 rounded-full border border-[#2d6a4f]/25">
              Golf
            </span>
          )}
        </div>
      )}
    </Link>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MemberMapClient({ stateData }: { stateData: MapState[] }) {
  const [geos, setGeos] = useState<StateGeo[]>([])
  const [geoError, setGeoError] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  // Build stateCode → MapState lookup
  const stateByCode = new Map(stateData.map(s => [s.stateCode, s]))

  // Fetch and decode topojson
  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json')
      .then(r => r.json())
      .then((topo: Topology) => setGeos(decodeTopojson(topo)))
      .catch(() => setGeoError(true))
  }, [])

  // Filter members in selected state
  const selectedState = selected ? stateByCode.get(selected) ?? null : null
  const filteredMembers = selectedState?.members.filter(m => {
    if (filter === 'current_player') return m.memberRole === 'current_player'
    if (filter === 'alumni') return m.memberRole === 'alumni'
    if (filter === 'coffee') return m.openToCoffee
    if (filter === 'golf') return m.openToGolfRounds
    return true
  }) ?? []

  const getStateColor = useCallback((fips: string) => {
    const code = FIPS_TO_CODE[fips]
    if (!code) return '#e8e3db'
    const state = stateByCode.get(code)
    if (!state) return '#e8e3db'

    const isSelected = selected === code
    const isHovered = hovered === code

    // Filter visibility
    let matches = state.totalCount
    if (filter === 'current_player') matches = state.currentPlayerCount
    else if (filter === 'alumni') matches = state.alumniCount
    else if (filter === 'coffee') matches = state.openToCoffeeCount
    else if (filter === 'golf') matches = state.openToGolfCount

    if (matches === 0) return isHovered ? '#ddd8d0' : '#e8e3db'
    if (isSelected) return '#0a1628'
    if (isHovered) return '#1a3050'
    // Intensity based on count
    if (matches >= 3) return '#1e4a7c'
    if (matches === 2) return '#2d6a9f'
    return '#4a8fc4'
  }, [stateByCode, selected, hovered, filter])

  const totalShown = stateData.reduce((s, st) => {
    if (filter === 'current_player') return s + st.currentPlayerCount
    if (filter === 'alumni') return s + st.alumniCount
    if (filter === 'coffee') return s + st.openToCoffeeCount
    if (filter === 'golf') return s + st.openToGolfCount
    return s + st.totalCount
  }, 0)
  const statesWithMembers = stateData.filter(st => {
    if (filter === 'current_player') return st.currentPlayerCount > 0
    if (filter === 'alumni') return st.alumniCount > 0
    if (filter === 'coffee') return st.openToCoffeeCount > 0
    if (filter === 'golf') return st.openToGolfCount > 0
    return st.totalCount > 0
  }).length

  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(FILTER_LABELS) as Filter[]).map(f => (
          <button
            key={f}
            type="button"
            onClick={() => { setFilter(f); setSelected(null) }}
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
          <p className="text-xl font-semibold text-[#0a1628]">{totalShown}</p>
          <p className="text-xs text-[#8a7f70]">Members mapped</p>
        </div>
        <div>
          <p className="text-xl font-semibold text-[#0a1628]">{statesWithMembers}</p>
          <p className="text-xs text-[#8a7f70]">States represented</p>
        </div>
      </div>

      {/* Map + panel */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* SVG map */}
        <div
          className="w-full bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          {geoError ? (
            <div className="flex items-center justify-center" style={{ height: 380 }}>
              <p className="text-sm text-[#8a7f70]">Map unavailable — see city list below.</p>
            </div>
          ) : geos.length === 0 ? (
            <div className="flex items-center justify-center" style={{ height: 380 }}>
              <p className="text-sm text-[#8a7f70]">Loading map…</p>
            </div>
          ) : (
            <svg
              viewBox="0 0 975 610"
              className="w-full block"
              style={{ maxHeight: 480 }}
              aria-label="United States member map"
            >
              {geos.map(geo => {
                const code = FIPS_TO_CODE[geo.id]
                const state = code ? stateByCode.get(code) : undefined
                const fill = getStateColor(geo.id)
                const isActive = selected === code

                return (
                  <path
                    key={geo.id}
                    d={geo.d}
                    fill={fill}
                    stroke="white"
                    strokeWidth={0.75}
                    strokeLinejoin="round"
                    className={state ? 'cursor-pointer' : ''}
                    style={{ transition: 'fill 0.15s' }}
                    onClick={() => {
                      if (!state) return
                      setSelected(prev => prev === code ? null : code ?? null)
                    }}
                    onMouseEnter={() => code && setHovered(code)}
                    onMouseLeave={() => setHovered(null)}
                    role={state ? 'button' : undefined}
                    aria-label={state ? `${geo.name}: ${state.totalCount} member${state.totalCount === 1 ? '' : 's'}` : geo.name}
                    aria-pressed={isActive}
                    tabIndex={state ? 0 : undefined}
                    onKeyDown={e => {
                      if ((e.key === 'Enter' || e.key === ' ') && state && code) {
                        e.preventDefault()
                        setSelected(prev => prev === code ? null : code)
                      }
                    }}
                  />
                )
              })}
            </svg>
          )}

          {/* Map legend */}
          <div className="px-4 pb-3 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#4a8fc4' }} />
              <span className="text-[10px] text-[#8a7f70]">1–2 members</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#1e4a7c' }} />
              <span className="text-[10px] text-[#8a7f70]">3+ members</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#0a1628' }} />
              <span className="text-[10px] text-[#8a7f70]">Selected</span>
            </div>
            <p className="text-[10px] text-[#8a7f70] ml-auto hidden sm:block">Click a state to see members</p>
          </div>
        </div>

        {/* State detail panel */}
        {selectedState && (
          <div
            className="w-full lg:w-72 flex-shrink-0 bg-white border border-[rgba(180,168,150,0.35)] rounded-xl flex flex-col overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            {/* Panel header */}
            <div className="bg-[#0a1628] px-4 py-3 flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-white text-sm">{selectedState.stateName}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                  <p className="text-[10px] text-gray-400">{selectedState.totalCount} total</p>
                  {selectedState.currentPlayerCount > 0 && (
                    <p className="text-[10px] text-[#6db990]">{selectedState.currentPlayerCount} current player{selectedState.currentPlayerCount > 1 ? 's' : ''}</p>
                  )}
                  {selectedState.alumniCount > 0 && (
                    <p className="text-[10px] text-gray-400">{selectedState.alumniCount} alum{selectedState.alumniCount !== 1 ? 'ni' : ''}</p>
                  )}
                  {selectedState.openToCoffeeCount > 0 && (
                    <p className="text-[10px] text-[#6db990]">{selectedState.openToCoffeeCount} coffee</p>
                  )}
                  {selectedState.openToGolfCount > 0 && (
                    <p className="text-[10px] text-[#6db990]">{selectedState.openToGolfCount} golf</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-white text-lg leading-none mt-0.5 flex-shrink-0"
              >
                &times;
              </button>
            </div>

            {/* Member list */}
            <div className="p-3 space-y-2 overflow-y-auto flex-1" style={{ maxHeight: 380 }}>
              {filteredMembers.length === 0 ? (
                <p className="text-xs text-[#8a7f70] py-2">No members match this filter.</p>
              ) : (
                filteredMembers.map(m => <MemberCard key={m.personId} member={m} />)
              )}
            </div>
          </div>
        )}
      </div>

      {/* Current roster section */}
      <section>
        <h2 className="text-base font-semibold text-[#0a1628] mb-1">2026–27 Roster Hometowns</h2>
        <p className="text-sm text-[#8a7f70] mb-4">Where this year&apos;s team comes from.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stateData
            .filter(s => s.currentPlayerCount > 0)
            .map(stateInfo => (
              <button
                key={stateInfo.stateCode}
                type="button"
                onClick={() => setSelected(prev => prev === stateInfo.stateCode ? null : stateInfo.stateCode)}
                className={`text-left bg-white border rounded-xl p-4 transition-all ${
                  selected === stateInfo.stateCode
                    ? 'border-[#0a1628] shadow-sm'
                    : 'border-[rgba(180,168,150,0.35)] hover:border-[#0a1628]/30'
                }`}
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-semibold text-[#0a1628] text-sm">{stateInfo.stateName}</p>
                  <span className="text-[10px] font-medium text-[#2d6a4f] bg-[#2d6a4f]/8 px-2 py-0.5 rounded-full border border-[#2d6a4f]/20">
                    {stateInfo.currentPlayerCount} player{stateInfo.currentPlayerCount > 1 ? 's' : ''}
                  </span>
                </div>
                {stateInfo.members
                  .filter(m => m.memberRole === 'current_player')
                  .map(m => {
                    const cls = m.classYearEstimate?.split(' / ')[0] ?? m.classLabel
                    return (
                      <p key={m.personId} className="text-xs text-[#4a5568]">
                        {m.canonicalName}{cls ? ` · ${cls}` : ''}{m.hometown ? ` · ${m.hometown}` : ''}
                      </p>
                    )
                  })}
                {stateInfo.alumniCount > 0 && (
                  <p className="text-[10px] text-[#8a7f70] mt-1">{stateInfo.alumniCount} alum{stateInfo.alumniCount !== 1 ? 'ni' : ''} also here</p>
                )}
              </button>
            ))}
        </div>
      </section>
    </div>
  )
}
