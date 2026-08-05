/**
 * Founder-only test email. Sends a fixed "Resend is working" message
 * to the signed-in founder's address. Cannot be used to dispatch to
 * arbitrary recipients.
 */

import { NextResponse } from 'next/server'
import { requireFounder } from '@/lib/auth/guards'
import { sendEmail } from '@/lib/email/send'

export async function POST() {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  const to = gate.email
  if (!to) {
    return NextResponse.json({ ok: false, error: 'No email on session.' }, { status: 400 })
  }

  const html = `<!doctype html><html><body style="font-family:Georgia,serif;color:#0a1628;padding:24px;">
    <h1 style="font-weight:500;">Penn Golf Clubhouse, test email</h1>
    <p>This confirms Resend is working for Penn Golf Clubhouse.</p>
    <p style="color:#6b6155;font-size:13px;">Sent ${new Date().toISOString()}</p>
  </body></html>`

  const result = await sendEmail({
    to,
    subject: 'Penn Golf Clubhouse test email',
    html,
    text: 'This confirms Resend is working for Penn Golf Clubhouse.',
  })

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error ?? 'unknown' }, { status: 502 })
  }
  if (result.skipped) {
    return NextResponse.json({
      ok: false,
      error: 'Resend not configured (RESEND_API_KEY or EMAIL_FROM missing). Email would have been logged to the server console.',
    }, { status: 503 })
  }

  return NextResponse.json({ ok: true, id: result.id, to })
}
