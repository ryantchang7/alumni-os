import Link from 'next/link'
import { requireFounderOr404 } from '@/lib/auth/founder-page-gate'
import SeasonManagerClient from './SeasonManagerClient'

export default async function InternalSeasonPage() {
  await requireFounderOr404()

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <Link href="/internal" className="text-xs text-gray-400 hover:text-gray-200 mb-3 inline-block">
            &larr; Internal
          </Link>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Internal</p>
          <h1 className="text-white text-2xl font-semibold tracking-tight">Season Tracker</h1>
          <p className="text-gray-400 text-sm mt-2">
            Post qualifying, tournament results, and stats. They show up in the Team Room as a timeline, newest first.
            Paste a link to results or coverage on any update.
          </p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-8">
        <div className="-mt-5 relative z-10 pb-16">
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <SeasonManagerClient />
          </div>
        </div>
      </div>
    </div>
  )
}
