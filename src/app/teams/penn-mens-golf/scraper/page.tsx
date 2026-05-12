import Link from 'next/link'

export default function ScraperPage() {
  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-8 pt-8 pb-10">
        <div className="max-w-[1320px] mx-auto">
          <h1 className="text-2xl font-semibold tracking-tight text-white leading-tight">
            Scraper Inspector — Legacy Demo
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Penn Men&apos;s Golf · University of Pennsylvania
          </p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-8 py-10">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-8">
          <p className="text-sm font-semibold text-amber-800 mb-1">Demo Replaced</p>
          <p className="text-sm text-amber-700 leading-relaxed">
            This was a demo data inspector using fictional pipeline output. The real scraper is in
            the Builder.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/builder/workspace?teamSlug=penn-mens-golf"
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-5 hover:-translate-y-0.5 transition-transform"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <p className="text-sm font-semibold text-[#0a1628] mb-1">Team Workspace</p>
            <p className="text-xs text-[#8a7f70]">Open the builder workspace for this team</p>
          </Link>

          <Link
            href="/builder/debug-roster?teamSlug=penn-mens-golf"
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-5 hover:-translate-y-0.5 transition-transform"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <p className="text-sm font-semibold text-[#0a1628] mb-1">Extract Roster</p>
            <p className="text-xs text-[#8a7f70]">Extract and inspect roster data from source pages</p>
          </Link>

          <Link
            href="/builder/history?teamSlug=penn-mens-golf"
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-5 hover:-translate-y-0.5 transition-transform"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <p className="text-sm font-semibold text-[#0a1628] mb-1">Import History</p>
            <p className="text-xs text-[#8a7f70]">View and run historical season imports</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
