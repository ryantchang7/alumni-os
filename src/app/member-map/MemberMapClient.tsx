'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import type { MapState, MapMember } from '@/app/api/member-map/route'

// ── Minimal topojson decoder ──────────────────────────────────────────────────
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
        arcs: number[][] | number[][][]
        id: string
        properties: { name: string }
      }>
    }
  }
}

interface StateGeo {
  id: string
  name: string
  d: string
}

function decodeTopojson(topo: Topology): StateGeo[] {
  const { scale = [1, 1], translate = [0, 0] } = topo.transform ?? {}
  const decoded: [number, number][][] = topo.arcs.map((arc) => {
    let x = 0,
      y = 0
    return arc.map(([dx, dy]) => {
      x += dx
      y += dy
      return [x * scale[0] + translate[0], y * scale[1] + translate[1]] as [
        number,
        number,
      ]
    })
  })
  function arcToPoints(idx: number): [number, number][] {
    return idx >= 0 ? decoded[idx] : [...decoded[~idx]].reverse()
  }
  function ringToPath(arcIndices: number[]): string {
    const pts: [number, number][] = []
    for (const idx of arcIndices) {
      const arc = arcToPoints(idx)
      if (pts.length > 0) pts.pop()
      pts.push(...arc)
    }
    if (pts.length === 0) return ''
    return (
      pts
        .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
        .join('') + 'Z'
    )
  }
  function geometryToPath(geom: Topology['objects']['states']['geometries'][number]): string {
    if (geom.type === 'Polygon')
      return (geom.arcs as number[][]).map((ring) => ringToPath(ring)).join('')
    if (geom.type === 'MultiPolygon')
      return (geom.arcs as number[][][])
        .map((p) => (p as number[][]).map((ring) => ringToPath(ring)).join(''))
        .join('')
    return ''
  }
  return topo.objects.states.geometries.map((geo) => ({
    id: geo.id,
    name: geo.properties.name,
    d: geometryToPath(geo),
  }))
}

const FIPS_TO_CODE: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO',
  '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL', '13': 'GA', '15': 'HI',
  '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY',
  '22': 'LA', '23': 'ME', '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN',
  '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH',
  '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC', '46': 'SD',
  '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA',
  '54': 'WV', '55': 'WI', '56': 'WY',
}

type RoleFilter = 'all' | 'current_player' | 'alumni'
type EraFilter = 'all' | '2020s' | '2010s' | '2000s' | '1990s' | 'earlier'

const ROLE_LABELS: Record<RoleFilter, string> = {
  all: 'All Players',
  current_player: 'Current Roster',
  alumni: 'Alumni',
}

const ERA_LABELS: Record<EraFilter, string> = {
  all: 'All Eras',
  '2020s': '2020s',
  '2010s': '2010s',
  '2000s': '2000s',
  '1990s': '1990s',
  earlier: 'Earlier',
}

function matchesCombined(m: MapMember, role: RoleFilter, era: EraFilter): boolean {
  if (role === 'current_player' && m.memberRole !== 'current_player') return false
  if (role === 'alumni' && m.memberRole !== 'alumni') return false
  if (era === 'all') return true
  if (m.memberRole === 'current_player') return era === '2020s'
  const ey = m.rosterEndYear
  if (!ey) return false
  if (era === '2020s') return ey >= 2020
  if (era === '2010s') return ey >= 2010 && ey < 2020
  if (era === '2000s') return ey >= 2000 && ey < 2010
  if (era === '1990s') return ey >= 1990 && ey < 2000
  if (era === 'earlier') return ey < 1990
  return true
}

function memberHref(m: MapMember): string {
  if (m.bookId) return `/member-book/${encodeURIComponent(m.bookId)}`
  return `/player/alumni/${m.personId}`
}

