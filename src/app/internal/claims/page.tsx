import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { isCaptainEmailWithOverrides } from '@/lib/captains-runtime'
import { readStore } from '@/lib/store/local-store'
import ClaimsManager from './ClaimsManager'

const TEAM_SLUG = 'penn-mens-golf'

export default async function InternalClaimsPage() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect('/login?next=/internal/claims')
  }
  const store = await readStore()
  if (!isCaptainEmailWithOverrides(session.user.email, TEAM_SLUG, store.accounts)) {
    return (
      <div className="min-h-[calc(100dvh-60px)] bg-[#f8f5f0] flex items-center justify-center px-6">
        <div className="max-w-md text-center bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl p-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a7f70] mb-3">
            Restricted
          </p>
          <h1
            className="text-[#0a1628] text-2xl font-medium mb-2"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Captains only.
          </h1>
          <p className="text-[13px] text-[#3d4a5c]">
            This page is reserved for Penn Golf captains who approve new
            profile claims. If that should be you, email the existing captain
            to be added to the list.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <Link href="/internal" className="text-xs text-gray-400 hover:text-gray-200 mb-3 inline-block">
            &larr; Internal
          </Link>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Captain</p>
          <h1 className="text-white text-2xl font-semibold tracking-tight">Profile Claims</h1>
          <p className="text-gray-400 text-sm mt-2">
            Review requests from alumni who want to claim their Member Book card.
          </p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-8">
        <div className="-mt-5 relative z-10 pb-16">
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <ClaimsManager />
          </div>
        </div>
      </div>
    </div>
  )
}
