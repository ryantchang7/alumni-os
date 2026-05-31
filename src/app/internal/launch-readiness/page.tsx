import { requireFounderOr404 } from '@/lib/auth/founder-page-gate'
import {
  checkEnvReadiness,
  checkProductionUrl,
  checkEmailFromShape,
} from '@/lib/launch/env-readiness'
import { detectStoreBackend } from '@/lib/launch/persistence-check'
import { getLaunchMetrics } from '@/lib/launch/metrics'
import { memberBookEntries } from '@/lib/member-book/data'
import LaunchReadinessClient from './LaunchReadinessClient'

export default async function LaunchReadinessPage() {
  await requireFounderOr404()

  // Pre-render the server-only checks so the client never sees secrets.
  const envChecks = checkEnvReadiness()
  const productionUrl = checkProductionUrl()
  const emailFrom = checkEmailFromShape()
  const backend = detectStoreBackend()
  const metrics = await getLaunchMetrics()

  return (
    <LaunchReadinessClient
      envChecks={envChecks}
      productionUrl={productionUrl}
      emailFrom={emailFrom}
      backend={backend}
      metrics={{ ...metrics, membersInBook: memberBookEntries.length }}
    />
  )
}
