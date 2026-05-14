import Link from 'next/link'
import MemberMapClient from './MemberMapClient'
import type { MapState, MapMember } from '@/app/api/member-map/route'
import { hometownToStateCode, enrichmentStateToCode, CODE_TO_NAME } from '@/lib/map/state-lookup'

const TEAM_SLUG = 'penn-mens-golf'

export default async function MemberMapPage() {
  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug(TEAM_SLUG)

  const stateMap = new Map<string, MapState>()

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
  }

  const states = Array.from(stateMap.values()).sort((a, b) => b.totalCount - a.totalCount)

  const totalMembers = states.reduce((s, st) => s + st.totalCount, 0)
  const currentPlayerCount = states.reduce((s, st) => s + st.currentPlayerCount, 0)

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
              <p className="text-xl font-semibold text-white">{states.length}</p>
              <p className="text-xs text-gray-400">States</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-8">
        {states.length === 0 ? (
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-10 text-center"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
          >
            <p className="text-sm text-[#8a7f70]">
              Member locations will appear here as profiles are updated.
            </p>
          </div>
        ) : (
          <MemberMapClient stateData={states} />
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
