/**
 * Runtime-aware captain check. The base `isCaptain(email, teamSlug)` in
 * `./captains.ts` only knows about the hardcoded allowlist baked into
 * the deploy. This wrapper *also* lets the founder grant captain access
 * from `/internal/roles` (sets `account.manualCaptain = true`) without
 * a redeploy.
 *
 * Pass in the current `store.accounts` array; this is cheap because the
 * gates that use it already read the store for other reasons.
 */

import type { Account } from '@/lib/store/types'
import { isCaptain } from './captains'

export function isCaptainEmailWithOverrides(
  email: string | null | undefined,
  teamSlug: string,
  accounts: Account[],
): boolean {
  if (!email) return false
  if (isCaptain(email, teamSlug)) return true
  const e = email.toLowerCase().trim()
  return accounts.some(
    a => a.email.toLowerCase().trim() === e && a.manualCaptain === true,
  )
}
