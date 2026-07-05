import Link from 'next/link'

export default function BuilderRunPage() {
  return (
    <div className="min-h-screen bg-[#fbf9f6]">
      {/* Navy header band */}
      <div className="bg-[#0a1628] py-10 px-8">
        <div className="max-w-[1320px] mx-auto">
          <Link
            href="/builder"
            className="text-xs text-gray-400 hover:text-white transition-colors mb-4 block"
          >
            ← Builder
          </Link>
          <h1 className="text-white text-3xl font-semibold tracking-tight">Builder Pipeline</h1>
          <p className="text-gray-400 text-sm mt-1">Replaced by Workspace</p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-8 py-14">
        <p className="text-base text-[#0a1628] font-semibold mb-2">
          The agent pipeline animation has been replaced by the real workflow.
        </p>
        <p className="text-sm text-ink-muted mb-8 max-w-prose">
          Use the Team Workspace to run historical imports, extract rosters, and promote
          entries into the alumni graph. History and per-season progress are tracked there.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/builder/workspace?teamSlug=penn-mens-golf"
            className="text-sm font-semibold text-white bg-[#990000] hover:bg-[#b30000] px-5 py-2.5 rounded-md transition-colors"
          >
            Team Workspace →
          </Link>
          <Link
            href="/builder/history?teamSlug=penn-mens-golf"
            className="text-sm font-medium text-[#0a1628] border border-[#0a1628] hover:bg-[#0a1628] hover:text-white px-4 py-2.5 rounded-md transition-colors"
          >
            Historical Import →
          </Link>
          <Link
            href="/builder/debug-roster?teamSlug=penn-mens-golf"
            className="text-sm font-medium text-[#0a1628] border border-[#0a1628] hover:bg-[#0a1628] hover:text-white px-4 py-2.5 rounded-md transition-colors"
          >
            Extract Roster →
          </Link>
        </div>
      </div>
    </div>
  )
}
