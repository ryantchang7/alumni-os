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
      {enrichment.favoriteCourses && (
        <p className="text-xs text-[#4a5568] mt-1.5 italic">&ldquo;{enrichment.favoriteCourses}&rdquo;</p>
      )}
      <span className="text-xs font-medium text-[#990000] group-hover:underline mt-3 block">
        View profile &rarr;
      </span>
    </Link>
  )
}

export default async function TheCoursePage() {
  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug('penn-mens-golf')

  let openToRounds: AlumniEntry[] = []
  let rounds: GatheringData[] = []

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

    openToRounds = visible.filter(a => a.enrichment.openToGolfRounds)

    rounds = store.clubhouseGatherings.filter(
      g => g.teamId === team.id && g.type === 'round' && g.status !== 'closed',
    ) as GatheringData[]
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Penn Golf · The Course</p>
          <h1 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight">The Course</h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2 max-w-xl">
            Find alumni who are open to a round. Golf travels well.
          </p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-10 space-y-14">

        {/* Organized Rounds */}
        {rounds.length > 0 && (
          <section data-testid="rounds-section">
            <h2 className="text-base font-semibold text-[#0a1628] mb-1">Upcoming Rounds</h2>
            <p className="text-sm text-[#8a7f70] mb-6">
              Organized alumni rounds open for members to join.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rounds.map(g => (
                <GatheringCard key={g.id} gathering={g} />
              ))}
            </div>
          </section>
        )}

        {/* Open to a Round — alumni */}
        <section>
          <div className="flex items-baseline gap-3 mb-1">
            <h2 className="text-base font-semibold text-[#0a1628]">Open to a Round</h2>
            {openToRounds.length > 0 && (
              <span className="text-xs font-medium text-[#2d6a4f] bg-[#2d6a4f]/10 px-2 py-0.5 rounded-full">
                {openToRounds.length} available
              </span>
            )}
          </div>
          <p className="text-sm text-[#8a7f70] mb-6">
            Alumni who have marked themselves open to hosting or joining a round.
          </p>
          {openToRounds.length === 0 ? (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 text-sm text-[#8a7f70]"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              No alumni have marked themselves open to hosting yet. Alumni can update this in their Clubhouse profile.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {openToRounds.map(entry => (
                <AlumniCard key={entry.person.id} entry={entry} />
              ))}
            </div>
          )}
        </section>

        {/* Alumni profile CTA */}
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          <div>
            <p className="font-semibold text-[#0a1628] text-sm">Are you a Penn Golf alum?</p>
            <p className="text-xs text-[#8a7f70] mt-0.5">
              Mark yourself open to hosting in your Alumni profile and players will find you here.
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
