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
          <h1 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight">Events</h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2 max-w-xl">
            Annual dinners, alumni reunions, and signature Penn Golf gatherings.
          </p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-10 space-y-14">

        {/* Upcoming Events */}
        <section data-testid="events-section">
          <h2 className="text-base font-semibold text-[#0a1628] mb-1">On the Calendar</h2>
          <p className="text-sm text-[#8a7f70] mb-6">
            Official Penn Golf events and alumni gatherings. Express interest to receive details.
          </p>
          {events.length === 0 ? (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-8"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <p className="text-sm font-medium text-[#0a1628] mb-1">No upcoming events scheduled</p>
              <p className="text-sm text-[#8a7f70]">
                Check back closer to the season. Penn Golf typically hosts an alumni weekend and end-of-year dinner.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {events.map(g => (
                <GatheringCard key={g.id} gathering={g} />
              ))}
            </div>
          )}
        </section>

        {/* What to expect */}
        <section>
          <h2 className="text-base font-semibold text-[#0a1628] mb-4">What to Expect</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                title: 'Alumni Weekend',
                description: 'Annual fall weekend with a round at Penn\'s home course and dinner with the current team.',
              },
              {
                title: 'End-of-Year Dinner',
                description: 'Celebration of the season open to all Penn Golf alumni in the Philadelphia area.',
              },
              {
                title: 'Regional Outings',
                description: 'Informal alumni-organized rounds and dinners in major cities throughout the year.',
              },
            ].map(item => (
              <div
                key={item.title}
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
              >
                <p className="font-semibold text-[#0a1628] text-sm mb-1">{item.title}</p>
                <p className="text-xs text-[#8a7f70] leading-snug">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Host a Gathering CTA */}
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          <div>
            <p className="font-semibold text-[#0a1628] text-sm">Interested in hosting?</p>
            <p className="text-xs text-[#8a7f70] mt-0.5">
              Alumni can propose dinners, outings, or city gatherings. Reach out through your alumni profile.
            </p>
          </div>
          <Link href="/alumni" className="text-sm font-semibold text-[#990000] hover:underline whitespace-nowrap">
            Go to Alumni Mode &rarr;
          </Link>
        </div>

      </div>
    </div>
  )
}
