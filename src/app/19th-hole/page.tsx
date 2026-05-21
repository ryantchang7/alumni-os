import NineteenthHoleClient from './NineteenthHoleClient'
import type { GatheringData } from '@/components/gatherings/GatheringCard'

export default async function NineteenthHolePage() {
  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug('penn-mens-golf')

  type AlumniEntry = {
    personId: string
    canonicalName: string
    city?: string
    classLabel?: string
    currentRole?: string
    currentCompany?: string
    openToCoffee?: boolean
  }

  let openToCoffee: AlumniEntry[] = []
  let cityGroups: { city: string; count: number; coffeeCount: number }[] = []
  let socialGatherings: GatheringData[] = []
  const interestedByGathering = new Map<string, number>()

  if (team) {
    for (const r of store.clubhouseGatheringRequests) {
      if (r.teamId !== team.id) continue
      if (r.status === 'declined' || r.status === 'closed') continue
      interestedByGathering.set(
        r.gatheringId,
        (interestedByGathering.get(r.gatheringId) ?? 0) + 1,
      )
    }

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
        if (!person) return null
        if (enrichment?.visibleToPlayers === false) return null
        return {
          personId: person.id,
          canonicalName: person.canonicalName,
          city: enrichment?.city,
          classLabel: m.classLabel,
          currentRole: enrichment?.currentRole,
          currentCompany: enrichment?.currentCompany,
          openToCoffee: enrichment?.openToCoffee,
        }
      })
      .filter((x): x is AlumniEntry => x !== null)

    openToCoffee = visible.filter(a => a.openToCoffee)

    const cityMap = new Map<string, { count: number; coffeeCount: number }>()
    for (const entry of visible) {
      const city = entry.city?.trim()
      if (!city) continue
      const cur = cityMap.get(city) ?? { count: 0, coffeeCount: 0 }
      cur.count++
      if (entry.openToCoffee) cur.coffeeCount++
      cityMap.set(city, cur)
    }
    cityGroups = Array.from(cityMap.entries())
      .filter(([, s]) => s.count >= 2)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([city, s]) => ({ city, ...s }))

    socialGatherings = store.clubhouseGatherings.filter(
      g =>
        g.teamId === team.id &&
        (g.type === 'coffee' || g.type === 'drinks' || g.type === 'dinner' || g.type === 'event') &&
        g.status !== 'closed',
    ) as GatheringData[]
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-12 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35 mb-4">
            Penn Men&rsquo;s Golf
          </p>
          <h1
            className="text-white text-3xl sm:text-4xl font-medium tracking-tight"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            The 19th Hole
          </h1>
          <p className="text-white/55 text-sm sm:text-base mt-3 max-w-xl">
            Coffee, dinners, and signature Penn Golf gatherings &mdash; wherever members find each other.
          </p>
        </div>
      </div>

      <NineteenthHoleClient
        gatherings={socialGatherings}
        openToCoffee={openToCoffee}
        cityGroups={cityGroups}
        interestedCounts={Object.fromEntries(interestedByGathering)}
      />
    </div>
  )
}
