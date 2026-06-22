// Per-IP rate limiter for public, unauthenticated POST endpoints.
//
// Backed by the SAME Upstash Redis instance as the store (reuses
// KV_REST_API_URL/KV_REST_API_TOKEN, falling back to UPSTASH_REDIS_REST_URL/
// UPSTASH_REDIS_REST_TOKEN — see src/lib/store/local-store.ts).
//
// CRITICAL: this fails OPEN. If Redis isn't configured, or any call throws,
// checkRateLimit returns { ok: true } so legitimate alumni are NEVER blocked.
// The claim form is the primary signup entry point — a limiter outage must
// not break signups. We rate-limit as a courtesy against abuse, not as a hard
// security boundary.

import { Redis } from '@upstash/redis'

// Lazy client. `undefined` = not yet resolved; `null` = env vars absent.
let _redis: Redis | null | undefined
function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    _redis = null
    return null
  }
  _redis = new Redis({ url, token })
  return _redis
}

/**
 * Fixed-window per-key rate limit using Redis INCR + EXPIRE.
 *
 * On the first hit in a window the counter is set to 1 and an EXPIRE of
 * `windowSec` is applied; the key then auto-clears at the end of the window.
 * Returns ok=false once the count exceeds `limit`.
 *
 * Fails OPEN: any missing config or thrown error yields { ok: true }.
 *
 * @param key       caller-supplied identity (e.g. `claim:<ip>`)
 * @param limit     max requests allowed per window
 * @param windowSec window length in seconds
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<{ ok: boolean }> {
  const redis = getRedis()
  if (!redis) return { ok: true } // not configured → fail open

  try {
    const redisKey = `ratelimit:${key}`
    const count = await redis.incr(redisKey)
    // First hit in this window — start the TTL so the counter resets.
    if (count === 1) {
      await redis.expire(redisKey, windowSec)
    }
    return { ok: count <= limit }
  } catch (err) {
    // Any Redis failure must not block a real user. Fail open.
    console.warn('[rate-limit] check failed — failing open:', err)
    return { ok: true }
  }
}

/**
 * Best-effort client IP from the x-forwarded-for header (Vercel sets it).
 * Takes the first comma-separated value. Falls back to a constant when absent
 * so the limiter still buckets requests (rather than throwing) — note this
 * means un-proxied callers share one bucket, which is fine given the generous
 * limits and the fail-open design.
 */
export function ipFromRequest(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  const first = xff?.split(',')[0]?.trim()
  return first || 'unknown'
}
