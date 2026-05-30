import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { isCaptainEmailWithOverrides } from '@/lib/captains-runtime'
import { readStore } from '@/lib/store/local-store'
import TeleprompterClient from './TeleprompterClient'

const TEAM_SLUG = 'penn-mens-golf'

export default async function TeleprompterPage() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect('/login?next=/internal/launch-kit/teleprompter')
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
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={null}>
      <TeleprompterClient />
    </Suspense>
  )
}
