import Link from 'next/link'
import MemberMapClient from './MemberMapClient'
import { PLACE_COORDS } from '@/lib/map/hometown-coordinates'
import type { MapPlace } from '@/app/api/member-map/route'

const TEAM_SLUG = 'penn-mens-golf'

export default async function MemberMapPage() {
  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug(TEAM_SLUG)

  const placeMap = new Map<string, MapPlace>()

  if (team) {
    const enrichMap = new Map(
      store.personEnrichments.filter(e => e.teamId === team.id).map(e => [e.personId, e]),
    )

    function addMember(hometown: string, member: MapPlace['members'][number]) {
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

    // Current players
    for (const m of store.teamMemberships.filter(x => x.teamId === team.id && x.memberRole === 'current_player')) {
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

    // Published alumni
    for (const m of store.teamMemberships.filter(x => x.teamId === team.id && x.memberRole === 'alumni' && x.publishedToNetwork === true)) {
      const person = store.people.find(p => p.id === m.personId)
      if (!person) continue
      const enrichment = enrichMap.get(m.personId)
      if (enrichment?.visibleToPlayers === false) continue
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
  }

  const places = Array.from(placeMap.values()).sort(
    (a, b) => (b.currentPlayerCount + b.alumniCount) - (a.currentPlayerCount + a.alumniCount),
  )

  const totalMembers = places.reduce((s, p) => s + p.members.length, 0)
  const currentPlayerCount = places.reduce((s, p) => s + p.currentPlayerCount, 0)

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Penn Golf · Member Map</p>
          <h1 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight">Member Map</h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2 max-w-xl">
            See where Penn Golf players and alumni come from, live, and gather.
          </p>
          <div className="flex gap-6 mt-5">
            <div>
              <p className="text-xl font-semibold text-white">{totalMembers}</p>
              <p className="text-xs text-gray-400">Members mapped</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-white">{currentPlayerCount}</p>
              <p className="text-xs text-gray-400">Current players</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-white">{places.length}</p>
              <p className="text-xs text-gray-400">Places</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-8">
        {places.length === 0 ? (
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-10 text-center"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
          >
            <p className="text-sm text-[#8a7f70]">
              Member locations will appear here as profiles are updated.
            </p>
          </div>
        ) : (
          <MemberMapClient initialPlaces={places} />
        )}

        <div
          className="mt-10 bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          <div>
            <p className="font-semibold text-[#0a1628] text-sm">Are you a Penn Golf alum?</p>
            <p className="text-xs text-[#8a7f70] mt-0.5">Update your city so players can find alumni in their area.</p>
          </div>
          <Link
            href="/alumni"
            className="text-sm font-semibold text-[#990000] hover:underline whitespace-nowrap"
          >
            Update your city &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
