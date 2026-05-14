import { NextResponse } from 'next/server'
import { getTeamBySlug, readStore } from '@/lib/store/local-store'
import { PLACE_COORDS } from '@/lib/map/hometown-coordinates'
import type { PlaceCoords } from '@/lib/map/hometown-coordinates'

export interface MapMember {
  personId: string
  canonicalName: string
  memberRole: 'current_player' | 'alumni'
  classLabel?: string
  classYearEstimate?: string
  rosterStartYear?: number
  rosterEndYear?: number
  hometown?: string
  openToCoffee: boolean
  openToGolfRounds: boolean
}

export interface MapPlace {
  id: string
  label: string
  region: PlaceCoords['region']
  x: number
  y: number
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

  const placeMap = new Map<string, MapPlace>()

  function addMember(hometown: string, member: MapMember) {
    const coords = PLACE_COORDS[hometown]
    if (!coords) return

    let place = placeMap.get(hometown)
    if (!place) {
      place = {
        id: hometown.replace(/[^a-z0-9]/gi, '-').toLowerCase(),
        label: hometown,
        region: coords.region,
        x: coords.x,
        y: coords.y,
        currentPlayerCount: 0,
        alumniCount: 0,
        openToCoffeeCount: 0,
        openToGolfCount: 0,
        members: [],
      }
      placeMap.set(hometown, place)
    }

    place.members.push(member)
    if (member.memberRole === 'current_player') place.currentPlayerCount++
    else place.alumniCount++
    if (member.openToCoffee) place.openToCoffeeCount++
    if (member.openToGolfRounds) place.openToGolfCount++
  }

  // Current players — use hometown from membership
  const currentMemberships = store.teamMemberships.filter(
    m => m.teamId === team.id && m.memberRole === 'current_player',
  )
  for (const m of currentMemberships) {
    const person = store.people.find(p => p.id === m.personId)
    if (!person) continue
    const enrichment = enrichMap.get(m.personId)
    if (enrichment?.visibleToPlayers === false) continue
    const hometown = m.hometown?.trim()
    if (!hometown) continue

    addMember(hometown, {
      personId: person.id,
      canonicalName: person.canonicalName,
      memberRole: 'current_player',
      classLabel: m.classLabel,
      classYearEstimate: m.classYearEstimate,
      rosterStartYear: m.rosterStartYear,
      rosterEndYear: m.rosterEndYear,
      hometown,
      openToCoffee: enrichment?.openToCoffee ?? false,
      openToGolfRounds: enrichment?.openToGolfRounds ?? false,
    })
  }

  // Published alumni — use enrichment city or membership hometown
  const alumniMemberships = store.teamMemberships.filter(
    m => m.teamId === team.id && m.memberRole === 'alumni' && m.publishedToNetwork === true,
  )
  for (const m of alumniMemberships) {
    const person = store.people.find(p => p.id === m.personId)
    if (!person) continue
    const enrichment = enrichMap.get(m.personId)
    if (enrichment?.visibleToPlayers === false) continue

    // Prefer enrichment city (where they live now), fall back to hometown
    const locationLabel = enrichment?.city?.trim()
      ? enrichment.state ? `${enrichment.city}, ${enrichment.state}` : enrichment.city.trim()
      : m.hometown?.trim()
    if (!locationLabel) continue

    addMember(locationLabel, {
      personId: person.id,
      canonicalName: person.canonicalName,
      memberRole: 'alumni',
      classLabel: m.classLabel,
      rosterStartYear: m.rosterStartYear,
      rosterEndYear: m.rosterEndYear,
      hometown: m.hometown,
      openToCoffee: enrichment?.openToCoffee ?? false,
      openToGolfRounds: enrichment?.openToGolfRounds ?? false,
    })
  }

  const places = Array.from(placeMap.values()).sort(
    (a, b) => (b.currentPlayerCount + b.alumniCount) - (a.currentPlayerCount + a.alumniCount),
  )

  return NextResponse.json({ places })
}
