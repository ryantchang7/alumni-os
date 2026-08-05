import Link from 'next/link'
import { notFound } from 'next/navigation'
import { canPostSeasonUpdates } from '@/lib/auth/season-posters'
import { FOUNDER_EMAILS } from '@/lib/badges'
import SeasonManagerClient from './SeasonManagerClient'

export default async function InternalSeasonPage() {
  const gate = await canPostSeasonUpdates()
  if (!gate.ok) notFound()
  const isFounder = FOUNDER_EMAILS.has(gate.email)

  return (
    <div className="min-h-screen bg-[#fbf9f6]">
      <div className="bg-[#0a1628] px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <Link href="/team-room" className="text-xs text-gray-400 hover:text-gray-200 mb-3 inline-block">&larr; Team Room</Link>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Penn Men&rsquo;s Golf</p>
          <h1 className="text-white text-2xl font-semibold tracking-tight">Post a Season Update</h1>
          <p className="text-gray-400 text-sm mt-2">
            Qualifiers, results, stats, notes, they land in The Season on the Team Room, newest first. Followers get notified.
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
            <SeasonManagerClient isFounder={isFounder} />
          </div>
        </div>
      </div>
    </div>
  )
}