function ContextualRow({ member }: { member: MapMember }) {
  const isCP = member.memberRole === 'current_player'
  const years =
    member.rosterStartYear && member.rosterEndYear
      ? `Penn Golf ${member.rosterStartYear}–${String(member.rosterEndYear).slice(-2)}`
      : member.rosterStartYear
        ? `Penn Golf ${member.rosterStartYear}`
        : null
  return (
    <Link
      href={memberHref(member)}
      data-testid="map-contextual-row"
      className="group block border-b border-[rgba(180,168,150,0.25)] last:border-b-0 px-4 py-3 hover:bg-[#faf7f2] transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-[#0a1628] text-[14px] font-medium leading-snug"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {member.canonicalName}
          </p>
          {years && <p className="text-[12px] text-[#8a7f70] mt-0.5">{years}</p>}
        </div>
        {isCP && (
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full text-[#2d6a4f] bg-[#2d6a4f]/8 border border-[#2d6a4f]/20 whitespace-nowrap mt-0.5">
            Current
          </span>
        )}
      </div>
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#990000] mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        View Member &rarr;
      </p>
    </Link>
  )
}

type Lens = 'hometown' | 'current'

const LENS_LABELS: Record<Lens, string> = {
  hometown: 'Hometowns',
  current: 'Where They Are Now',
}

export default function MemberMapClient({
  hometownStates,
  currentStates,
}: {
  hometownStates: MapState[]
  currentStates: MapState[]
}) {
  const [lens, setLens] = useState<Lens>('hometown')
  const [geos, setGeos] = useState<StateGeo[]>([])
  const [geoError, setGeoError] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [eraFilter, setEraFilter] = useState<EraFilter>('all')

  const stateData = lens === 'hometown' ? hometownStates : currentStates
  const hasData = stateData.length > 0
  const stateByCode = useMemo(
    () => new Map(stateData.map((s) => [s.stateCode, s])),
    [stateData],
  )

  function handleLensChange(next: Lens) {
    if (next === lens) return
    setLens(next)
    setSelected(null)
    setRoleFilter('all')
  }

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json')
      .then((r) => r.json())
      .then((topo: Topology) => setGeos(decodeTopojson(topo)))
      .catch(() => setGeoError(true))
  }, [])

  const filteredStateData = stateData.map((st) => ({
    ...st,
    filteredCount: st.members.filter((m) => matchesCombined(m, roleFilter, eraFilter)).length,
  }))

  const selectedState = selected ? stateByCode.get(selected) ?? null : null
  const filteredMembers =
    selectedState?.members
      .filter((m) => matchesCombined(m, roleFilter, eraFilter))
      .sort((a, b) => {
        if (a.memberRole !== b.memberRole) return a.memberRole === 'current_player' ? -1 : 1
        return (b.rosterEndYear ?? 9999) - (a.rosterEndYear ?? 9999)
      }) ?? []

  const getStateColor = useCallback(
    (fips: string) => {
      const code = FIPS_TO_CODE[fips]
      if (!code) return '#e8e3db'
      const st = filteredStateData.find((s) => s.stateCode === code)
      if (!st || st.filteredCount === 0) return hovered === code ? '#ddd8d0' : '#e8e3db'
      if (selected === code) return '#0a1628'
      if (hovered === code) return '#1a3050'
      if (st.filteredCount >= 5) return '#1e4a7c'
      if (st.filteredCount >= 2) return '#2d6a9f'
      return '#4a8fc4'
    },
    [filteredStateData, selected, hovered],
  )

  const totalShown = filteredStateData.reduce((s, st) => s + st.filteredCount, 0)
  const statesWithMembers = filteredStateData.filter((st) => st.filteredCount > 0).length

  const stateOptions = filteredStateData
    .filter((st) => st.filteredCount > 0)
    .sort((a, b) => a.stateName.localeCompare(b.stateName))

  function handleRoleChange(role: RoleFilter) {
    setRoleFilter(role)
    setSelected(null)
  }
  function handleEraChange(era: EraFilter) {
    setEraFilter(era)
    setSelected(null)
  }
  function handleStateSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelected(e.target.value || null)
  }

  return (
    <div className="space-y-6">
      {/* Lens toggle */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3" data-testid="lens-toggle">
        <div
          role="tablist"
          aria-label="Map view"
          className="inline-flex bg-white border border-[rgba(180,168,150,0.4)] rounded-full p-1"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05)' }}
        >
          {(Object.keys(LENS_LABELS) as Lens[]).map((l) => {
            const active = l === lens
            return (
              <button
                key={l}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleLensChange(l)}
                className={`px-4 sm:px-5 py-1.5 text-[12.5px] font-medium rounded-full transition-colors ${
                  active
                    ? 'bg-[#0a1628] text-white'
                    : 'text-[#3d4a5c] hover:text-[#0a1628]'
                }`}
              >
                {LENS_LABELS[l]}
              </button>
            )
          })}
        </div>
        <p className="text-[12px] text-[#8a7f70] sm:text-right max-w-md">
          {lens === 'hometown'
            ? 'Where Penn Golf members grew up, drawn from the Member Book.'
            : 'Where alumni live now — only members who have updated their location appear.'}
        </p>
      </div>

      {/* Filter panel */}
      <div
        className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-5 py-4 space-y-3.5"
        style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05)' }}
      >
        <div data-testid="role-filter">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mb-2">
            Who
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(ROLE_LABELS) as RoleFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => handleRoleChange(f)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  roleFilter === f
                    ? 'bg-[#0a1628] text-white border-[#0a1628]'
                    : 'bg-[#faf7f2] text-[#3d4a5c] border-[rgba(180,168,150,0.5)] hover:border-[#0a1628]/40'
                }`}
              >
                {ROLE_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        <div data-testid="era-filter">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mb-2">
            Era
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(ERA_LABELS) as EraFilter[]).map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => handleEraChange(e)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  eraFilter === e
                    ? 'bg-[#0a1628] text-white border-[#0a1628]'
                    : 'bg-[#faf7f2] text-[#3d4a5c] border-[rgba(180,168,150,0.5)] hover:border-[#0a1628]/40'
                }`}
              >
                {ERA_LABELS[e]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end gap-4 flex-wrap pt-1">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mb-1.5">
              State
            </p>
            <select
              data-testid="state-filter"
              value={selected ?? ''}
              onChange={handleStateSelect}
              className="text-xs text-[#0a1628] bg-[#faf7f2] border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0a1628]/20 focus:border-[#0a1628]/30 pr-8"
            >
              <option value="">All States</option>
              {stateOptions.map((st) => (
                <option key={st.stateCode} value={st.stateCode}>
                  {st.stateName} ({st.filteredCount})
                </option>
              ))}
            </select>
          </div>
          <p
            className="text-xs text-[#8a7f70] sm:ml-auto"
            data-testid="map-filter-summary"
          >
            <span className="font-semibold text-[#0a1628]">{totalShown}</span> member
            {totalShown !== 1 ? 's' : ''} across{' '}
            <span className="font-semibold text-[#0a1628]">{statesWithMembers}</span> state
            {statesWithMembers !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Map + contextual panel */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <div
          className="w-full bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          {!hasData ? (
            <div className="flex flex-col items-center justify-center text-center px-6" style={{ height: 380 }}>
              <p
                className="text-[#0a1628] text-lg font-medium"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                {lens === 'current'
                  ? 'No alumni have updated their location yet.'
                  : 'No member locations on this map yet.'}
              </p>
              {lens === 'current' && (
                <p className="text-[12.5px] text-[#8a7f70] mt-2 max-w-md">
                  Once alumni add where they live now, they&rsquo;ll appear here. The Hometowns view shows everyone we have data for today.
                </p>
              )}
            </div>
          ) : geoError ? (
            <div className="flex items-center justify-center" style={{ height: 380 }}>
              <p className="text-sm text-[#8a7f70]">Map unavailable — try refreshing.</p>
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
              {geos.map((geo) => {
                const code = FIPS_TO_CODE[geo.id]
                const st = code ? filteredStateData.find((s) => s.stateCode === code) : undefined
                const hasMembers = st && st.filteredCount > 0
                const fill = getStateColor(geo.id)
                return (
                  <path
                    key={geo.id}
                    d={geo.d}
                    fill={fill}
                    stroke="white"
                    strokeWidth={0.75}
                    strokeLinejoin="round"
                    className={hasMembers ? 'cursor-pointer' : ''}
                    style={{ transition: 'fill 0.15s' }}
                    onClick={() => {
                      if (!hasMembers || !code) return
                      setSelected((prev) => (prev === code ? null : code))
                    }}
                    onMouseEnter={() => code && setHovered(code)}
                    onMouseLeave={() => setHovered(null)}
                    role={hasMembers ? 'button' : undefined}
                    aria-label={
                      hasMembers && st
                        ? `${geo.name}: ${st.filteredCount} member${st.filteredCount === 1 ? '' : 's'}`
                        : geo.name
                    }
                    aria-pressed={selected === code}
                    tabIndex={hasMembers ? 0 : undefined}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && hasMembers && code) {
                        e.preventDefault()
                        setSelected((prev) => (prev === code ? null : code))
                      }
                    }}
                  />
                )
              })}
            </svg>
          )}
          <div className="px-4 pb-3 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm inline-block"
                style={{ background: '#4a8fc4' }}
              />
              <span className="text-[10px] text-[#8a7f70]">1 member</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm inline-block"
                style={{ background: '#2d6a9f' }}
              />
              <span className="text-[10px] text-[#8a7f70]">2–4 members</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm inline-block"
                style={{ background: '#1e4a7c' }}
              />
              <span className="text-[10px] text-[#8a7f70]">5+ members</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm inline-block"
                style={{ background: '#0a1628' }}
              />
              <span className="text-[10px] text-[#8a7f70]">Selected</span>
            </div>
            <p className="text-[10px] text-[#8a7f70] ml-auto hidden sm:block">
              Click a state to see members
            </p>
          </div>
        </div>

        {/* Contextual panel */}
        <aside
          data-testid="map-contextual-panel"
          className="w-full lg:w-80 flex-shrink-0 bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          {selectedState ? (
            <>
              <div className="bg-[#0a1628] px-5 py-4 flex items-start justify-between gap-2">
                <div>
                  <p
                    className="font-medium text-white text-base"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    {selectedState.stateName}
                  </p>
                  <p className="text-[11px] text-white/55 mt-0.5">
                    {filteredMembers.length} Penn Golf member
                    {filteredMembers.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Clear selection"
                  className="text-white/55 hover:text-white text-lg leading-none mt-0.5 flex-shrink-0"
                >
                  &times;
                </button>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
                {filteredMembers.length === 0 ? (
                  <p className="text-xs text-[#8a7f70] px-5 py-6">
                    No members match this filter. Try another era.
                  </p>
                ) : (
                  <>
                    {filteredMembers.slice(0, 12).map((m) => (
                      <ContextualRow key={m.personId} member={m} />
                    ))}
                    {filteredMembers.length > 12 && (
                      <div className="px-4 py-3 border-t border-[rgba(180,168,150,0.25)] bg-[#faf7f2]">
                        <Link
                          href="/member-book"
                          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#990000] hover:underline"
                        >
                          Browse all in the Member Book &rarr;
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="px-6 py-10 text-center">
              <p
                className="text-[#0a1628] text-lg font-medium"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Select a state
              </p>
              <p className="text-[12.5px] text-[#8a7f70] mt-2 max-w-[220px] mx-auto leading-relaxed">
                Click any state on the map to see Penn Golf members there.
              </p>
              <Link
                href="/member-book"
                className="inline-block mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#990000] hover:underline"
              >
                Open the Member Book &rarr;
              </Link>
            </div>
          )}
        </aside>
      </div>

      {/* Self-update footer */}
      <div
        className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05)' }}
      >
        <div>
          <p
            className="text-[#0a1628] text-[15px] font-medium"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Are you on this map?
          </p>
          <p className="text-[12.5px] text-[#8a7f70] mt-1">
            Update your hometown and where you live now so the next class can find you.
          </p>
        </div>
        <Link
          href="/alumni"
          data-testid="map-update-location-cta"
          className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#990000] hover:underline whitespace-nowrap"
        >
          Update Your Location &rarr;
        </Link>
      </div>
    </div>
  )
}
