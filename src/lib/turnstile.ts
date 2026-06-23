/**
 * Cloudflare Turnstile verification for public, unauthenticated POST endpoints.
 *
 * Required env vars (set both to turn the challenge ON):
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY — client widget site key (exposed to browser)
 *   TURNSTILE_SECRET_KEY           — server verification secret (server-only)
 *
 * FAIL-OPEN by design:
 *   - If TURNSTILE_SECRET_KEY is NOT set, verifyTurnstile() returns true
 *     immediately (no-op). Forms keep working exactly as they do today until
 *     the keys are added — behavior is identical to no Turnstile at all.
 *   - If the verify call itself errors (Cloudflare outage, network blip), we
 *     also return true so a transient failure never blocks a real signup. The
 *     rate-limiter remains the always-on abuse backstop.
 */

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

interface TurnstileVerifyResponse {
  success: boolean
  'error-codes'?: string[]
}

export async function verifyTurnstile(
  token: string | undefined,
  ip?: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  // Not configured → no-op fail-open so forms keep working until keys exist.
  if (!secret) return true

  // Keys ARE configured but the client sent no token → genuinely failed.
  if (!token) return false

  try {
    const form = new URLSearchParams()
    form.set('secret', secret)
    form.set('response', token)
    if (ip) form.set('remoteip', ip)

    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    })
    const data = (await res.json()) as TurnstileVerifyResponse
    return data.success === true
  } catch (err) {
    // Verify-service failure must not block real users — fail open.
    console.warn('[turnstile] verify failed — failing open:', err)
    return true
  }
}
