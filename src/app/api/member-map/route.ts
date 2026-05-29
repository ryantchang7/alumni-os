import { NextResponse } from 'next/server'
import { getTeamBySlug, readStore } from '@/lib/store/local-store'
import { hometownToStateCode, enrichmentStateToCode, CODE_TO_NAME } from '@/lib/map/state-lookup'

export interface MapMember {
  personId: string
  canonicalName: string
  memberRole: 'current_player' | 'alumni' | 'coach' | 'parent'
  classLabel?: string
  classYearEstimate?: string
  rosterStartYear?: number
  rosterEndYear?: number
  hometown?: string
  city?: string
  state?: string
  openToCoffee: boolean
  openToGolfRounds: boolean
  bookId?: string
  // When the member appears on the "where they are now" lens because of
  // an additional location (e.g. "winters" in FL), this is the user's label.
  locationLabel?: string
  // Only present for parents/affiliates — surfaces "Parent of X" in the
  // per-state member list.
  parentRelationship?: string
}

export interface MapState {
  stateCode: string
  stateName: string
  totalCount: number
  currentPlayerCount: number
  alumniCount: number
  /** Parents + affiliates in this state. Surfaced separately so the
   *  per-state list can show them under their own subhead. */
  parentCount: number
  openToCoffeeCount: number
  openToGolfCount: number
  members: MapMember[]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const teamSlug = searchParams.get('teamSlug') ?? 'penn-mens-golf'

  const team = await getTeamBySlug(teamSlug)
  if (!team) return NextResponse.json({ error: `Team not found: ${teamSlug}` }, { status: 404 })

  const store = await readStore()
  const enrichMap = new Map(
    store.personEnrichments.filter(e => e.teamId === team.id).map(e => [e.personId, e]),
  )

  const stateMap = new Map<string, MapState>()

