import { requireFounderOr404 } from '@/lib/auth/founder-page-gate'
import LaunchKitClient from './LaunchKitClient'

export default async function LaunchKitPage() {
  await requireFounderOr404()
  return <LaunchKitClient />
}
