import { Suspense } from 'react'
import SentRequestsClient from './SentRequestsClient'

export default function PlayerRequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f5f0] py-20 text-center">
          <p className="text-sm text-ink-muted">Loading…</p>
        </div>
      }
    >
      <SentRequestsClient />
    </Suspense>
  )
}
