import Link from 'next/link'
import { reviewItems } from '@/lib/mock-data'
import StatCard from '@/components/StatCard'
import ReviewItemCard from '@/components/ReviewItemCard'

export default function ReviewPage() {
  const highPriority = reviewItems.slice(0, 3)

  const confidenceBreakdown = [
    { label: 'High confidence', count: 31, total: 84 },
    { label: 'Medium confidence', count: 26, total: 84 },
    { label: 'Low confidence', count: 11, total: 84 },
    { label: 'Unverified', count: 16, total: 84 },
  ]

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Navy header */}
      <div className="bg-[#0a1628] px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Review Layer</p>
          <h1 className="text-white text-3xl font-semibold tracking-tight">
            Protect the trust layer.
          </h1>
          <p className="text-gray-300 text-base mt-2 max-w-xl">
            Review uncertain identities, source evidence, duplicate people, contact paths, and
            do-not-contact concerns before anything becomes visible.
          </p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-8">
        {/* Stat row */}
        <div className="-mt-5 relative z-10 mb-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Review Items" value={17} sublabel="need human review" accentColor="amber" />
          <StatCard label="Low Confidence" value={6} sublabel="identity matches" accentColor="amber" />
          <StatCard label="Approved" value={31} sublabel="verified profiles" accentColor="green" />
          <StatCard label="Pending Review" value={11} sublabel="awaiting decision" accentColor="amber" />
        </div>

        {/* High priority */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[#0a1628] tracking-tight mb-3">High Priority</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {highPriority.map(item => (
              <ReviewItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Confidence breakdown */}
        <div className="mb-8">
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-6"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
          >
            <h2 className="text-base font-semibold text-[#0a1628] tracking-tight mb-5">
              Confidence Breakdown
            </h2>
            <div className="space-y-4">
              {confidenceBreakdown.map(({ label, count, total }) => {
                const pct = Math.round((count / total) * 100)
                return (
                  <div key={label} className="flex items-center gap-4">
                    <span className="text-sm text-[#0a1628] w-36 flex-shrink-0">{label}</span>
                    <div className="flex-1 bg-[rgba(180,168,150,0.2)] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#0a1628] h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-[#0a1628] w-8 text-right flex-shrink-0">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* CTA bar */}
        <div className="border-t border-[rgba(180,168,150,0.35)] pt-6 pb-16 flex flex-wrap gap-3">
          <Link
            href="/review/candidates"
            className="bg-[#990000] hover:bg-[#b30000] text-white font-semibold px-5 py-2.5 rounded-md transition-colors text-sm"
          >
            Open Candidates &rarr;
          </Link>
          <Link
            href="/review/sources"
            className="border border-[#0a1628] text-[#0a1628] hover:bg-[#0a1628]/5 px-4 py-2 rounded-md transition-colors text-sm"
          >
            Open Sources &rarr;
          </Link>
          <Link
            href="/builder"
            className="border border-[#0a1628] text-[#0a1628] hover:bg-[#0a1628]/5 px-4 py-2 rounded-md transition-colors text-sm"
          >
            Back to Builder &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
