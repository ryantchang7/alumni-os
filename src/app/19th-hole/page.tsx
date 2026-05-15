import Link from 'next/link'
import GatheringCard, { type GatheringData } from '@/components/gatherings/GatheringCard'
import type { Person, TeamMembership, PersonEnrichment } from '@/lib/store/types'

interface AlumniEntry {
  person: Person
  membership: TeamMembership
  enrichment: PersonEnrichment
}

function AlumniCard({ entry }: { entry: AlumniEntry }) {
  const { person, membership, enrichment } = entry
  return (
    <Link
      href={`/player/alumni/${person.id}?teamSlug=penn-mens-golf`}
      className="block bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-4 hover:shadow-md transition-shadow group"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
    >
      <p className="font-semibold text-[#0a1628] text-sm">{person.canonicalName}</p>
      {enrichment.city && <p className="text-xs text-[#8a7f70] mt-0.5">{enrichment.city}</p>}
      {membership.classLabel && <p className="text-xs text-[#8a7f70]">{membership.classLabel}</p>}
      {(enrichment.currentRole || enrichment.currentCompany) && (
        <p className="text-xs text-[#4a5568] mt-1">
          {enrichment.currentRole && enrichment.currentCompany
            ? `${enrichment.currentRole} at ${enrichment.currentCompany}`
            : enrichment.currentRole ?? enrichment.currentCompany}
        </p>
      )}
      <span className="text-xs font-medium text-[#990000] group-hover:underline mt-3 block">
        View profile &rarr;
      </span>
    </Link>
  )
}

export default async function NineteenthHolePage() {
  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug('penn-mens-golf')

  let openToCoffee: AlumniEntry[] = []
  let cityGroups: { city: string; members: AlumniEntry[] }[] = []
  let socialGatherings: GatheringData[] = []

  if (team) {
    const memberships = store.teamMemberships.filter(
      m => m.teamId === team.id && m.memberRole === 'alumni' && m.publishedToNetwork === true,
    )
    const enrichMap = new Map(
      store.personEnrichments.filter(e => e.teamId === team.id).map(e => [e.personId, e]),
    )

    const visible: AlumniEntry[] = memberships
      .map(m => {
        const person = store.people.find(p => p.id === m.personId)
        const enrichment = enrichMap.get(m.personId)
        if (!person || !enrichment) return null
        if (enrichment.visibleToPlayers === false) return null
        return { person, membership: m, enrichment }
      })
      .filter((x): x is AlumniEntry => x !== null)

    openToCoffee = visible.filter(a => a.enrichment.openToCoffee)

    const cityMap = new Map<string, AlumniEntry[]>()
    for (const entry of visible) {
      const city = entry.enrichment.city?.trim()
      if (!city) continue
      const arr = cityMap.get(city) ?? []
      arr.push(entry)
      cityMap.set(city, arr)
    }
    cityGroups = Array.from(cityMap.entries())
      .filter(([, members]) => members.length >= 2)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([city, members]) => ({ city, members }))

    socialGatherings = store.clubhouseGatherings.filter(
      g =>
        g.teamId === team.id &&
        (g.type === 'coffee' || g.type === 'drinks' || g.type === 'dinner') &&
        g.status !== 'closed',
    ) as GatheringData[]
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Penn Golf · 19th Hole</p>
          <h1 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight">19th Hole</h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2 max-w-xl">
            Coffee, drinks, and dinners for Penn Golf members wherever they are.
          </p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-10 space-y-14">

        {/* Upcoming Gatherings */}
        {socialGatherings.length > 0 && (
          <section data-testid="social-gatherings-section">
            <h2 className="text-base font-semibold text-[#0a1628] mb-1">Upcoming Gatherings</h2>
            <p className="text-sm text-[#8a7f70] mb-6">
              Coffee, drinks, and dinners organized by Penn Golf alumni.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {socialGatherings.map(g => (
                <GatheringCard key={g.id} gathering={g} />
              ))}
            </div>
          </section>
        )}

        {/* Open to Coffee */}
        <section>
          <div className="flex items-baseline gap-3 mb-1">
            <h2 className="text-base font-semibold text-[#0a1628]">Open to Coffee</h2>
            {openToCoffee.length > 0 && (
              <span className="text-xs font-medium text-[#2d6a4f] bg-[#2d6a4f]/10 px-2 py-0.5 rounded-full">
                {openToCoffee.length} available
              </span>
            )}
          </div>
          <p className="text-sm text-[#8a7f70] mb-6">Alumni who are open to an informal chat.</p>
          {openToCoffee.length === 0 ? (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 text-sm text-[#8a7f70]"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              No alumni have marked themselves open to coffee yet. Alumni can set this in their Clubhouse profile.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {openToCoffee.map(entry => (
                <AlumniCard key={entry.person.id} entry={entry} />
              ))}
            </div>
          )}
        </section>

        {/* Alumni by City */}
        {cityGroups.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-[#0a1628] mb-1">Alumni by City</h2>
            <p className="text-sm text-[#8a7f70] mb-6">Cities with two or more Penn Golf members.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cityGroups.map(({ city, members }) => {
                const coffeeCount = members.filter(m => m.enrichment.openToCoffee).length
                return (
                  <Link
                    key={city}
                    href={`/player/search?city=${encodeURIComponent(city)}`}
                    className="block bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5 hover:shadow-md transition-shadow group"
                    style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
                  >
                    <p className="font-semibold text-[#0a1628] text-sm">{city}</p>
                    <p className="text-xs text-[#8a7f70] mt-0.5">
                      {members.length} {members.length === 1 ? 'member' : 'members'}
                      {coffeeCount > 0 && ` · ${coffeeCount} open to coffee`}
                    </p>
                    <span className="text-xs font-medium text-[#990000] group-hover:underline mt-3 block">
                      View members &rarr;
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Alumni CTA */}
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          <div>
            <p className="font-semibold text-[#0a1628] text-sm">Alumni in Your City</p>
            <p className="text-xs text-[#8a7f70] mt-0.5">
              Let the team know you are open to meeting players or organizing a gathering.
            </p>
          </div>
          <Link href="/alumni" className="text-sm font-semibold text-[#990000] hover:underline whitespace-nowrap">
            Update your profile &rarr;
          </Link>
        </div>

      </div>
    </div>
  )
}
