import Link from 'next/link'

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Penn Golf · Events</p>
          <h1 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight">Gather</h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2 max-w-xl">
            Upcoming alumni events, outings, and team reunions.
          </p>
        </div>
      </div>
      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-16 text-center">
        <p className="text-[#8a7f70] text-sm mb-4">No events posted yet.</p>
        <Link href="/player" className="text-sm font-semibold text-[#990000] hover:underline">
          Back to Clubhouse &rarr;
        </Link>
      </div>
    </div>
  )
}