  function getOrCreate(code: string): MapState {
    let s = stateMap.get(code)
    if (!s) {
      s = {
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
      stateMap.set(code, s)
    }
    return s
  }

  function addMember(stateCode: string, member: MapMember) {
    const s = getOrCreate(stateCode)
    s.members.push(member)
    s.totalCount++
    if (member.memberRole === 'current_player') s.currentPlayerCount++
    else if (member.memberRole === 'parent') s.parentCount++
    else s.alumniCount++
    if (member.openToCoffee) s.openToCoffeeCount++
    if (member.openToGolfRounds) s.openToGolfCount++
  }

  // Current players — prefer enrichment state (e.g. Philadelphia while at
  // Penn), fall back to hometown. Then also surface them in each
  // additional location they've added. Mirrors the alumni logic so a
  // current player based in Philly with home in Boston shows in both.
  for (const m of store.teamMemberships.filter(x => x.teamId === team.id && x.memberRole === 'current_player')) {
    const person = store.people.find(p => p.id === m.personId)
    if (!person) continue
    const enrichment = enrichMap.get(m.personId)
    if (enrichment?.visibleToPlayers === false) continue

    const seenStates = new Set<string>()
    const primaryCode =
      enrichmentStateToCode(enrichment?.state) ?? hometownToStateCode(m.hometown)
    if (primaryCode) {
      addMember(primaryCode, {
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
      })
      seenStates.add(primaryCode)
    }

    if (Array.isArray(enrichment?.additionalLocations)) {
      for (const loc of enrichment.additionalLocations) {
        const code = enrichmentStateToCode(loc.state)
        if (!code || seenStates.has(code)) continue
        seenStates.add(code)
        addMember(code, {
          personId: person.id,
          canonicalName: person.canonicalName,
          memberRole: 'current_player',
          classLabel: m.classLabel,
          classYearEstimate: m.classYearEstimate,
          rosterStartYear: m.rosterStartYear,
          rosterEndYear: m.rosterEndYear,
          hometown: m.hometown,
          city: loc.city,
          state: loc.state,
          openToCoffee: enrichment?.openToCoffee ?? false,
          openToGolfRounds: enrichment?.openToGolfRounds ?? false,
          locationLabel: loc.label,
        })
      }
    }
  }

  // Published alumni — prefer enrichment state (current location), fall back to hometown.
  // Then also add them to each additional location (e.g. summer home, winter base).
  for (const m of store.teamMemberships.filter(x => x.teamId === team.id && (x.memberRole === 'alumni' || x.memberRole === 'coach') && x.publishedToNetwork === true)) {
    const person = store.people.find(p => p.id === m.personId)
    if (!person) continue
    const enrichment = enrichMap.get(m.personId)
    if (enrichment?.visibleToPlayers === false) continue

    // Track every state code we've already added this alum to, so two
    // additional-location rows in the same state don't double-count.
    const seenStates = new Set<string>()

    const primaryCode = enrichmentStateToCode(enrichment?.state) ?? hometownToStateCode(m.hometown)
    if (primaryCode) {
      addMember(primaryCode, {
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
      seenStates.add(primaryCode)
    }

    // Additional locations — surface the same alum in each state, with the
    // user's label ("Summer in Maine", "Winter base", etc.) so the marker
    // doesn't read as a contradiction.
    if (Array.isArray(enrichment?.additionalLocations)) {
      for (const loc of enrichment.additionalLocations) {
        const code = enrichmentStateToCode(loc.state)
        if (!code) continue
        if (seenStates.has(code)) continue
        seenStates.add(code)
        addMember(code, {
          personId: person.id,
          canonicalName: person.canonicalName,
          memberRole: 'alumni',
          classLabel: m.classLabel,
          rosterStartYear: m.rosterStartYear,
          rosterEndYear: m.rosterEndYear,
          hometown: m.hometown,
          city: loc.city,
          state: loc.state,
          openToCoffee: enrichment?.openToCoffee ?? false,
          openToGolfRounds: enrichment?.openToGolfRounds ?? false,
          locationLabel: loc.label,
        })
      }
    }
  }

  // Published parents/affiliates — drive purely by enrichment city/state
  // (parents have no hometown that means anything golf-wise). Skip if no
  // state on enrichment + no additional locations.
  for (const m of store.teamMemberships.filter(
    x => x.teamId === team.id && x.memberRole === 'parent' && x.publishedToNetwork === true,
  )) {
    const person = store.people.find(p => p.id === m.personId)
    if (!person) continue
    const enrichment = enrichMap.get(m.personId)
    if (enrichment?.visibleToPlayers === false) continue

    const seenStates = new Set<string>()
    const primaryCode = enrichmentStateToCode(enrichment?.state)
    if (primaryCode) {
      addMember(primaryCode, {
        personId: person.id,
        canonicalName: person.canonicalName,
        memberRole: 'parent',
        city: enrichment?.city,
        state: enrichment?.state,
        openToCoffee: enrichment?.openToCoffee ?? false,
        openToGolfRounds: enrichment?.openToGolfRounds ?? false,
        parentRelationship: m.parentRelationship,
      })
      seenStates.add(primaryCode)
    }

    if (Array.isArray(enrichment?.additionalLocations)) {
      for (const loc of enrichment.additionalLocations) {
        const code = enrichmentStateToCode(loc.state)
        if (!code || seenStates.has(code)) continue
        seenStates.add(code)
        addMember(code, {
          personId: person.id,
          canonicalName: person.canonicalName,
          memberRole: 'parent',
          city: loc.city,
          state: loc.state,
          openToCoffee: enrichment?.openToCoffee ?? false,
          openToGolfRounds: enrichment?.openToGolfRounds ?? false,
          parentRelationship: m.parentRelationship,
          locationLabel: loc.label,
        })
      }
    }
  }

  const states = Array.from(stateMap.values()).sort((a, b) => b.totalCount - a.totalCount)

  return NextResponse.json({ team, states })
}
