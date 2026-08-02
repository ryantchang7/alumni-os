import { requireFounderOr404 } from '@/lib/auth/founder-page-gate'
import BuildClient from './BuildClient'

// Founder-only: the roster import/publish admin. The API behind it was
// always founder-gated; the shell now is too (404 for everyone else).
export default async function BuildPage() {
  await requireFounderOr404()
  return <BuildClient />
}
