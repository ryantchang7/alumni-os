import Link from 'next/link'
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
      {enrichment.city && (
        <p className="text-xs text-[#8a7f70] mt-0.5">{enrichment.city}</p>
      )}
      {membership.classLabel && (
        <p className="text-xs text-[#8a7f70]">{membership.classLabel}</p>
      )}
      {enrichment.favoriteCourses && (
        <p className="text-xs text-[#4a5568] mt-1.5 italic">&ldquo;{enrichment.favoriteCourses}&rdquo;</p>
      )}
      <span className="text-xs font-medium text-[#990000] group-hover:underline mt-3 block">
        View profile &rarr;
      </span>
    </Link>
  )
}

function ComingSoonCard({ title, description }: { title: string; description: string }) {
  return (
    <div
      className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
    >
      <p className="font-semibold text-[#0a1628] text-sm mb-1">{title}</p>
      <p className="text-xs text-[#8a7f70]">{description}</p>
    </div>
  )
}

export default async function TheCoursePage() {
  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug('penn-mens-golf')

  let openToRounds: AlumniEntry[] = []
  let withFavoriteCourses: AlumniEntry[] = []

  if (team) {
    const memberships = store.teamMemberships.filter(
      m => m.teamId === team.id && m.memberRole === 'alumni' && m.publishedToNetwork === true,
    )
    const enrichments = store.personEnrichments.filter(e => e.teamId === team.id)
    const enrichMap = new Map(enrichments.map(e => [e.personId, e]))

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
    withFavoriteCourses = visible.filter(a => a.enrichment.favoriteCourses)
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

        {/* Open to a Round */}
        <section>
          <div className="flex items-baseline gap-3 mb-1">
            <h2 className="text-base font-semibold text-[#0a1628]">Open to a Round</h2>
            {openToRounds.length > 0 && (
              <span className="text-xs font-medium text-[#2d6a4f] bg-[#2d6a4f]/10 px-2 py-0.5 rounded-full">
                {openToRounds.length} available
              </span>
            )}
          </div>
          <p className="text-sm text-[#8a7f70] mb-6">Alumni who have marked themselves open to hosting a round.</p>
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

        {/* Favorite Courses */}
        <section>
          <h2 className="text-base font-semibold text-[#0a1628] mb-1">Favorite Courses</h2>
          <p className="text-sm text-[#8a7f70] mb-6">What alumni say about their home courses.</p>
          {withFavoriteCourses.length === 0 ? (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 text-sm text-[#8a7f70]"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              Favorite course picks will appear here once alumni share them.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {withFavoriteCourses.map(entry => (
                <AlumniCard key={entry.person.id} entry={entry} />
              ))}
            </div>
          )}
        </section>

        {/* Host a Round CTA */}
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
          <Link
            href="/alumni"
            className="text-sm font-semibold text-[#990000] hover:underline whitespace-nowrap"
          >
            Update your profile &rarr;
          </Link>
        </div>

        {/* Coming Soon cards */}
        <section>
          <h2 className="text-base font-semibold text-[#0a1628] mb-6">Coming Soon</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ComingSoonCard
              title="Playing Abroad"
              description="Alumni tips for playing courses overseas. Check back as members contribute."
            />
            <ComingSoonCard
              title="Penn Golf Clubs"
              description="Alumni-affiliated clubs and memberships. Coming once members share access."
            />
            <ComingSoonCard
              title="Travel Dates"
              description="Coordinate rounds when traveling. Feature in progress."
            />
          </div>
        </section>

      </div>
    </div>
  )
}
