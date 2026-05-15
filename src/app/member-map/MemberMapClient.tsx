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
  const decoded: [number, number][][] = topo.arcs.map(arc => {
    let x = 0, y = 0
    return arc.map(([dx, dy]) => {
      x += dx; y += dy
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
      if (pts.length > 0) pts.pop()
      pts.push(...arc)
    }
    if (pts.length === 0) return ''
    return pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join('') + 'Z'
  }
  function geometryToPath(geom: Topology['objects']['states']['geometries'][number]): string {
    if (geom.type === 'Polygon') return (geom.arcs as number[][]).map(ring => ringToPath(ring)).join('')
    if (geom.type === 'MultiPolygon') return (geom.arcs as number[][][]).map(p => (p as number[][]).map(ring => ringToPath(ring)).join('')).join('')
    return ''
  }
  return topo.objects.states.geometries.map(geo => ({ id: geo.id, name: geo.properties.name, d: geometryToPath(geo) }))
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
type RoleFilter = 'all' | 'current_player' | 'alumni' | 'coffee' | 'golf'
type EraFilter = 'all' | '2020s' | '2010s' | '2000s' | '1990s' | 'earlier'

const ROLE_LABELS: Record<RoleFilter, string> = {
  all: 'All Members',
  current_player: 'Current Roster',
  alumni: 'Alumni',
  coffee: 'Open to Coffee',
  golf: 'Open to Golf',
}

const ERA_LABELS: Record<EraFilter, string> = {
  all: 'All Years',
  '2020s': '2020s',
  '2010s': '2010s',
  '2000s': '2000s',
  '1990s': '1990s',
  earlier: 'Earlier',
}

function matchesCombined(m: MapMember, role: RoleFilter, era: EraFilter): boolean {
  if (role === 'current_player' && m.memberRole !== 'current_player') return false
  if (role === 'alumni' && m.memberRole !== 'alumni') return false
  if (role === 'coffee' && !m.openToCoffee) return false
  if (role === 'golf' && !m.openToGolfRounds) return false
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

// ── Directory member card ─────────────────────────────────────────────────────
function DirectoryMemberCard({ member }: { member: MapMember }) {
  const isCP = member.memberRole === 'current_player'
  const classShort = member.classYearEstimate?.split(' / ')[0] ?? member.classLabel
  const years =
    member.rosterStartYear && member.rosterEndYear
      ? `${member.rosterStartYear}–${String(member.rosterEndYear).slice(-2)}`
      : member.rosterStartYear ? String(member.rosterStartYear) : null
  const location = member.city
    ? member.state ? `${member.city}, ${member.state}` : member.city
    : member.hometown
  return (
    <Link
      href={`/player/alumni/${member.personId}`}
      className="block bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-4 hover:border-[#0a1628]/30 hover:shadow-sm transition-all group"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="font-semibold text-[#0a1628] text-sm leading-snug">{member.canonicalName}</p>
        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 border ${isCP ? 'text-[#2d6a4f] bg-[#2d6a4f]/10 border-[#2d6a4f]/25' : 'text-[#8a7f70] bg-[#f8f5f0] border-[rgba(180,168,150,0.5)]'}`}>
          {isCP ? 'Current Player' : 'Alumni'}
        </span>
      </div>
      {isCP && classShort && <p className="text-xs text-[#8a7f70]">{classShort}</p>}
      {!isCP && years && <p className="text-xs text-[#8a7f70]">Penn Golf {years}</p>}
      {location && <p className="text-xs text-[#8a7f70] mt-0.5">{location}</p>}
      <span className="text-[10px] font-semibold text-[#990000] group-hover:underline mt-2.5 block">View member &rarr;</span>
    </Link>
  )
}

// ── Member card ───────────────────────────────────────────────────────────────
function MemberCard({ member }: { member: MapMember }) {
  const isCP = member.memberRole === 'current_player'
  const classShort = member.classYearEstimate?.split(' / ')[0] ?? member.classLabel
  const years =
    member.rosterStartYear && member.rosterEndYear
      ? `${member.rosterStartYear}–${String(member.rosterEndYear).slice(-2)}`
      : member.rosterStartYear ? String(member.rosterStartYear) : null
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
        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${isCP ? 'text-[#2d6a4f] bg-[#2d6a4f]/12 border border-[#2d6a4f]/25' : 'text-[#8a7f70] bg-white border border-[rgba(180,168,150,0.5)]'}`}>
          {isCP ? 'Current Player' : 'Alumni'}
        </span>
      </div>
      {isCP && classShort && <p className="text-[10px] text-[#8a7f70] mt-0.5">{classShort}</p>}
      {!isCP && years && <p className="text-[10px] text-[#8a7f70] mt-0.5">Penn Golf {years}</p>}
      {location && <p className="text-[10px] text-[#8a7f70]">{location}</p>}
      {(member.openToCoffee || member.openToGolfRounds) && (
        <div className="flex gap-1 mt-1.5">
          {member.openToCoffee && <span className="text-[9px] font-medium text-[#2d6a4f] bg-white px-1.5 py-0.5 rounded-full border border-[#2d6a4f]/25">Coffee</span>}
          {member.openToGolfRounds && <span className="text-[9px] font-medium text-[#2d6a4f] bg-white px-1.5 py-0.5 rounded-full border border-[#2d6a4f]/25">Golf</span>}
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
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [eraFilter, setEraFilter] = useState<EraFilter>('all')

  const hasData = stateData.length > 0
  const stateByCode = useMemo(() => new Map(stateData.map(s => [s.stateCode, s])), [stateData])

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json')
      .then(r => r.json())
      .then((topo: Topology) => setGeos(decodeTopojson(topo)))
      .catch(() => setGeoError(true))
  }, [])

  // Derived: all states with members matching current filter
  const filteredStateData = stateData.map(st => ({
    ...st,
    filteredCount: st.members.filter(m => matchesCombined(m, roleFilter, eraFilter)).length,
  }))

  // Selected state members
  const selectedState = selected ? stateByCode.get(selected) ?? null : null
  const filteredMembers = selectedState?.members.filter(m => matchesCombined(m, roleFilter, eraFilter)) ?? []

  const getStateColor = useCallback((fips: string) => {
    const code = FIPS_TO_CODE[fips]
    if (!code) return '#e8e3db'
    const st = filteredStateData.find(s => s.stateCode === code)
    if (!st || st.filteredCount === 0) return hovered === code ? '#ddd8d0' : '#e8e3db'
    if (selected === code) return '#0a1628'
    if (hovered === code) return '#1a3050'
    if (st.filteredCount >= 3) return '#1e4a7c'
    if (st.filteredCount === 2) return '#2d6a9f'
    return '#4a8fc4'
  }, [filteredStateData, selected, hovered])

  const totalShown = filteredStateData.reduce((s, st) => s + st.filteredCount, 0)
  const statesWithMembers = filteredStateData.filter(st => st.filteredCount > 0).length

  const allFilteredMembers = useMemo(() => {
    const base = selected
      ? (stateByCode.get(selected)?.members ?? [])
      : stateData.flatMap(st => st.members)
    return base
      .filter(m => matchesCombined(m, roleFilter, eraFilter))
      .sort((a, b) => {
        if (a.memberRole !== b.memberRole) return a.memberRole === 'current_player' ? -1 : 1
        return (b.rosterEndYear ?? 9999) - (a.rosterEndYear ?? 9999)
      })
  }, [stateData, stateByCode, selected, roleFilter, eraFilter])

  const directoryTitle = useMemo(() => {
    if (selected) return stateByCode.get(selected)?.stateName ?? 'Members'
    if (roleFilter === 'current_player') return 'Current Roster'
    if (roleFilter === 'alumni') return 'Alumni Directory'
    if (roleFilter === 'coffee') return 'Open to Coffee Chat'
    if (roleFilter === 'golf') return 'Open to Golf'
    return 'Member Directory'
  }, [selected, roleFilter, stateByCode])

  const summaryLabel = useMemo(() => {
    const count = allFilteredMembers.length
    const parts: string[] = [`${count} member${count !== 1 ? 's' : ''}`]
    if (eraFilter !== 'all') parts.push(ERA_LABELS[eraFilter])
    if (!selected) {
      const stateCount = filteredStateData.filter(s => s.filteredCount > 0).length
      if (stateCount > 0) parts.push(`across ${stateCount} state${stateCount !== 1 ? 's' : ''}`)
    }
    return parts.join(' · ')
  }, [allFilteredMembers, eraFilter, selected, filteredStateData])

  // State dropdown options — states with any members in current filter
  const stateOptions = filteredStateData
    .filter(st => st.filteredCount > 0)
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
    const code = e.target.value
    setSelected(code || null)
  }

  return (
    <div className="space-y-5">
      {/* Filter panel */}
      <div
        className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-5 py-4 space-y-3"
        style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05)' }}
      >
        {/* Role filter */}
        <div data-testid="role-filter">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mb-2">Member Type</p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(ROLE_LABELS) as RoleFilter[]).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => handleRoleChange(f)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${roleFilter === f ? 'bg-[#0a1628] text-white border-[#0a1628]' : 'bg-[#faf7f2] text-[#4a5568] border-[rgba(180,168,150,0.5)] hover:border-[#0a1628]/40'}`}
              >
                {ROLE_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Era filter */}
        <div data-testid="era-filter">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mb-2">Era</p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(ERA_LABELS) as EraFilter[]).map(e => (
              <button
                key={e}
                type="button"
                onClick={() => handleEraChange(e)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${eraFilter === e ? 'bg-[#0a1628] text-white border-[#0a1628]' : 'bg-[#faf7f2] text-[#4a5568] border-[rgba(180,168,150,0.5)] hover:border-[#0a1628]/40'}`}
              >
                {ERA_LABELS[e]}
              </button>
            ))}
          </div>
        </div>

        {/* State filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mb-1.5">State</p>
            <select
              data-testid="state-filter"
              value={selected ?? ''}
              onChange={handleStateSelect}
              className="text-xs text-[#0a1628] bg-[#faf7f2] border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0a1628]/20 focus:border-[#0a1628]/30 pr-8"
            >
              <option value="">All States</option>
              {stateOptions.map(st => (
                <option key={st.stateCode} value={st.stateCode}>
                  {st.stateName} ({st.filteredCount})
                </option>
              ))}
            </select>
          </div>
          {/* Summary */}
          <div className="sm:ml-auto pt-4">
            <p className="text-xs text-[#8a7f70]" data-testid="map-filter-summary">
              Showing <span className="font-semibold text-[#0a1628]">{totalShown}</span> member{totalShown !== 1 ? 's' : ''} across <span className="font-semibold text-[#0a1628]">{statesWithMembers}</span> state{statesWithMembers !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Map + panel */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* SVG map */}
        <div
          className="w-full bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          {!hasData ? (
            <div className="flex items-center justify-center" style={{ height: 380 }}>
              <p className="text-sm text-[#8a7f70]">Member locations will appear here as profiles are updated.</p>
            </div>
          ) : geoError ? (
            <div className="flex items-center justify-center" style={{ height: 380 }}>
              <p className="text-sm text-[#8a7f70]">Map unavailable — see city list below.</p>
            </div>
          ) : geos.length === 0 ? (
            <div className="flex items-center justify-center" style={{ height: 380 }}>
              <p className="text-sm text-[#8a7f70]">Loading map…</p>
            </div>
          ) : (
            <svg viewBox="0 0 975 610" className="w-full block" style={{ maxHeight: 480 }} aria-label="United States member map">
              {geos.map(geo => {
                const code = FIPS_TO_CODE[geo.id]
                const st = code ? filteredStateData.find(s => s.stateCode === code) : undefined
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
                    onClick={() => { if (!hasMembers || !code) return; setSelected(prev => prev === code ? null : code) }}
                    onMouseEnter={() => code && setHovered(code)}
                    onMouseLeave={() => setHovered(null)}
                    role={hasMembers ? 'button' : undefined}
                    aria-label={hasMembers && st ? `${geo.name}: ${st.filteredCount} member${st.filteredCount === 1 ? '' : 's'}` : geo.name}
                    aria-pressed={selected === code}
                    tabIndex={hasMembers ? 0 : undefined}
                    onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && hasMembers && code) { e.preventDefault(); setSelected(prev => prev === code ? null : code) } }}
                  />
                )
              })}
            </svg>
          )}
          <div className="px-4 pb-3 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#4a8fc4' }} /><span className="text-[10px] text-[#8a7f70]">1–2 members</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#1e4a7c' }} /><span className="text-[10px] text-[#8a7f70]">3+ members</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#0a1628' }} /><span className="text-[10px] text-[#8a7f70]">Selected</span></div>
            <p className="text-[10px] text-[#8a7f70] ml-auto hidden sm:block">Click a state to see members</p>
          </div>
        </div>

        {/* State detail panel */}
        {selectedState && (
          <div
            className="w-full lg:w-72 flex-shrink-0 bg-white border border-[rgba(180,168,150,0.35)] rounded-xl flex flex-col overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <div className="bg-[#0a1628] px-4 py-3 flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-white text-sm">{selectedState.stateName}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                  <p className="text-[10px] text-gray-400">{filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}</p>
                  {selectedState.currentPlayerCount > 0 && <p className="text-[10px] text-[#6db990]">{selectedState.currentPlayerCount} current</p>}
                  {selectedState.alumniCount > 0 && <p className="text-[10px] text-gray-400">{selectedState.alumniCount} alumni</p>}
                </div>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-gray-400 hover:text-white text-lg leading-none mt-0.5 flex-shrink-0">&times;</button>
            </div>
            <div className="p-3 space-y-2 overflow-y-auto flex-1" style={{ maxHeight: 380 }}>
              {filteredMembers.length === 0 ? (
                <p className="text-xs text-[#8a7f70] py-2">No members match this filter. Try another year or state.</p>
              ) : (
                filteredMembers.map(m => <MemberCard key={m.personId} member={m} />)
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filter-aware member directory */}
      <section data-testid="member-directory">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#0a1628]">{directoryTitle}</h2>
            <p className="text-sm text-[#8a7f70] mt-0.5">{summaryLabel}</p>
          </div>
          {allFilteredMembers.length > 0 && (
            <Link href="/player/search" className="text-xs font-semibold text-[#990000] hover:underline whitespace-nowrap hidden sm:block">Full Member Book &rarr;</Link>
          )}
        </div>
        {allFilteredMembers.length === 0 ? (
          <div className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-8 text-center" style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05)' }}>
            <p className="text-sm font-medium text-[#0a1628] mb-1">No members found for this view.</p>
            <p className="text-xs text-[#8a7f70]">Try another year, state, or member group.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allFilteredMembers.slice(0, 60).map(m => <DirectoryMemberCard key={m.personId} member={m} />)}
            {allFilteredMembers.length > 60 && (
              <div className="col-span-full">
                <Link href="/player/search" className="text-xs font-semibold text-[#990000] hover:underline">
                  View all {allFilteredMembers.length} members in the Member Book &rarr;
                </Link>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
