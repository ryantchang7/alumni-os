import Link from 'next/link'
import GatheringCard, { type GatheringData } from '@/components/gatherings/GatheringCard'

export default async function EventsPage() {
  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug('penn-mens-golf')

  let events: GatheringData[] = []

  if (team) {
    events = store.clubhouseGatherings.filter(
      g => g.teamId === team.id && g.type === 'event' && g.status !== 'closed',
    ) as GatheringData[]
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Penn Golf · Events</p>
          <h1 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight">Gather</h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2 max-w-xl">
            Penn Golf alumni events, outings, and reunions.
          </p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-10 space-y-14">

        {/* Upcoming Events */}
        <section data-testid="events-section">
          <h2 className="text-base font-semibold text-[#0a1628] mb-1">Coming Up</h2>
          <p className="text-sm text-[#8a7f70] mb-6">
            Organized alumni events and gatherings. Express interest to be looped in.
          </p>
          {events.length === 0 ? (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 text-sm text-[#8a7f70]"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              No upcoming events right now. Check back soon or reach out to the team.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {events.map(g => (
                <GatheringCard key={g.id} gathering={g} />
              ))}
            </div>
          )}
        </section>

        {/* Host a Gathering CTA */}
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          <div>
            <p className="font-semibold text-[#0a1628] text-sm">Want to host a gathering?</p>
            <p className="text-xs text-[#8a7f70] mt-0.5">
              Alumni can organize dinners, outings, or events in their city. Get in touch with the team.
            </p>
          </div>
          <Link href="/alumni" className="text-sm font-semibold text-[#990000] hover:underline whitespace-nowrap">
            Get in touch &rarr;
          </Link>
        </div>

      </div>
    </div>
  )
}
