import Link from 'next/link'

export default async function DashboardPage() {
  const { getTeamBySlug, getExtractedEntriesForTeam, getPeopleForTeam } =
    await import('@/lib/store/local-store')
  const { calculateGraphQuality } = await import('@/lib/store/graph-quality')

  const team = await getTeamBySlug('penn-mens-golf')

  if (!team) {
    return (
      <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-[#0a1628] mb-2">Team not found</h1>
          <p className="text-sm text-[#8a7f70] mb-6">
            No team with slug &quot;penn-mens-golf&quot; exists in the local store.
          </p>
          <Link href="/builder/new" className="text-sm font-medium text-[#990000] hover:underline">
            Create a team in the Builder
          </Link>
        </div>
      </div>
    )
  }

  const [entries, people, quality] = await Promise.all([
    getExtractedEntriesForTeam(team.id),
    getPeopleForTeam(team.id),
    calculateGraphQuality(team.id),
  ])

  const promotedCount = entries.filter(e => e.status === 'promoted').length
  const pendingCount = entries.filter(e => e.status === 'extracted').length
  const seasonYears = new Set(entries.map(e => e.seasonYear).filter((y): y is string => !!y))
  const seasonsCovered = seasonYears.size

  // Recommended next action — mirrors /api/demo/readiness logic
  let nextAction: { label: string; href: string; reason: string }
  if (pendingCount === 0 && people.length === 0) {
    nextAction = {
      label: 'Extract current roster',
      href: '/builder/debug-roster?teamSlug=penn-mens-golf',
      reason: 'No entries extracted yet. Start by extracting the current roster.',
    }
  } else if (pendingCount > 0 && people.length === 0) {
    nextAction = {
      label: 'Promote roster entries',
      href: '/builder/promote?teamSlug=penn-mens-golf',
      reason: `${pendingCount} extracted ${pendingCount === 1 ? 'entry' : 'entries'} waiting to be promoted to the alumni graph.`,
    }
  } else if (people.length > 0 && seasonsCovered <= 1) {
    nextAction = {
      label: 'Import historical seasons',
      href: '/builder/history?teamSlug=penn-mens-golf',
      reason: `Only ${seasonsCovered} season covered. Import historical rosters to build a complete graph.`,
    }
  } else if (people.length > 0 && quality.score < 60) {
    nextAction = {
      label: 'Review graph quality',
      href: `/builder/quality?teamSlug=penn-mens-golf`,
      reason: `Quality score is ${quality.score}. Address warnings to improve the graph.`,
    }
  } else {
    nextAction = {
      label: 'Open alumni graph',
      href: '/builder/graph?teamSlug=penn-mens-golf',
      reason: 'Graph is ready. View and manage your alumni data.',
    }
  }

  const stats = [
    { label: 'Extracted Entries', value: entries.length, sublabel: 'total from all runs' },
    { label: 'People Promoted', value: people.length, sublabel: 'in alumni graph' },
    { label: 'Seasons Covered', value: seasonsCovered, sublabel: 'with roster data' },
    { label: 'Graph Quality', value: `${quality.score}`, sublabel: quality.label },
  ]

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Navy header */}
      <div className="bg-[#0a1628] px-8 pt-8 pb-12">
        <div className="max-w-[1320px] mx-auto">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white leading-tight">
                Penn Golf Alumni OS
              </h1>
              <p className="text-sm text-gray-400 mt-2">
                {team.teamName} · {team.schoolName} · {team.sport}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Link
                href="/builder/workspace?teamSlug=penn-mens-golf"
                className="text-sm font-medium text-white border border-white/20 hover:bg-white/10 px-4 py-2 rounded-md transition-colors"
              >
                Open Builder
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row — overlaps navy with negative margin */}
      <div className="max-w-[1320px] mx-auto px-8 -mt-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(s => (
            <div
              key={s.label}
              className="bg-white rounded-lg p-4 border border-[rgba(180,168,150,0.35)]"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <p className="text-2xl font-semibold text-[#0a1628]">{s.value}</p>
              <p className="text-xs font-medium text-[#0a1628] mt-0.5">{s.label}</p>
              <p className="text-xs text-[#8a7f70] mt-0.5">{s.sublabel}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[1320px] mx-auto px-8 pt-10 pb-12">

        {/* Recommended next action */}
        <div className="bg-[#0a1628] rounded-lg p-5 flex items-start justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
              Recommended Next Step
            </p>
            <p className="text-white font-semibold text-sm">{nextAction.label}</p>
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">{nextAction.reason}</p>
          </div>
          <Link
            href={nextAction.href}
            className="flex-shrink-0 text-sm font-semibold text-white bg-[#990000] hover:bg-[#b30000] px-4 py-2 rounded-md transition-colors"
          >
            Go
          </Link>
        </div>

        {/* Workflow links */}
        <h2 className="text-sm font-medium text-[#8a7f70] uppercase tracking-wider mb-5">
          Workflow
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              label: 'Extract Roster',
              description: 'Extract player data from the official team roster page',
              href: '/builder/debug-roster?teamSlug=penn-mens-golf',
            },
            {
              label: 'Import History',
              description: 'Import historical seasons to build a multi-year alumni graph',
              href: '/builder/history?teamSlug=penn-mens-golf',
            },
            {
              label: 'Review & Promote',
              description: 'Review extracted entries and promote them to the alumni graph',
              href: '/builder/promote?teamSlug=penn-mens-golf',
            },
            {
              label: 'View Alumni',
              description: 'Browse and search the promoted alumni graph',
              href: '/player',
            },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-5 hover:-translate-y-0.5 transition-transform"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <p className="text-sm font-semibold text-[#0a1628] tracking-tight mb-1">{link.label}</p>
              <p className="text-xs text-[#8a7f70]">{link.description}</p>
            </Link>
          ))}
        </div>

        {/* Footer disclaimer */}
        <p className="text-xs text-[#8a7f70] text-center mt-12 leading-relaxed max-w-xl mx-auto">
          Alumni OS uses public, permissioned, or alumni-submitted data. Verify profiles before
          outreach. Do not scrape private or login-gated profiles. Alumni can claim, edit, or opt
          out.
        </p>
      </div>
    </div>
  )
}
