/**
 * Persistence check — server-only utilities for the launch readiness
 * page and the test-write endpoint.
 *
 * Two things matter:
 *   1. Whether the store is currently using KV or the filesystem
 *      fallback. On Vercel without KV, every write lands in /tmp and
 *      disappears on cold start. That's catastrophic for an alumni
 *      network. We need this signal loud and visible.
 *   2. Whether the configured KV actually responds to a roundtrip.
 *      Env vars can be present but pointed at the wrong instance.
 */

import 'server-only'
import { Redis } from '@upstash/redis'

export type StoreBackend = 'kv' | 'filesystem' | 'unknown'

export interface BackendStatus {
  backend: StoreBackend
  isVercel: boolean
  warning: string | null
}

/**
 * Detect which store backend will actually be used for the next
 * read/write. Mirrors the resolution logic in
 * src/lib/store/local-store.ts but never instantiates the client.
 */
export function detectStoreBackend(): BackendStatus {
  const isVercel = process.env.VERCEL === '1'
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN

  if (url && token) {
    return { backend: 'kv', isVercel, warning: null }
  }

  if (isVercel) {
    return {
      backend: 'filesystem',
      isVercel: true,
      warning:
        'Running on Vercel WITHOUT Upstash KV. Every write goes to /tmp/alumni-os.json and disappears on cold start. Set KV_REST_API_URL + KV_REST_API_TOKEN before sharing the URL with alumni.',
    }
  }

  return {
    backend: 'filesystem',
    isVercel: false,
    warning: null,
  }
}

export interface PersistenceTestResult {
  ok: boolean
  backend: StoreBackend
  /** Round-trip latency in ms when ok. */
  latencyMs?: number
  /** Echoed payload (a small heartbeat object). */
  value?: { ts: string; nonce: string }
  error?: string
}

/**
 * Founder-triggered round-trip: write a tiny heartbeat to KV, read it
 * back, compare. If KV isn't configured we return a clear signal so
 * the UI can warn instead of spinning forever.
 */
export async function runPersistenceTest(): Promise<PersistenceTestResult> {
  const status = detectStoreBackend()
  if (status.backend !== 'kv') {
    return {
      ok: false,
      backend: status.backend,
      error: status.warning ?? 'Not on KV, cannot run live persistence test.',
    }
  }

  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    return { ok: false, backend: 'unknown', error: 'KV env vars resolved as missing during test.' }
  }

  const redis = new Redis({ url, token })
  const HEARTBEAT_KEY = 'alumni-os:heartbeat:v1'
  const value = { ts: new Date().toISOString(), nonce: randomNonce() }
  const start = Date.now()
  try {
    await redis.set(HEARTBEAT_KEY, value, { ex: 60 })
    const back = await redis.get<typeof value>(HEARTBEAT_KEY)
    const latencyMs = Date.now() - start
    if (!back || back.nonce !== value.nonce) {
      return {
        ok: false,
        backend: 'kv',
        latencyMs,
        error: 'Wrote heartbeat but read-back nonce did not match. KV may be partitioned or stale.',
      }
    }
    return { ok: true, backend: 'kv', latencyMs, value: back }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown error'
    return { ok: false, backend: 'kv', error: msg }
  }
}

function randomNonce(): string {
  return Math.random().toString(36).slice(2, 10)
}
