/**
 * POST /api/sign-in-link — mail a one-time sign-in link.
 *
 * Lives outside /api/auth so it cannot shadow next-auth's catch-all route.
 *
 * Always answers { ok: true }, whether or not a mail went out. Anything else
 * turns this into an oracle for which addresses belong to members, and the
 * Member Book is deliberately not a public mailing list.
 */

import { NextResponse } from 'next/server'
import { issueEmailLinkToken, isPlausibleEmail, normalizeEmail } from '@/lib/auth/email-link'

/** Fresh every call: a shared Response has its body stream consumed once. */
const ok = () => NextResponse.json({ ok: true })

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const raw = typeof body.email === 'string' ? body.email : ''
  if (!isPlausibleEmail(raw.trim())) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }
  const email = normalizeEmail(raw)

  try {
    const token = await issueEmailLinkToken(email)
    // Rate limited. Say nothing: a real person who clicked twice already has a
    // working link in their inbox.
    if (!token) return ok()

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://penngolfclubhouse.com'
    const next = typeof body.next === 'string' && body.next.startsWith('/') ? body.next : ''
    const url =
      `${baseUrl}/login/link?token=${encodeURIComponent(token)}` +
      (next ? `&next=${encodeURIComponent(next)}` : '')

    const { sendEmail } = await import('@/lib/email/send')
    const { renderSignInLinkEmail } = await import('@/lib/email/templates')
    const { subject, html } = renderSignInLinkEmail({ url, minutes: 15 })
    const result = await sendEmail({ to: email, subject, html })

    // Local development has no Resend key, so the mail is only logged and the
    // link would be unreachable. Print it so the flow can be walked end to end.
    // Double-gated, and NODE_ENV is 'production' on every deployment, so a
    // live link can never reach the logs.
    if (result.skipped && process.env.NODE_ENV !== 'production') {
      console.log(`[sign-in-link] dev only, no email configured. Link: ${url}`)
    }
  } catch (err) {
    // Never surface the reason. A failed send looks the same as a skipped one.
    console.warn('[sign-in-link] send failed:', err)
  }

  return ok()
}
