import { getApprovalState } from '@/lib/access/approval'
import GatedPreview from '@/components/GatedPreview'
import ChatListClient from './ChatListClient'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Messages',
  description: 'Private messages with the Penn Golf family.',
}

export default async function ChatIndexPage() {
  const approval = await getApprovalState()

  if (!approval.approved) {
    return (
      <div className="min-h-screen bg-[#fbf9f6]">
        <div className="bg-[#0a1628] px-6 sm:px-8 pt-12 pb-14">
          <div className="max-w-[820px] mx-auto">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]/85 mb-3">
              Penn Men&rsquo;s Golf · Clubhouse
            </p>
            <h1
              className="text-white text-4xl sm:text-5xl font-medium tracking-tight font-heading"
            >
              Chat
            </h1>
          </div>
        </div>
        <GatedPreview
          signedIn={approval.signedIn}
          eyebrow="Members only · Chat"
          headline="Chat is between approved members."
          blurb="Direct messages and group threads with other Penn Golf alumni. Claim your card — every claim is reviewed by hand — and a private inbox opens up."
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fbf9f6]">
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-10 pb-12">
        <div className="max-w-[820px] mx-auto">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]/85 mb-3">
            Penn Men&rsquo;s Golf · Clubhouse
          </p>
          <h1
            className="text-white text-3xl sm:text-4xl font-medium tracking-tight font-heading"
          >
            Chat
          </h1>
          <p className="text-white/70 text-sm sm:text-base mt-2 max-w-md">
            Private messages with Penn Golf alumni. Direct or group.
          </p>
        </div>
      </div>

      <div className="max-w-[820px] mx-auto px-5 sm:px-8 py-8">
        <ChatListClient />
      </div>
    </div>
  )
}
