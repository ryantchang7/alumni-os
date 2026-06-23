import { NextResponse } from 'next/server'
import { createProfileClaimRequest, getTeamBySlug } from '@/lib/store/local-store'
import { checkRateLimit, ipFromRequest } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'

const TEAM_SLUG = 'penn-mens-golf'

export async function POST(request: Request) {
  // Public, unauthenticated endpoint that also emails the captain — rate-limit
  // per IP before any heavy work. Generous window so no real alum hits it; the
  // limiter fails open if Redis is down (legitimate signups never blocked).
  const ip = ipFromRequest(request)
  const { ok } = await checkRateLimit(`claim:${ip}`, 6, 600)
  if (!ok) {
    return NextResponse.json(
      { error: 'Too many requests — please try again in a few minutes.' },
      { status: 429 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { memberId, requesterName, requesterEmail, pennGolfYears, note, turnstileToken } =
    body as Record<string, unknown>

  // CAPTCHA (Cloudflare Turnstile). No-op fail-open until TURNSTILE_SECRET_KEY
  // is set — behavior is identical to today until keys exist.
  const captchaOk = await verifyTurnstile(
    typeof turnstileToken === 'string' ? turnstileToken : undefined,
    ip,
  )
  if (!captchaOk) {
    return NextResponse.json(
      { error: 'Verification failed — please try again.' },
      { status: 403 },
    )
  }

  if (!memberId || typeof memberId !== 'string') {
    return NextResponse.json({ error: 'Missing memberId' }, { status: 400 })
  }
  if (!requesterName || typeof requesterName !== 'string' || !requesterName.trim()) {
    return NextResponse.json({ error: 'Missing requesterName' }, { status: 400 })
  }
  if (!requesterEmail || typeof requesterEmail !== 'string' || !requesterEmail.includes('@')) {
    return NextResponse.json({ error: 'Invalid requesterEmail' }, { status: 400 })
  }

  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 500 })
  }

  // Cap free-text before it's persisted into the single JSON blob (truncate,
  // don't reject, so a long paste never hard-fails the claim — this is the
  // primary signup entry point).
  const claim = await createProfileClaimRequest({
    teamId: team.id,
    memberId: memberId.slice(0, 160),
    requesterName: String(requesterName).trim().slice(0, 160),
    requesterEmail: String(requesterEmail).trim().toLowerCase().slice(0, 200),
    pennGolfYears: pennGolfYears ? String(pennGolfYears).trim().slice(0, 160) : undefined,
    note: note ? String(note).trim().slice(0, 800) : undefined,
  })

  return NextResponse.json({ claim }, { status: 201 })
}
