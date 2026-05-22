import MemberMapClient from './MemberMapClient'
import type { MapState, MapMember } from '@/app/api/member-map/route'
import {
  hometownToStateCode,
  enrichmentStateToCode,
  CODE_TO_NAME,
} from '@/lib/map/state-lookup'
import { memberBookEntries } from '@/lib/member-book/data'
import {
  isPublicMember,
  isActiveMember,
  getMemberStartYear,
  getMemberEndYear,
} from '@/lib/member-book/helpers'

const TEAM_SLUG = 'penn-mens-golf'

// The map reads enrichments + memberships fresh on every request — alumni
// expect to see their own update reflected immediately after they save.
export const dynamic = 'force-dynamic'
export const revalidate = 0

function blankState(code: string): MapState {
  return {
    stateCode: code,
    stateName: CODE_TO_NAME[code] ?? code,
    totalCount: 0,
    currentPlayerCount: 0,
    alumniCount: 0,
    openToCoffeeCount: 0,
    openToGolfCount: 0,
    members: [],
  }
}

function placeMember(
  byState: Map<string, MapState>,
  code: string,
  member: MapMember,
) {
  let s = byState.get(code)
  if (!s) {
    s = blankState(code)
    byState.set(code, s)
  }
  s.members.push(member)
  s.totalCount++
  if (member.memberRole === 'current_player') s.currentPlayerCount++
  else s.alumniCount++
  if (member.openToCoffee) s.openToCoffeeCount++
  if (member.openToGolfRounds) s.openToGolfCount++
}

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, '')
}

export default async function MemberMapPage() {
  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug(TEAM_SLUG)

  // Two parallel datasets — one keyed by hometown, one keyed by current city/state.
  const hometownByState = new Map<string, MapState>()
  const currentByState = new Map<string, MapState>()
  const seenTeamStoreNames = new Set<string>()

  if (team) {
    const enrichMap = new Map(
      store.personEnrichments
        .filter((e) => e.teamId === team.id)
        .map((e) => [e.personId, e]),
    )

    // Current players — hometown lens shows them; current-location lens skips
    // them (their current location is just Penn).
    for (const m of store.teamMemberships.filter(
      (x) => x.teamId === team.id && x.memberRole === 'current_player',
    )) {
      const person = store.people.find((p) => p.id === m.personId)
      if (!person) continue
      const enrichment = enrichMap.get(m.personId)
      if (enrichment?.visibleToPlayers === false) continue
      seenTeamStoreNames.add(normalize(person.canonicalName))
      const hometownCode = hometownToStateCode(m.hometown)
      if (!hometownCode) continue
      placeMember(hometownByState, hometownCode, {
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

    // Published alumni — go in BOTH lenses; current-location only if they have
    // an enrichment state explicitly set (i.e., they've told us where they
    // live now).
    for (const m of store.teamMemberships.filter(
      (x) =>
        x.teamId === team.id &&
        x.memberRole === 'alumni' &&
        x.publishedToNetwork === true,
    )) {
      const person = store.people.find((p) => p.id === m.personId)
      if (!person) continue
      const enrichment = enrichMap.get(m.personId)
      if (enrichment?.visibleToPlayers === false) continue
      seenTeamStoreNames.add(normalize(person.canonicalName))

      const hometownCode = hometownToStateCode(m.hometown)

      const base: MapMember = {
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
      }

      if (hometownCode) placeMember(hometownByState, hometownCode, base)

      // Current-location lens: primary + each additional location. A member
      // who lives in NY + winters in FL appears in both states.
      const placedCurrentCodes = new Set<string>()
      const placeCurrent = (rawState: string | undefined, locLabel?: string) => {
        const code = enrichmentStateToCode(rawState)
        if (!code || placedCurrentCodes.has(code)) return
        placedCurrentCodes.add(code)
        placeMember(currentByState, code, { ...base, locationLabel: locLabel })
      }
      placeCurrent(enrichment?.state)
      for (const loc of enrichment?.additionalLocations ?? []) {
        placeCurrent(loc.state, loc.label)
      }
    }
  }

  // Member Book players — hometown lens only (no current-location data yet).
  for (const entry of memberBookEntries) {
    if (!isPublicMember(entry)) continue
    if (isActiveMember(entry)) continue
    if (seenTeamStoreNames.has(normalize(entry.displayName))) continue
    const hometownCode = hometownToStateCode(entry.profile.hometown ?? undefined)
    if (!hometownCode) continue
    const start = getMemberStartYear(entry)
    const end = getMemberEndYear(entry)
    placeMember(hometownByState, hometownCode, {
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
  }

  const hometownStates = Array.from(hometownByState.values()).sort(
    (a, b) => b.totalCount - a.totalCount,
  )
  const currentStates = Array.from(currentByState.values()).sort(
    (a, b) => b.totalCount - a.totalCount,
  )

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
            Where Penn Golf players and alumni come from, and where they are now.
          </p>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-10">
        <MemberMapClient
          hometownStates={hometownStates}
          currentStates={currentStates}
        />
      </div>
    </div>
  )
}
