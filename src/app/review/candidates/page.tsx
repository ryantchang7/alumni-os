import Link from 'next/link'
import { reviewItems } from '@/lib/mock-data'
import type { ReviewItemType } from '@/lib/types'
import ReviewItemCard from '@/components/ReviewItemCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const tabFilters: { value: string; label: string; type?: ReviewItemType }[] = [
  { value: 'all', label: 'All' },
  { value: 'low_confidence_match', label: 'Low Confidence', type: 'low_confidence_match' },
  { value: 'common_name_risk', label: 'Common Name', type: 'common_name_risk' },
  { value: 'missing_source', label: 'Missing Source', type: 'missing_source' },
  { value: 'duplicate_person', label: 'Duplicate', type: 'duplicate_person' },
  { value: 'contact_path_concern', label: 'Contact Path', type: 'contact_path_concern' },
]

const categoryCounts = {
  all: reviewItems.length,
  low_confidence_match: reviewItems.filter(i => i.type === 'low_confidence_match').length,
  common_name_risk: reviewItems.filter(i => i.type === 'common_name_risk').length,
  missing_source: reviewItems.filter(i => i.type === 'missing_source').length,
  duplicate_person: reviewItems.filter(i => i.type === 'duplicate_person').length,
  contact_path_concern: reviewItems.filter(i => i.type === 'contact_path_concern').length,
  possible_wrong_profile: reviewItems.filter(i => i.type === 'possible_wrong_profile').length,
}

export default function CandidatesReviewPage() {
  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Navy header */}
      <div className="bg-[#0a1628] px-8 pt-10 pb-10">
        <div className="max-w-[1320px] mx-auto">
          <Link
            href="/review"
            className="text-xs text-gray-400 hover:text-white transition-colors mb-3 block"
          >
            &larr; Review
          </Link>
          <h1 className="text-white text-2xl font-semibold tracking-tight">Candidate Review</h1>
          <p className="text-gray-400 text-sm mt-1 max-w-xl">
            Review low-confidence identity candidates before they enter the alumni graph.
          </p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-8 py-8">
        {/* Trust note */}
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-6">
          <p className="text-xs text-amber-800 leading-relaxed">
            Promoting a low-confidence match makes it visible in the alumni graph. Only approve when you
            are confident this is the right person. Source links are provided for your review.
          </p>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
          {Object.entries(categoryCounts).map(([key, count]) => {
            const labels: Record<string, string> = {
              all: 'Total',
              low_confidence_match: 'Low Conf.',
              common_name_risk: 'Common Name',
              missing_source: 'No Source',
              duplicate_person: 'Duplicate',
              contact_path_concern: 'Contact',
              possible_wrong_profile: 'Wrong Profile',
            }
            return (
              <div
                key={key}
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-3 text-center"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
              >
                <p className="text-xl font-semibold text-[#0a1628]">{count}</p>
                <p className="text-xs text-[#8a7f70] mt-0.5">{labels[key]}</p>
              </div>
            )
          })}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all">
          <TabsList className="mb-6 bg-white border border-[rgba(180,168,150,0.35)] h-auto p-1 flex-wrap gap-1">
            {tabFilters.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-xs px-3 py-1.5 data-[state=active]:bg-[#0a1628] data-[state=active]:text-white"
              >
                {tab.label}
                {(categoryCounts[tab.value as keyof typeof categoryCounts] ?? 0) > 0 && (
                  <span className="ml-1.5 text-[10px] bg-gray-200 data-[state=active]:bg-white/20 px-1.5 rounded-full">
                    {categoryCounts[tab.value as keyof typeof categoryCounts]}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all">
            {reviewItems.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {reviewItems.map(item => (
                  <ReviewItemCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-base font-semibold text-[#0a1628] mb-1">All items reviewed</p>
                <p className="text-sm text-[#8a7f70]">Alumni graph is clean.</p>
              </div>
            )}
          </TabsContent>

          {tabFilters.slice(1).map(tab => {
            const filtered = reviewItems.filter(i => i.type === tab.type)
            return (
              <TabsContent key={tab.value} value={tab.value}>
                {filtered.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {filtered.map(item => (
                      <ReviewItemCard key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-base font-semibold text-[#0a1628] mb-1">No items in this category</p>
                    <p className="text-sm text-[#8a7f70]">All items reviewed. Alumni graph is clean.</p>
                  </div>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    </div>
  )
}
