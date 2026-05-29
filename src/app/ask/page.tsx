import { Suspense } from 'react'
import { getApprovalState } from '@/lib/access/approval'
import GatedPreview from '@/components/GatedPreview'
import AskClient from './AskClient'

export default async function AskPage() {
  const approval = await getApprovalState()
  if (!approval.approved) {
    return (
      <div className="min-h-screen bg-[#f8f5f0]">
        <GatedPreview
          signedIn={approval.signedIn}
          eyebrow="Members only · Ask the Penn Golf Family"
          headline="Asking lives inside the room."
          blurb="Requesting an intro or advice from a Penn Golf alumnus is a members-only move. Claim your card so the captain can approve you, and you'll be able to send a private ask in one click."
        />
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f5f0] py-20 text-center">
          <p className="text-sm text-[#8a7f70]">Loading…</p>
        </div>
      }
    >
      <AskClient />
    </Suspense>
  )
}
