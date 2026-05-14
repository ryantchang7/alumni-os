import { Suspense } from 'react'
import AskClient from './AskClient'

export default function AskPage() {
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
