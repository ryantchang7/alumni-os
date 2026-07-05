import { Suspense } from 'react'
import { getApprovalState } from '@/lib/access/approval'
import GatedPreview from '@/components/GatedPreview'
import AskClient from './AskClient'

export default async function AskPage() {
  const approval = await getApprovalState()
  if (!approval.approved) {
    return (
      <div className="min-h-screen bg-[#fbf9f6]">
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
        <div className="min-h-screen bg-[#fbf9f6] animate-pulse px-6 pt-16 max-w-2xl mx-auto">
          <div className="h-8 w-48 bg-[#e8e3db] rounded mb-4" />
          <div className="h-4 w-full bg-[#e8e3db] rounded mb-2" />
          <div className="h-4 w-3/4 bg-[#e8e3db] rounded mb-8" />
          <div className="space-y-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl h-24" />
            ))}
          </div>
        </div>
      }
    >
      <AskClient />
    </Suspense>
  )
}
