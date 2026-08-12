/**
 * One-time sign-in links for members who do not use a Google account.
 *
 * Tokens live in Redis under their own keys rather than in the store blob:
 * every blob write is a compare-and-swap against one revision key, and a
 * launch-day rush of sign-ins would have hundreds of them racing. Redis also
 * gives us native TTL (no pruning) and GETDEL (atomic single use, so two
 * clicks on the same link cannot both sign in).
 *
 * What a token proves is only "this person can read this inbox". It grants a
 * session, never approval: the account it lands on has no linkedPersonId until
 * the member claims a card and a founder approves it, exactly as with Google.
 */

import { Redis } from '@upstash/redis'
import { createHash, randomBytes } from 'crypto'

const TTL_SECONDS = 15 * 60
const MAX_PER_EMAIL_PER_HOUR = 5

let _redis: Redis | null | undefined
function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN
  _redis = url && token ? new Redis({ url, token }) : null
  return _redis
}

/** Local-dev fallback when Redis is not configured. Never used on Vercel. */
const memory = new Map<string, { value: string; expiresAt: number }>()
function memGet(key: string): string | null {
  const hit = memory.get(key)
  if (!hit) return null
  if (hit.expiresAt < Date.now()) {
    memory.delete(key)
    return null
  }
  return hit.value
}

/** Counter shared by both backends so the limit behaves the same either way. */
async function bumpRequestCount(key: string): Promise<number> {
  const redis = getRedis()
  if (redis) {
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, 3600)
    return count
  }
  const current = Number(memGet(key) ?? 0) + 1
  const existing = memory.get(key)
  memory.set(key, {
    value: String(current),
    // Keep the original window, so repeated hits cannot keep pushing it out.
    expiresAt: existing && existing.expiresAt > Date.now() ? existing.expiresAt : Date.now() + 3600_000,
  })
  return current
}

/** Hash before storing: a leaked Redis dump must not hand out live sessions. */
const hash = (v: string) => createHash('sha256').update(v).digest('hex')

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

/** Basic shape check. Deliverability is proven by the link itself. */
export function isPlausibleEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email) && email.length <= 254
}

/**
 * Mint a link token, or return null when this address has asked too often.
 * Rate limited per address so the endpoint cannot be used to mail-bomb someone
 * or to burn through the Resend quota.
 */
export async function issueEmailLinkToken(email: string): Promise<string | null> {
  const normalized = normalizeEmail(email)
  const redis = getRedis()

  const count = await bumpRequestCount(`emaillink:rl:${hash(normalized)}`)
  if (count > MAX_PER_EMAIL_PER_HOUR) return null

  const token = randomBytes(32).toString('base64url')
  const key = `emaillink:${hash(token)}`
  const payload = JSON.stringify({ email: normalized, createdAt: Date.now() })

  if (redis) {
    await redis.set(key, payload, { ex: TTL_SECONDS })
  } else {
    memory.set(key, { value: payload, expiresAt: Date.now() + TTL_SECONDS * 1000 })
  }
  return token
}

/**
 * Redeem a token exactly once and return the address it was issued to.
 * Returns null for anything unknown, expired, or already used.
 */
export async function consumeEmailLinkToken(token: string): Promise<string | null> {
  if (!token || token.length > 200) return null
  const key = `emaillink:${hash(token)}`
  const redis = getRedis()

  let raw: string | null
  if (redis) {
    // GETDEL is atomic, so a double click cannot redeem the same token twice.
    raw = await redis.getdel<string>(key)
  } else {
    raw = memGet(key)
    memory.delete(key)
  }
  if (!raw) return null

  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw as { email?: string })
    const email = typeof parsed?.email === 'string' ? parsed.email : null
    return email && isPlausibleEmail(email) ? email : null
  } catch {
    return null
  }
}
