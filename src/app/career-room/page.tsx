import Link from 'next/link'
import type { Person, TeamMembership, PersonEnrichment } from '@/lib/store/types'

interface AlumniEntry {
  person: Person
  membership: TeamMembership
  enrichment: PersonEnrichment
}

const INDUSTRIES = [
  { label: 'Finance & Investing', slug: 'finance', initial: 'F' },
  { label: 'Consulting', slug: 'consulting', initial: 'C' },
  { label: 'Real Estate', slug: 'real-estate', initial: 'R' },
  { label: 'Law', slug: 'law', initial: 'L' },
  { label: 'Technology', slug: 'technology', initial: 'T' },
  { label: 'Startups & Founders', slug: 'startups', initial: 'S' },
  { label: 'Sports / Golf Industry', slug: 'sports', initial: 'G' },
  { label: 'Medicine', slug: 'medicine', initial: 'M' },
  { label: 'Media & Entertainment', slug: 'media', initial: 'E' },
  { label: 'Public Service', slug: 'public-service', initial: 'P' },
]

function AlumniCard({ entry }: { entry: AlumniEntry }) {
  const { person, membership, enrichment } = entry
  return (
    <Link
      href={`/player/alumni/${person.id}?teamSlug=penn-mens-golf`}
      className="block bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-4 hover:shadow-md transition-shadow group"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
    >
      <p className="font-semibold text-[#0a1628] text-sm">{person.canonicalName}</p>
      {(enrichment.currentRole || enrichment.currentCompany) && (
        <p className="text-xs text-[#4a5568] mt-0.5">
          {enrichment.currentRole && enrichment.currentCompany
            ? `${enrichment.currentRole} at ${enrichment.currentCompany}`
            : enrichment.currentRole ?? enrichment.currentCompany}
        </p>
      )}
      {enrichment.city && (
        <p className="text-xs text-[#8a7f70] mt-0.5">{enrichment.city}</p>
      )}
      {membership.classLabel && (
        <p className="text-xs text-[#8a7f70]">{membership.classLabel}</p>
      )}
      <span className="text-xs font-medium text-[#990000] group-hover:underline mt-3 block">
        View profile &rarr;
      </span>
    </Link>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 text-sm text-[#8a7f70]"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}>
      {label}
    </div>
  )
}

export default async function CareerRoomPage() {
  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug('penn-mens-golf')

  let alumni: AlumniEntry[] = []

  if (team) {
    const memberships = store.teamMemberships.filter(
      m => m.teamId === team.id && m.memberRole === 'alumni' && m.publishedToNetwork === true,
    )
    const enrichments = store.personEnrichments.filter(e => e.teamId === team.id)
    const enrichMap = new Map(enrichments.map(e => [e.personId, e]))

    alumni = memberships
      .map(m => {
        const person = store.people.find(p => p.id === m.personId)
        const enrichment = enrichMap.get(m.personId)
        if (!person || !enrichment) return null
        if (enrichment.visibleToPlayers === false) return null
        return { person, membership: m, enrichment }
      })
      .filter((x): x is AlumniEntry => x !== null)
  }

  const openToMentorship = alumni.filter(a => a.enrichment.openToMentorship)
  const openToIntros = alumni.filter(a => a.enrichment.openToWarmIntroductions)
  const openToCoffee = alumni.filter(a => a.enrichment.openToCoffee)

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Penn Golf · Career Room</p>
          <h1 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight">Career Room</h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2 max-w-xl">
            Advice, introductions, and career paths from Penn Golf alumni.
          </p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-10 space-y-14">

        {/* Explore by Industry */}
        <section>
          <h2 className="text-base font-semibold text-[#0a1628] mb-1">Explore by Industry</h2>
          <p className="text-sm text-[#8a7f70] mb-6">Browse alumni by their field.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {INDUSTRIES.map(ind => (
              <Link
                key={ind.slug}
                href={`/player/search?industry=${ind.slug}`}
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-4 flex flex-col gap-2 hover:shadow-md transition-shadow group"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
              >
                <span className="w-8 h-8 rounded-lg bg-[#0a1628] text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
                  {ind.initial}
                </span>
                <p className="text-xs font-medium text-[#0a1628] leading-snug">{ind.label}</p>
                <span className="text-xs text-[#990000] group-hover:underline mt-auto">Browse &rarr;</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Open to Mentorship */}
        <section>
          <div className="flex items-baseline gap-3 mb-1">
            <h2 className="text-base font-semibold text-[#0a1628]">Open to Mentorship</h2>
            {openToMentorship.length > 0 && (
              <span className="text-xs font-medium text-[#2d6a4f] bg-[#2d6a4f]/10 px-2 py-0.5 rounded-full">
                {openToMentorship.length} available
              </span>
            )}
          </div>
          <p className="text-sm text-[#8a7f70] mb-6">
            Alumni who have offered to mentor current players.
          </p>
          {openToMentorship.length === 0 ? (
            <EmptyState label="Alumni will appear here once they have set up their profile." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {openToMentorship.map(entry => (
                <AlumniCard key={entry.person.id} entry={entry} />
              ))}
            </div>
          )}
        </section>

        {/* Open to Warm Introductions */}
        <section>
          <div className="flex items-baseline gap-3 mb-1">
            <h2 className="text-base font-semibold text-[#0a1628]">Open to Warm Introductions</h2>
            {openToIntros.length > 0 && (
              <span className="text-xs font-medium text-[#2d6a4f] bg-[#2d6a4f]/10 px-2 py-0.5 rounded-full">
                {openToIntros.length} available
              </span>
            )}
          </div>
          <p className="text-sm text-[#8a7f70] mb-6">
            Alumni who can connect you with someone in their network.
          </p>
          {openToIntros.length === 0 ? (
            <EmptyState label="Alumni will appear here once they have set up their profile." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {openToIntros.map(entry => (
                <AlumniCard key={entry.person.id} entry={entry} />
              ))}
            </div>
          )}
        </section>

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
          <p className="text-sm text-[#8a7f70] mb-6">
            Alumni open to an informal chat over coffee.
          </p>
          {openToCoffee.length === 0 ? (
            <EmptyState label="Alumni will appear here once they have set up their profile." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {openToCoffee.map(entry => (
                <AlumniCard key={entry.person.id} entry={entry} />
              ))}
            </div>
          )}
        </section>

        {/* Recruiting Playbooks */}
        <section>
          <h2 className="text-base font-semibold text-[#0a1628] mb-1">Recruiting Playbooks</h2>
          <p className="text-sm text-[#8a7f70] mb-6">Notes from alumni on how they navigated recruiting.</p>
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
          >
            <p className="text-sm text-[#8a7f70]">
              Recruiting notes will appear here as alumni contribute them. Check back before recruiting season.
            </p>
          </div>
        </section>

        {/* CTA */}
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          <div>
            <p className="font-semibold text-[#0a1628] text-sm">Looking for someone in a specific field?</p>
            <p className="text-xs text-[#8a7f70] mt-0.5">Browse all published alumni in the Member Book.</p>
          </div>
          <Link
            href="/player/search"
            className="text-sm font-semibold text-[#990000] hover:underline whitespace-nowrap"
          >
            Browse Alumni &rarr;
          </Link>
        </div>

      </div>
    </div>
  )
}
