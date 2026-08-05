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
import SectionEmblemHeader from '@/components/SectionEmblemHeader'

import type { Metadata } from 'next'
import { getApprovalState } from '@/lib/access/approval'

export const metadata: Metadata = {
  title: 'Member Map',
  description: 'Where the Penn Golf family lives, the member map.',
}

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
    parentCount: 0,
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
  else if (member.memberRole === 'parent') s.parentCount++
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

  // Three parallel datasets:
  //   hometownByState — players + alumni + coach keyed by hometown
  //   currentByState  — same population keyed by current city/state
  //   familyByState   — parents/affiliates only, current-location only
  // Family lives in its own aggregate so the /member-map Family subtab
  // can show a dedicated map without mixing into the main one.
  const hometownByState = new Map<string, MapState>()
  const currentByState = new Map<string, MapState>()
  const familyByState = new Map<string, MapState>()
  const seenTeamStoreNames = new Set<string>()

  if (team) {
    const enrichMap = new Map(
      store.personEnrichments
        .filter((e) => e.teamId === team.id)
        .map((e) => [e.personId, e]),
    )

    // Current players — hometown lens uses membership.hometown. Current-
    // location lens uses enrichment.state + additionalLocations (e.g. a
    // current player based in Philly with a Boston home shows in both).
    for (const m of store.teamMemberships.filter(
      (x) => x.teamId === team.id && x.memberRole === 'current_player',
    )) {
      const person = store.people.find((p) => p.id === m.personId)
      if (!person) continue
      const enrichment = enrichMap.get(m.personId)
      if (enrichment?.visibleToPlayers === false) continue
      seenTeamStoreNames.add(normalize(person.canonicalName))

      const base: MapMember = {
        personId: person.id,
        canonicalName: person.canonicalName,
        memberRole: 'current_player',
        classLabel: m.classLabel,
        classYearEstimate: m.classYearEstimate,
        rosterStartYear: m.rosterStartYear,
        rosterEndYear: m.rosterEndYear,
        hometown: m.hometown,
        city: enrichment?.city,
        state: enrichment?.state,
        openToCoffee: enrichment?.openToCoffee ?? false,
        openToGolfRounds: enrichment?.openToGolfRounds ?? false,
      }

      const hometownCode = hometownToStateCode(m.hometown)
      if (hometownCode) placeMember(hometownByState, hometownCode, base)

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

    // Published alumni + coaches — go in BOTH lenses; current-location only if
    // they have an enrichment state explicitly set (i.e., they've told us
    // where they live now). Coach is treated as an adult Penn Golf member for
    // location surfaces.
    for (const m of store.teamMemberships.filter(
      (x) =>
        x.teamId === team.id &&
        (x.memberRole === 'alumni' || x.memberRole === 'coach') &&
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

    // Published parents/affiliates — current-location lens only.
    // Parents have no "hometown" that maps to a Penn Golf place; we just
    // drop them where they live now (and any additional locations).
    for (const m of store.teamMemberships.filter(
      (x) =>
        x.teamId === team.id &&
        x.memberRole === 'parent' &&
        x.publishedToNetwork === true,
    )) {
      const person = store.people.find((p) => p.id === m.personId)
      if (!person) continue
      const enrichment = enrichMap.get(m.personId)
      if (enrichment?.visibleToPlayers === false) continue
      seenTeamStoreNames.add(normalize(person.canonicalName))

      const base: MapMember = {
        personId: person.id,
        canonicalName: person.canonicalName,
        memberRole: 'parent',
        city: enrichment?.city,
        state: enrichment?.state,
        openToCoffee: enrichment?.openToCoffee ?? false,
        openToGolfRounds: enrichment?.openToGolfRounds ?? false,
        parentRelationship: m.parentRelationship,
      }

      const placedCurrentCodes = new Set<string>()
      const placeCurrent = (rawState: string | undefined, locLabel?: string) => {
        const code = enrichmentStateToCode(rawState)
        if (!code || placedCurrentCodes.has(code)) return
        placedCurrentCodes.add(code)
        // Parents live in the dedicated family aggregate so the
        // /member-map "Family & Affiliate" subtab can render a
        // separate map without mixing with the alumni one.
        placeMember(familyByState, code, { ...base, locationLabel: locLabel })
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

  // Approved members see WHO is where. Everyone else still sees the map and
  // the counts (that's the public story — 'we're everywhere'), but every
  // identifying field is stripped: no names, photos, hometowns, or ids.
  const approval = await getApprovalState()
  const scrub = <T extends { members: MapMember[] }>(rows: T[]): T[] =>
    approval.approved
      ? rows
      : rows.map(r => ({
          ...r,
          members: r.members.map(m => ({
            personId: '',
            canonicalName: '',
            memberRole: m.memberRole,
            rosterStartYear: m.rosterStartYear,
            rosterEndYear: m.rosterEndYear,
            openToCoffee: m.openToCoffee,
            openToGolfRounds: m.openToGolfRounds,
            state: m.state,
          })),
        }))
  const hometownStates = Array.from(hometownByState.values()).sort(
    (a, b) => b.totalCount - a.totalCount,
  )
  const currentStates = Array.from(currentByState.values()).sort(
    (a, b) => b.totalCount - a.totalCount,
  )
  const familyStates = Array.from(familyByState.values()).sort(
    (a, b) => b.totalCount - a.totalCount,
  )

  return (
    <div className="min-h-screen bg-[#fbf9f6]">
      <SectionEmblemHeader
        eyebrow="Penn Men's Golf"
        title="The Member Map"
        subtitle="Where Penn Golf players and alumni come from, and where they are now."
        emblemSrc="/emblems/member-map.png"
        emblemAlt="Penn Golf member map emblem"
        maxWidth="1280px"
      />

      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-10">
        <MemberMapClient
          approved={approval.approved}
          hometownStates={scrub(hometownStates)}
          currentStates={scrub(currentStates)}
          familyStates={scrub(familyStates)}
        />
      </div>
    </div>
  )
}
