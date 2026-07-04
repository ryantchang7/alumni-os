import Link from 'next/link'
import type { ReviewItem } from '@/lib/store/types'

interface Props {
  searchParams: Promise<{ teamSlug?: string }>
}

const priorityLabel: Record<ReviewItem['priority'], string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
}

const priorityClass: Record<ReviewItem['priority'], string> = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-amber-100 text-amber-800',
  high: 'bg-red-100 text-red-700',
}

const statusClass: Record<ReviewItem['status'], string> = {
  open: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
  resolved: 'bg-gray-100 text-gray-600',
}

const typeLabel: Record<ReviewItem['type'], string> = {
  low_confidence_extraction: 'Low Confidence',
  duplicate_candidate: 'Duplicate',
  missing_required_field: 'Missing Field',
  promotion_conflict: 'Promotion Conflict',
}

export default async function BuilderReviewPage({ searchParams }: Props) {
  const { teamSlug = 'penn-mens-golf' } = await searchParams

  const { getTeamBySlug, getReviewItemsForTeam } = await import('@/lib/store/local-store')
  const team = await getTeamBySlug(teamSlug)
  const reviewItems: ReviewItem[] = team ? await getReviewItemsForTeam(team.id) : []
  const openItems = reviewItems.filter(i => i.status === 'open')

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Navy header band */}
      <div className="bg-[#0a1628] py-10 px-8">
        <div className="max-w-[1320px] mx-auto">
          <Link
            href="/builder"
            className="text-xs text-gray-400 hover:text-white transition-colors mb-1 block"
          >
            ← Builder
          </Link>
          {teamSlug && (
            <Link
              href={`/builder/workspace?teamSlug=${teamSlug}`}
              className="text-xs text-gray-400 hover:text-white transition-colors mb-4 block"
            >
              ← Team Workspace
            </Link>
          )}
          <h1 className="text-white text-3xl font-semibold tracking-tight">Review Items</h1>
          <p className="text-gray-300 text-base mt-2 max-w-2xl leading-relaxed">
            {team
              ? `${teamSlug} — ${openItems.length} open item${openItems.length !== 1 ? 's' : ''} require human review before graph promotion.`
              : `Team "${teamSlug}" not found in store.`}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1320px] mx-auto px-8 py-10">
        {openItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-base font-semibold text-[#0a1628] mb-1">
              No open review items. The pipeline is clean.
            </p>
            <p className="text-sm text-ink-muted mb-6">
              All extracted entries have been processed or there are no entries yet.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href={`/builder/workspace?teamSlug=${teamSlug}`}
                className="text-sm font-medium text-[#990000] hover:underline"
              >
                Back to Workspace →
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div
              className="bg-[#fffdf9] border border-[rgba(180,168,150,0.35)] rounded-lg overflow-hidden mb-8"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f0ece5]">
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">
                      Title
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">
                      Priority
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(180,168,150,0.2)]">
                  {openItems.map(item => (
                    <tr key={item.id} className="hover:bg-[#f5f2ed] transition-colors">
                      <td className="px-4 py-3 text-ink-muted">
                        <span className="text-xs font-mono">{typeLabel[item.type]}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#0d1f3c]">{item.title}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${priorityClass[item.priority]}`}
                        >
                          {priorityLabel[item.priority]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusClass[item.status]}`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-[rgba(180,168,150,0.35)] pt-8 flex flex-wrap gap-3">
              <Link
                href={`/builder/workspace?teamSlug=${teamSlug}`}
                className="text-sm font-medium text-[#0a1628] border border-[#0a1628] hover:bg-[#0a1628] hover:text-white px-4 py-2.5 rounded-md transition-colors"
              >
                Back to Workspace →
              </Link>
              <Link
                href={`/builder/graph?teamSlug=${teamSlug}`}
                className="text-sm font-medium text-[#0a1628] border border-[#0a1628] hover:bg-[#0a1628] hover:text-white px-4 py-2.5 rounded-md transition-colors"
              >
                Open Graph →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
