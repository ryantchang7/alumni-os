import { Suspense } from 'react'
import { requireFounderOr404 } from '@/lib/auth/founder-page-gate'
import TeleprompterClient from './TeleprompterClient'

export default async function TeleprompterPage() {
  await requireFounderOr404()
  return (
    <Suspense fallback={null}>
      <TeleprompterClient />
    </Suspense>
  )
}
