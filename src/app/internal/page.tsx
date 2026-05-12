import Link from 'next/link'

const TEAM_SLUG = 'penn-mens-golf'

const tools = [
  {
    label: 'Agent',
    description: 'Run roster extraction and approve entries.',
    href: `/builder/agent?teamSlug=${TEAM_SLUG}`,
  },
  {
    label: 'Captain Review',
    description: 'Publish and unpublish profiles in the network.',
    href: `/builder/captain-review?teamSlug=${TEAM_SLUG}`,
  },
  {
    label: 'Workspace',
    description: 'Overview of scrape runs and graph state.',
    href: `/builder/workspace?teamSlug=${TEAM_SLUG}`,
  },
  {
    label: 'Debug Roster',
    description: 'Test roster extraction against a URL.',
    href: `/builder/debug-roster?teamSlug=${TEAM_SLUG}`,
  },
  {
    label: 'Promote',
    description: 'Manually promote extracted entries to the graph.',
    href: `/builder/promote?teamSlug=${TEAM_SLUG}`,
  },
  {
    label: 'People',
    description: 'View all people and their source records.',
    href: `/builder/people?teamSlug=${TEAM_SLUG}`,
  },
  {
    label: 'Enrichment',
    description: 'Add verified profile details.',
    href: `/builder/enrich?teamSlug=${TEAM_SLUG}`,
  },
  {
    label: 'Historical Import',
    description: 'Import historical season rosters.',
    href: `/builder/history?teamSlug=${TEAM_SLUG}`,
  },
  {
    label: 'Data Health',
    description: 'Graph quality and coverage report.',
    href: `/builder/quality?teamSlug=${TEAM_SLUG}`,
  },
  {
    label: 'Graph Output',
    description: 'Raw graph export and structure view.',
    href: `/builder/graph?teamSlug=${TEAM_SLUG}`,
  },
  {
    label: 'Review Queue',
    description: 'Open review items and conflicts.',
    href: `/review?teamSlug=${TEAM_SLUG}`,
  },
  {
    label: 'Discovery',
    description: 'Page discovery and crawl runs.',
    href: `/builder/discovery?teamSlug=${TEAM_SLUG}`,
  },
]

export default function InternalPage() {
  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Internal</p>
          <h1 className="text-white text-2xl font-semibold tracking-tight">Internal tools</h1>
          <p className="text-gray-400 text-sm mt-2">
            Builder, admin, and debug tools. Not visible to players or alumni.
          </p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-8">
        <div className="-mt-5 relative z-10 pb-16">
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tools.map(tool => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="block border border-[rgba(180,168,150,0.35)] rounded-lg p-4 hover:border-[#0a1628] hover:shadow-sm transition-all"
                >
                  <p className="font-semibold text-sm text-[#0a1628] mb-1">{tool.label}</p>
                  <p className="text-xs text-[#8a7f70]">{tool.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
