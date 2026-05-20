import Link from 'next/link'
import MemberMapClient from './MemberMapClient'
import type { MapState, MapMember } from '@/app/api/member-map/route'
import { hometownToStateCode, enrichmentStateToCode, CODE_TO_NAME } from '@/lib/map/state-lookup'
import { memberBookEntries } from '@/lib/member-book/data'
import {
  isPublicMember,
  isActiveMember,
  getMemberStartYear,
  getMemberEndYear,
} from '@/lib/member-book/helpers'

const TEAM_SLUG = 'penn-mens-golf'

export default async function MemberMapPage() {
  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug(TEAM_SLUG)

  const stateMap = new Map<string, MapState>()
  const seenTeamStoreNames = new Set<string>()

  function normalize(name: string): string {
    return name.toLowerCase().replace(/[^a-z]/g, '')
  }

  if (team) {
    const enrichMap = new Map(
      store.personEnrichments.filter(e => e.teamId === team.id).map(e => [e.personId, e]),
    )

    function getOrCreate(code: string): MapState {
      let s = stateMap.get(code)
      if (!s) {
        s = {
          stateCode: code,
          stateName: CODE_TO_NAME[code] ?? code,
          totalCount: 0,
          currentPlayerCount: 0,
          alumniCount: 0,
          openToCoffeeCount: 0,
          openToGolfCount: 0,
          members: [],
        }
        stateMap.set(code, s)
      }
      return s
    }

    function addMember(stateCode: string, member: MapMember) {
      const s = getOrCreate(stateCode)
      s.members.push(member)
      s.totalCount++
      if (member.memberRole === 'current_player') s.currentPlayerCount++
      else s.alumniCount++
      if (member.openToCoffee) s.openToCoffeeCount++
      if (member.openToGolfRounds) s.openToGolfCount++
    }

    // Current players — hometown state
    for (const m of store.teamMemberships.filter(x => x.teamId === team.id && x.memberRole === 'current_player')) {
      const person = store.people.find(p => p.id === m.personId)
      if (!person) continue
      const enrichment = enrichMap.get(m.personId)
      if (enrichment?.visibleToPlayers === false) continue
      const stateCode = hometownToStateCode(m.hometown)
      if (!stateCode) continue
      seenTeamStoreNames.add(normalize(person.canonicalName))
      addMember(stateCode, {
        personId: person.id,
        canonicalName: person.canonicalName,
        memberRole: 'current_player',
        classLabel: m.classLabel,
        classYearEstimate: m.classYearEstimate,
        rosterStartYear: m.rosterStartYear,
        rosterEndYear: m.rosterEndYear,
        hometown: m.hometown,
        openToCoffee: enrichment?.openToCoffee ?? false,
        openToGolfRounds: enrichment?.openToGolfRounds ?? false,
      })
    }

    // Published alumni — enrichment state, fall back to hometown
    for (const m of store.teamMemberships.filter(x => x.teamId === team.id && x.memberRole === 'alumni' && x.publishedToNetwork === true)) {
      const person = store.people.find(p => p.id === m.personId)
      if (!person) continue
      const enrichment = enrichMap.get(m.personId)
      if (enrichment?.visibleToPlayers === false) continue
      const stateCode = enrichmentStateToCode(enrichment?.state) ?? hometownToStateCode(m.hometown)
      if (!stateCode) continue
      seenTeamStoreNames.add(normalize(person.canonicalName))
      addMember(stateCode, {
        personId: person.id,
        canonicalName: person.canonicalName,
        memberRole: 'alumni',
        classLabel: m.classLabel,
        rosterStartYear: m.rosterStartYear,
        rosterEndYear: m.rosterEndYear,
        hometown: m.hometown,
        city: enrichment?.city,
        state: enrichment?.state,
        openToCoffee: enrichment?.openToCoffee ?? false,
        openToGolfRounds: enrichment?.openToGolfRounds ?? false,
      })
    }
  }

  function getOrCreateState(code: string): MapState {
    let s = stateMap.get(code)
    if (!s) {
      s = {
        stateCode: code,
        stateName: CODE_TO_NAME[code] ?? code,
        totalCount: 0,
        currentPlayerCount: 0,
        alumniCount: 0,
        openToCoffeeCount: 0,
        openToGolfCount: 0,
        members: [],
      }
      stateMap.set(code, s)
    }
    return s
  }

  // Member Book alumni — every player record with a mappable hometown state.
  // Skip active members (already on the map via team-store current_player)
  // and managers (never public).
  for (const entry of memberBookEntries) {
    if (!isPublicMember(entry)) continue
    if (isActiveMember(entry)) continue
    if (seenTeamStoreNames.has(normalize(entry.displayName))) continue
    const stateCode = hometownToStateCode(entry.profile.hometown ?? undefined)
    if (!stateCode) continue
    const start = getMemberStartYear(entry)
    const end = getMemberEndYear(entry)
    const s = getOrCreateState(stateCode)
    s.members.push({
      personId: `book:${entry.id}`,
      bookId: entry.id,
      canonicalName: entry.displayName,
      memberRole: 'alumni',
      classLabel: entry.profile.classYearEstimate ?? undefined,
      rosterStartYear: start ?? undefined,
      rosterEndYear: end ?? undefined,
      hometown: entry.profile.hometown ?? undefined,
      openToCoffee: false,
      openToGolfRounds: false,
    })
    s.totalCount++
    s.alumniCount++
  }

  const states = Array.from(stateMap.values()).sort((a, b) => b.totalCount - a.totalCount)

  const totalMembers = states.reduce((s, st) => s + st.totalCount, 0)
  const totalCurrent = states.reduce((s, st) => s + st.currentPlayerCount, 0)
  const totalAlumni = states.reduce((s, st) => s + st.alumniCount, 0)

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-12 pb-14">
        <div className="max-w-[1280px] mx-auto">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35 mb-4">
            Penn Men&rsquo;s Golf
          </p>
          <h1
            className="text-white text-4xl sm:text-5xl font-medium leading-tight tracking-tight"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            The Member Map
          </h1>
          <p className="text-white/55 text-sm sm:text-base mt-3 max-w-xl">
            Where Penn Golf players and alumni come from, live, and gather.
          </p>
          <div className="mt-10 border-t border-white/10 pt-7 grid grid-cols-3 sm:flex sm:items-start sm:divide-x sm:divide-white/10 gap-y-5">
            <div className="sm:pr-10">
              <p className="text-3xl sm:text-4xl font-light text-white leading-none" style={{ fontFamily: 'var(--font-playfair)' }}>
                {totalMembers}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 mt-1.5">On the Map</p>
            </div>
            <div className="sm:px-10">
              <p className="text-3xl sm:text-4xl font-light text-white leading-none" style={{ fontFamily: 'var(--font-playfair)' }}>
                {totalCurrent}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 mt-1.5">Current Roster</p>
            </div>
            <div className="sm:px-10">
              <p className="text-3xl sm:text-4xl font-light text-white leading-none" style={{ fontFamily: 'var(--font-playfair)' }}>
                {totalAlumni}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 mt-1.5">Alumni</p>
            </div>
            <div className="sm:px-10">
              <p className="text-3xl sm:text-4xl font-light text-white leading-none" style={{ fontFamily: 'var(--font-playfair)' }}>
                {states.length}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 mt-1.5">States</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-10">
        <MemberMapClient stateData={states} />
      </div>
    </div>
  )
}
