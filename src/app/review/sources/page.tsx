import Link from 'next/link'
import {
  discoveredPages,
  rosterEntries,
  normalizedPeople,
  identityCandidates,
} from '@/lib/mock-data'
import DiscoveredPageTable from '@/components/DiscoveredPageTable'
import ExtractedRosterTable from '@/components/ExtractedRosterTable'
import NormalizedPeopleTable from '@/components/NormalizedPeopleTable'
import IdentityCandidateTable from '@/components/IdentityCandidateTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function SourcesReviewPage() {
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
          <h1 className="text-white text-2xl font-semibold tracking-tight">Source Review</h1>
          <p className="text-gray-400 text-sm mt-1 max-w-xl">
            Discovered pages, crawled pages, extraction data, and identity candidates.
          </p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-8 py-8">
        <Tabs defaultValue="discovered">
          <TabsList className="mb-6 bg-white border border-[rgba(180,168,150,0.35)] h-auto p-1 gap-1">
            <TabsTrigger
              value="discovered"
              className="text-xs px-3 py-1.5 data-[state=active]:bg-[#0a1628] data-[state=active]:text-white"
            >
              Discovered Pages
              <span className="ml-1.5 text-[10px] bg-gray-200 data-[state=active]:bg-white/20 px-1.5 rounded-full">
                {discoveredPages.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="roster"
              className="text-xs px-3 py-1.5 data-[state=active]:bg-[#0a1628] data-[state=active]:text-white"
            >
              Extracted Roster
              <span className="ml-1.5 text-[10px] bg-gray-200 data-[state=active]:bg-white/20 px-1.5 rounded-full">
                {rosterEntries.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="normalized"
              className="text-xs px-3 py-1.5 data-[state=active]:bg-[#0a1628] data-[state=active]:text-white"
            >
              Normalized People
              <span className="ml-1.5 text-[10px] bg-gray-200 data-[state=active]:bg-white/20 px-1.5 rounded-full">
                {normalizedPeople.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="candidates"
              className="text-xs px-3 py-1.5 data-[state=active]:bg-[#0a1628] data-[state=active]:text-white"
            >
              Identity Candidates
              <span className="ml-1.5 text-[10px] bg-gray-200 data-[state=active]:bg-white/20 px-1.5 rounded-full">
                {identityCandidates.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discovered">
            <DiscoveredPageTable pages={discoveredPages} />
          </TabsContent>

          <TabsContent value="roster">
            <ExtractedRosterTable entries={rosterEntries} />
          </TabsContent>

          <TabsContent value="normalized">
            <NormalizedPeopleTable people={normalizedPeople} />
          </TabsContent>

          <TabsContent value="candidates">
            <IdentityCandidateTable candidates={identityCandidates} />
          </TabsContent>
        </Tabs>

        {/* Trust note */}
        <p className="text-xs text-[#8a7f70] mt-6">
          All source data is from publicly accessible pages only. No login-gated scraping. No LinkedIn.
        </p>
      </div>
    </div>
  )
}
