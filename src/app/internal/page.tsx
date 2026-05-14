import Link from 'next/link'

const TEAM_SLUG = 'penn-mens-golf'

const tools = [
  {
    label: 'Current Roster Editor',
    description: 'Edit the 2026–27 Penn Golf roster and player profile details.',
    href: '/internal/current-roster',
  },
  {
    label: 'Master List',
    description: 'View all members, roster status, and enrichment state.',
    href: '/internal/master-list',
  },
  {
    label: 'Build',
    description: 'Import historical rosters and publish alumni profiles.',
    href: '/build',
  },
  {
    label: 'Player Clubhouse',
    description: 'See the member book as a current player would.',
    href: `/player?teamSlug=${TEAM_SLUG}`,
  },
  {
    label: 'Alumni Mode',
    description: 'See the alumni-side profile and request inbox.',
    href: '/alumni',
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
            Access all three modes. Not visible to players or alumni from the main nav.
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
