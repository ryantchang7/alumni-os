/**
 * Shared cron / internal-export auth check.
 *
 * Header-only: requires `Authorization: Bearer <CRON_SECRET>`. The legacy
 * `?secret=...` query-param fallback has been removed — secrets in URLs leak
 * into logs, history, and referrers.
 *
 * The Bearer token is compared with crypto.timingSafeEqual (constant-time) to
 * avoid leaking the secret via response-timing. Lengths are checked first so
 * timingSafeEqual never throws on a length mismatch.
 *
 * Fall-open behavior is preserved: if CRON_SECRET is unset we allow the call
 * only in non-production, so local testing works without a secret configured.
 */

import { timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  // timingSafeEqual throws if the buffers differ in length — guard first.
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export function checkCronAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    // No secret configured — allow only in dev so local testing works.
    return process.env.NODE_ENV !== 'production'
  }
  const header = req.headers.get('authorization') ?? ''
  return safeEqual(header, `Bearer ${secret}`)
}
