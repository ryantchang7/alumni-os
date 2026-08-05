import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

const trustRules = [
  'Public pages only, no login-gated scraping',
  'No LinkedIn scraping or profile fetching',
  'Human review required before publishing identities',
  'Contact paths only, no scraped emails or phone numbers',
]

const advancedTools = [
  { label: 'Workspace', href: '/builder/workspace?teamSlug=penn-mens-golf' },
  { label: 'Debug roster extractor', href: '/builder/debug-roster?teamSlug=penn-mens-golf' },
  { label: 'Add rows to graph', href: '/builder/promote?teamSlug=penn-mens-golf' },
  { label: 'Historical import', href: '/builder/history?teamSlug=penn-mens-golf' },
  { label: 'People & sources', href: '/builder/people?teamSlug=penn-mens-golf' },
  { label: 'Verified profile details', href: '/builder/enrich?teamSlug=penn-mens-golf' },
  { label: 'Data health', href: '/builder/quality?teamSlug=penn-mens-golf' },
  { label: 'Graph output', href: '/builder/graph?teamSlug=penn-mens-golf' },
]

export default function BuilderPage() {
  return (
    <div className="min-h-screen bg-[#fbf9f6]">
      {/* Navy header */}
      <div className="bg-[#0a1628] px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Builder</p>
          <h1 className="text-white text-3xl font-semibold tracking-tight">
            Build a verified alumni graph.
          </h1>
          <p className="text-gray-300 text-base mt-2 max-w-2xl leading-relaxed">
            Give the Clubhouse a team roster link. The agent extracts roster data, shows its evidence, and asks before adding anything to the alumni graph.
          </p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-8">
        {/* PRIMARY, Agent card */}
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] border-l-4 border-l-[#990000] rounded-xl p-6 -mt-5 relative z-10 mb-8"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#0a1628] mb-1">Roster Agent</p>
              <p className="text-sm text-ink-muted max-w-lg">
                Start with one roster link. The agent extracts rows, asks for approval, and builds a verified alumni graph.
              </p>
            </div>
            <Link
              href="/builder/agent?teamSlug=penn-mens-golf"
              className="text-sm font-semibold text-white bg-[#990000] hover:bg-[#b30000] px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              Open Agent &rarr;
            </Link>
          </div>
        </div>

        {/* Captain Review card */}
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 mb-6"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#0a1628] mb-1">Captain Review</p>
              <p className="text-sm text-ink-muted max-w-lg">
                Review alumni in the graph and publish verified profiles to the Player Network. Only published profiles are visible to players.
              </p>
            </div>
            <Link
              href="/builder/captain-review?teamSlug=penn-mens-golf"
              className="text-sm font-medium text-[#0a1628] border border-[#0a1628] hover:bg-[#0a1628] hover:text-white px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              Open Captain Review &rarr;
            </Link>
          </div>
        </div>

        {/* Player Network preview card */}
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 mb-8"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-[#0a1628] mb-1">Player Network</p>
              <p className="text-sm text-ink-muted">
                The player-facing alumni network. Only published, captain-approved profiles appear here.
              </p>
            </div>
            <Link
              href="/network/search?teamSlug=penn-mens-golf"
              className="text-sm font-medium border border-gray-300 hover:border-[#0a1628] text-ink-muted hover:text-[#0a1628] px-4 py-2 rounded-md transition-colors whitespace-nowrap"
            >
              Preview Network &rarr;
            </Link>
          </div>
        </div>

        {/* Trust rules */}
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 mb-8"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          <p className="text-sm font-semibold text-[#0a1628] uppercase tracking-wider mb-4">Trust rules</p>
          <div className="space-y-3">
            {trustRules.map(rule => (
              <div key={rule} className="flex gap-2 items-start">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-ink-muted">{rule}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Advanced tools */}
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 mb-12"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          <p className="text-sm font-semibold text-[#0a1628] uppercase tracking-wider mb-4">Advanced tools</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {advancedTools.map(tool => (
              <Link
                key={tool.href}
                href={tool.href}
                className="text-xs font-medium text-[#0a1628] border border-gray-200 rounded-lg px-3 py-2 hover:border-[#0a1628] hover:bg-[#0a1628] hover:text-white transition-colors text-center"
              >
                {tool.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
