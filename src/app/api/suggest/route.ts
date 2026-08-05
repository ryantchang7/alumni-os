/**
 * POST /api/suggest
 *
 * Public endpoint — works signed-in or not. Anyone can submit a Clubhouse idea.
 *
 * Signed in:  name/email/accountId auto-filled from session + account record.
 * Signed out: name required (≤120 chars), email optional.
 *
 * Validation: message required (≤1500 chars).
 * Rate-limit:  4 submissions per 10 minutes per IP. Fails open.
 * Turnstile:   verified server-side; no-op until TURNSTILE_SECRET_KEY is set.
 *
 * On success:
 *   1. Writes the submission to the store (newest 200 cap).
 *   2. In a single non-blocking try/catch:
 *      a. In-app notification to each founder account.
 *      b. Email to every FOUNDER_EMAILS address via Resend (no-op if unconfigured).
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { addIdeaSubmission, getAccountById, readStore } from '@/lib/store/local-store'
import { notifyMany } from '@/lib/notifications/notify'
import { sendEmail } from '@/lib/email/send'
import { renderIdeaSubmissionEmail } from '@/lib/email/templates'
import { checkRateLimit, ipFromRequest } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'
import { FOUNDER_EMAILS } from '@/lib/badges'

const INTERNAL_URL = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://alumni-os.vercel.app'}/internal`

export async function POST(request: Request) {
  // ── Rate limit ──────────────────────────────────────────────────────────────
  const ip = ipFromRequest(request)
  const rateResult = await checkRateLimit(`suggest:${ip}`, 4, 600)
  if (!rateResult.ok) {
    return NextResponse.json({ error: 'Too many submissions, try again later.' }, { status: 429 })
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // ── Turnstile ───────────────────────────────────────────────────────────────
  const turnstileToken = typeof body.turnstileToken === 'string' ? body.turnstileToken : undefined
  const turnstileOk = await verifyTurnstile(turnstileToken, ip)
  if (!turnstileOk) {
    return NextResponse.json({ error: 'Challenge failed, please refresh and try again.' }, { status: 403 })
  }

  // ── Resolve submitter identity ──────────────────────────────────────────────
  const session = await auth()
  let name: string
  let email: string | undefined
  let accountId: string | undefined

  if (session?.accountId) {
    // Signed in — keep accountId for attribution, but honor the name/email the
    // user typed in the form (they're editable); fall back to the account record.
    const account = await getAccountById(session.accountId)
    const typedName = typeof body.name === 'string' ? body.name.trim() : ''
    const typedEmail = typeof body.email === 'string' ? body.email.trim() : ''
    name = (typedName || account?.name || session.user?.name || '').slice(0, 120)
    email = typedEmail || account?.email || session.user?.email || undefined
    accountId = session.accountId
    if (!name) {
      return NextResponse.json({ error: 'Could not resolve your account name.' }, { status: 400 })
    }
  } else {
    // Signed out — caller must supply name; email is optional.
    const rawName = typeof body.name === 'string' ? body.name.trim() : ''
    if (!rawName) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    if (rawName.length > 120) {
      return NextResponse.json({ error: 'name too long (120 chars max)' }, { status: 400 })
    }
    name = rawName
    email = typeof body.email === 'string' && body.email.trim() ? body.email.trim() : undefined
  }

  // ── Validate message ────────────────────────────────────────────────────────
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }
  if (message.length > 1500) {
    return NextResponse.json({ error: 'message too long (1500 chars max)' }, { status: 400 })
  }

  // ── Store submission ────────────────────────────────────────────────────────
  await addIdeaSubmission({ accountId, name, email, message })

  // ── Notify founders (non-blocking) ─────────────────────────────────────────
  try {
    const store = await readStore()

    // In-app: notify every account whose email is in FOUNDER_EMAILS.
    const founderAccountIds = store.accounts
      .filter(a => FOUNDER_EMAILS.has(a.email.toLowerCase().trim()))
      .map(a => a.id)

    if (founderAccountIds.length > 0) {
      await notifyMany(founderAccountIds, {
        type: 'request',
        title: 'New idea for the Clubhouse',
        body: `${name}: ${message.slice(0, 80)}${message.length > 80 ? '…' : ''}`,
        href: '/internal',
      })
    }

    // Email: send to every address in FOUNDER_EMAILS.
    const { subject, html } = renderIdeaSubmissionEmail({
      submitterName: name,
      submitterEmail: email,
      message,
      internalUrl: INTERNAL_URL,
    })
    await Promise.all(
      Array.from(FOUNDER_EMAILS).map(to =>
        sendEmail({ to, subject, html }),
      ),
    )
  } catch (err) {
    // Never let notification/email failure block the response.
    console.warn('[suggest] post-submission notify failed (non-fatal):', err)
  }

  return NextResponse.json({ ok: true })
}
