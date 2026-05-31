import { requireFounderOr404 } from '@/lib/auth/founder-page-gate'
import StudioClient from './StudioClient'

export default async function StudioPage() {
  await requireFounderOr404()
  return <StudioClient />
}
