import Link from 'next/link'

const EVENT_TYPES = [
  {
    title: 'Penn Golf Alumni Classic',
    description: 'Annual alumni tournament. Alumni return to play alongside one another and support the current program. Date TBD.',
    tag: 'Tournament',
  },
  {
    title: 'Alumni Weekend',
    description: 'Fall alumni weekend at Penn. An opportunity to reconnect with teammates and meet the current squad.',
    tag: 'Campus',
  },
  {
    title: 'Career Night',
    description: 'Connect with current players over careers, recruiting, and life after Penn Golf. Format and date TBD.',
    tag: 'Career',
  },
  {
    title: 'Regional Dinners',
    description: 'Alumni dinners in major cities — New York, Philadelphia, Boston, San Francisco, and more. Announced as planned.',
    tag: 'Gathering',
  },
]

export default function EventsPage() {
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

        {/* Coming Up */}
        <section>
          <h2 className="text-base font-semibold text-[#0a1628] mb-1">Coming Up</h2>
          <p className="text-sm text-[#8a7f70] mb-6">Events on the Penn Golf calendar. Dates announced as confirmed.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {EVENT_TYPES.map(event => (
              <div
                key={event.title}
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
              >
                <div className="border-l-4 border-[#0a1628] px-5 pt-5 pb-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="font-semibold text-[#0a1628] text-sm leading-snug">{event.title}</p>
                    <span className="text-[10px] font-semibold text-[#0a1628] bg-[#0a1628]/8 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                      {event.tag}
                    </span>
                  </div>
                  <p className="text-xs text-[#4a5568] leading-relaxed mb-4">{event.description}</p>
                  <button
                    type="button"
                    className="text-xs font-semibold text-[#8a7f70] border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-1.5 cursor-not-allowed"
                    disabled
                    aria-label="Notification signup coming soon"
                  >
                    Notify me when announced
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Past Events */}
        <section>
          <h2 className="text-base font-semibold text-[#0a1628] mb-1">Past Events</h2>
          <p className="text-sm text-[#8a7f70] mb-6">A record of past alumni gatherings.</p>
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 text-sm text-[#8a7f70]"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
          >
            Past event recaps will appear here. Check back after upcoming alumni events.
          </div>
        </section>

        {/* Host a Gathering */}
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          <div>
            <p className="font-semibold text-[#0a1628] text-sm">Host a Gathering</p>
            <p className="text-xs text-[#8a7f70] mt-0.5">
              Are you an alumnus interested in hosting a dinner or local event? Reach out to the team.
            </p>
          </div>
          <Link
            href="/alumni"
            className="text-sm font-semibold text-[#990000] hover:underline whitespace-nowrap"
          >
            Get in touch &rarr;
          </Link>
        </div>

      </div>
    </div>
  )
}
