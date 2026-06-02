/**
 * Launch readiness — env var presence check. Server-only.
 *
 * Never returns the value, only a boolean. Safe to call from a page
 * that gets server-rendered and shown to the founder. The shape is
 * deliberately flat so it can be JSON-encoded straight into the
 * client component if needed.
 *
 * The "Manual" severity is for things we can only signal "looks
 * present" about (e.g. the EMAIL_FROM string looks like an email)
 * but can't verify end-to-end without firing a test send.
 */

import 'server-only'

export type Severity = 'required' | 'recommended' | 'optional'
export type ReadinessStatus = 'ready' | 'missing' | 'warning' | 'manual'
export type Category =
  | 'Domain & auth'
  | 'Persistence'
  | 'Email'
  | 'Stripe'
  | 'Storage'
  | 'Cron'

export interface EnvCheck {
  key: string
  category: Category
  severity: Severity
  label: string
  /** Short hint for the founder if missing. */
  hint?: string
}

const CHECKS: EnvCheck[] = [
  // Domain & auth
  { key: 'AUTH_SECRET', category: 'Domain & auth', severity: 'required', label: 'NextAuth secret (AUTH_SECRET or NEXTAUTH_SECRET)', hint: 'Generate with `openssl rand -base64 32` and set on Vercel.' },
  { key: 'AUTH_URL', category: 'Domain & auth', severity: 'required', label: 'Production canonical URL (AUTH_URL or NEXTAUTH_URL)', hint: 'Set to https://penngolfclubhouse.com on Vercel.' },
  { key: 'NEXT_PUBLIC_BASE_URL', category: 'Domain & auth', severity: 'required', label: 'Public base URL (NEXT_PUBLIC_BASE_URL)', hint: 'Set to https://penngolfclubhouse.com on Vercel. Used for email links.' },
  { key: 'GOOGLE_CLIENT_ID', category: 'Domain & auth', severity: 'required', label: 'Google OAuth client ID' },
  { key: 'GOOGLE_CLIENT_SECRET', category: 'Domain & auth', severity: 'required', label: 'Google OAuth client secret' },

  // Persistence
  { key: 'KV_REST_API_URL', category: 'Persistence', severity: 'required', label: 'Upstash KV REST URL', hint: 'Without this, writes go to a /tmp file that disappears on Vercel cold starts.' },
  { key: 'KV_REST_API_TOKEN', category: 'Persistence', severity: 'required', label: 'Upstash KV REST token' },

  // Email
  { key: 'RESEND_API_KEY', category: 'Email', severity: 'required', label: 'Resend API key', hint: 'Welcome emails + captain notifications need this to fire.' },
  { key: 'EMAIL_FROM', category: 'Email', severity: 'required', label: 'From-address (e.g. clubhouse@penngolfclubhouse.com)', hint: 'Must be a verified sender in Resend with DKIM + SPF set.' },

  // Stripe (live mode, optional support tiers)
  { key: 'STRIPE_SECRET_KEY', category: 'Stripe', severity: 'required', label: 'Stripe live secret key' },
  { key: 'STRIPE_PRICE_ID', category: 'Stripe', severity: 'required', label: 'Member tier price ID' },
  { key: 'STRIPE_FOUNDING_PRICE_ID', category: 'Stripe', severity: 'recommended', label: 'Founding Member tier price ID' },
  { key: 'STRIPE_PARENT_PRICE_ID', category: 'Stripe', severity: 'optional', label: 'Family & Affiliate tier price ID (optional for v1)' },
  { key: 'STRIPE_WEBHOOK_SECRET', category: 'Stripe', severity: 'required', label: 'Stripe webhook signing secret', hint: 'Without this, subscription status never syncs back.' },

  // Storage
  { key: 'BLOB_READ_WRITE_TOKEN', category: 'Storage', severity: 'required', label: 'Vercel Blob read/write token', hint: 'Powers all photo/video uploads — Moments, Locker Room, profiles, and gathering photos. Without it they fall back to "paste a URL." Fix: Vercel → Storage → Create Database → Blob → connect to the project (auto-injects this), then redeploy.' },

  // Cron
  { key: 'CRON_SECRET', category: 'Cron', severity: 'recommended', label: 'Shared secret for cron endpoints', hint: 'Vercel cron sends an Authorization header; without this, /api/cron/* refuses in production.' },
]

export interface EnvCheckResult extends EnvCheck {
  present: boolean
  /** Non-secret display hint, e.g. the email-from string. We deliberately don't
   *  expose URLs or tokens. */
  displayValue?: string
  /** Computed status for the UI: ready / missing / warning. */
  status: ReadinessStatus
}

/**
 * Walk the registered checks and report each one's presence + a
 * status badge for the readiness page. Reads `process.env` directly;
 * never serializes the value.
 */
export function checkEnvReadiness(): EnvCheckResult[] {
  return CHECKS.map(c => {
    const present = resolveEnvPresent(c.key)
    const status: ReadinessStatus = present
      ? 'ready'
      : c.severity === 'required'
        ? 'missing'
        : c.severity === 'recommended'
          ? 'warning'
          : 'manual'
    // Safe display value: only the EMAIL_FROM string is non-secret-ish.
    const displayValue =
      c.key === 'EMAIL_FROM' && present
        ? (process.env.EMAIL_FROM ?? '').replace(/(.{2}).+(@.+)/, '$1***$2')
        : undefined
    return { ...c, present, status, displayValue }
  })
}

/** Honor the canonical-and-fallback pairs (AUTH_URL → NEXTAUTH_URL, etc). */
function resolveEnvPresent(key: string): boolean {
  const aliases: Record<string, string[]> = {
    AUTH_SECRET: ['AUTH_SECRET', 'NEXTAUTH_SECRET'],
    AUTH_URL: ['AUTH_URL', 'NEXTAUTH_URL'],
    KV_REST_API_URL: ['KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL'],
    KV_REST_API_TOKEN: ['KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN'],
  }
  const keys = aliases[key] ?? [key]
  return keys.some(k => Boolean(process.env[k]))
}

export interface ProductionUrlCheck {
  configured: boolean
  looksProduction: boolean
  url: string | null
}

/** Surface "the URL on this deploy looks like the prod domain" as a soft check. */
export function checkProductionUrl(): ProductionUrlCheck {
  const url =
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    null
  if (!url) return { configured: false, looksProduction: false, url: null }
  const ok = /penngolfclubhouse\.com/i.test(url) && url.startsWith('https://')
  return { configured: true, looksProduction: ok, url }
}

/** Quick check the EMAIL_FROM string is sane (has @, has a TLD-shaped chunk). */
export function checkEmailFromShape(): { configured: boolean; looksValid: boolean } {
  const v = process.env.EMAIL_FROM
  if (!v) return { configured: false, looksValid: false }
  const looksValid = /^[^\s<>]+@[^\s<>]+\.[a-z]{2,}$/i.test(v) || /<[^\s<>]+@[^\s<>]+\.[a-z]{2,}>/i.test(v)
  return { configured: true, looksValid }
}
