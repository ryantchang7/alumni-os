import { NextResponse } from 'next/server'
import { getTeamBySlug, readStore } from '@/lib/store/local-store'
import { hometownToStateCode, enrichmentStateToCode, CODE_TO_NAME } from '@/lib/map/state-lookup'

export interface MapMember {
  personId: string
  canonicalName: string
  memberRole: 'current_player' | 'alumni'
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
}

export interface MapState {
  stateCode: string
  stateName: string
  totalCount: number
  currentPlayerCount: number
  alumniCount: number
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

  // Current players — use membership hometown
  for (const m of store.teamMemberships.filter(x => x.teamId === team.id && x.memberRole === 'current_player')) {
    const person = store.people.find(p => p.id === m.personId)
    if (!person) continue
    const enrichment = enrichMap.get(m.personId)
    if (enrichment?.visibleToPlayers === false) continue

    const stateCode = hometownToStateCode(m.hometown)
    if (!stateCode) continue

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

  // Published alumni — prefer enrichment state (current location), fall back to hometown
  for (const m of store.teamMemberships.filter(x => x.teamId === team.id && x.memberRole === 'alumni' && x.publishedToNetwork === true)) {
    const person = store.people.find(p => p.id === m.personId)
    if (!person) continue
    const enrichment = enrichMap.get(m.personId)
    if (enrichment?.visibleToPlayers === false) continue

    const stateCode = enrichmentStateToCode(enrichment?.state) ?? hometownToStateCode(m.hometown)
    if (!stateCode) continue

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

  const states = Array.from(stateMap.values()).sort((a, b) => b.totalCount - a.totalCount)

  return NextResponse.json({ team, states })
}
