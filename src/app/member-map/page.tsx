import Link from 'next/link'
import type { TeamMembership, PersonEnrichment } from '@/lib/store/types'

interface CityCard {
  city: string
  count: number
  coffeeCount: number
  golfCount: number
}

export default async function MemberMapPage() {
  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug('penn-mens-golf')

  let cityCards: CityCard[] = []
  let unknownCityCount = 0
  let totalMembers = 0

  if (team) {
    const memberships = store.teamMemberships.filter(
      m => m.teamId === team.id && m.memberRole === 'alumni' && m.publishedToNetwork === true,
    )
    const enrichments = store.personEnrichments.filter(e => e.teamId === team.id)
    const enrichMap = new Map(enrichments.map(e => [e.personId, e]))

    const visibleMemberships = memberships.filter(
      m => enrichMap.get(m.personId)?.visibleToPlayers !== false,
    )

    totalMembers = visibleMemberships.length

    const cityMap = new Map<string, { memberships: TeamMembership[]; enrichments: PersonEnrichment[] }>()
    let noCity = 0

    for (const m of visibleMemberships) {
      const enrichment = enrichMap.get(m.personId)
      const city = enrichment?.city?.trim() || ''
      if (!city) {
        noCity++
        continue
      }
      const existing = cityMap.get(city) ?? { memberships: [], enrichments: [] }
      existing.memberships.push(m)
      if (enrichment) existing.enrichments.push(enrichment)
      cityMap.set(city, existing)
    }

    unknownCityCount = noCity

    cityCards = Array.from(cityMap.entries())
      .map(([city, data]) => ({
        city,
        count: data.memberships.length,
        coffeeCount: data.enrichments.filter(e => e.openToCoffee).length,
        golfCount: data.enrichments.filter(e => e.openToGolfRounds).length,
      }))
      .sort((a, b) => b.count - a.count)
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Penn Golf · Member Map</p>
          <h1 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight">Member Map</h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2 max-w-xl">
            Where Penn Golf alumni are in the world.
          </p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-10 space-y-14">

        {/* Stats bar */}
        {totalMembers > 0 && (
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-2xl font-semibold text-[#0a1628]">{totalMembers}</p>
              <p className="text-xs text-[#8a7f70] mt-0.5">Published members</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-[#0a1628]">{cityCards.length}</p>
              <p className="text-xs text-[#8a7f70] mt-0.5">Cities represented</p>
            </div>
            {unknownCityCount > 0 && (
              <div>
                <p className="text-2xl font-semibold text-[#8a7f70]">{unknownCityCount}</p>
                <p className="text-xs text-[#8a7f70] mt-0.5">Location not shared</p>
              </div>
            )}
          </div>
        )}

        {/* City grid */}
        <section>
          <h2 className="text-base font-semibold text-[#0a1628] mb-1">Alumni by City</h2>
          <p className="text-sm text-[#8a7f70] mb-6">Every city where Penn Golf alumni have set their location.</p>

          {cityCards.length === 0 ? (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-8 text-center"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <p className="text-sm text-[#8a7f70]">
                Alumni locations will appear here as members update their profiles.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cityCards.map(card => (
                <Link
                  key={card.city}
                  href={`/player/search?city=${encodeURIComponent(card.city)}`}
                  className="block bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5 hover:shadow-md transition-shadow group"
                  style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
                >
                  <p className="font-semibold text-[#0a1628] text-sm mb-1">{card.city}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                    <p className="text-xs text-[#8a7f70]">
                      {card.count} {card.count === 1 ? 'member' : 'members'}
                    </p>
                    {card.coffeeCount > 0 && (
                      <p className="text-xs text-[#2d6a4f]">{card.coffeeCount} open to coffee</p>
                    )}
                    {card.golfCount > 0 && (
                      <p className="text-xs text-[#2d6a4f]">{card.golfCount} open to a round</p>
                    )}
                  </div>
                  <span className="text-xs font-medium text-[#990000] group-hover:underline mt-3 block">
                    View members in {card.city} &rarr;
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Unknown location note */}
        {unknownCityCount > 0 && (
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
          >
            <p className="text-sm text-[#8a7f70]">
              <span className="font-medium text-[#4a5568]">{unknownCityCount}</span>{' '}
              {unknownCityCount === 1 ? 'member has' : 'members have'} not shared their location yet.
            </p>
          </div>
        )}

        {/* CTA */}
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
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
