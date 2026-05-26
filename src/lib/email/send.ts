/**
 * Thin Resend wrapper. Reads RESEND_API_KEY + EMAIL_FROM from env. If
 * either is unset, logs the would-be send and returns { ok: true,
 * skipped: true } so local dev and Vercel previews don't fail.
 */

import { Resend } from 'resend'

interface SendArgs {
  to: string | string[]
  subject: string
  html: string
  /** Optional plaintext fallback. If omitted, Resend will derive from HTML. */
  text?: string
  /** Optional reply-to header (e.g. captain's email). */
  replyTo?: string
}

interface SendResult {
  ok: boolean
  skipped?: boolean
  error?: string
  id?: string
}

let _client: Resend | null | undefined
function getClient(): Resend | null {
  if (_client !== undefined) return _client
  const key = process.env.RESEND_API_KEY
  if (!key) {
    _client = null
    return null
  }
  _client = new Resend(key)
  return _client
}

export async function sendEmail(args: SendArgs): Promise<SendResult> {
  const from = process.env.EMAIL_FROM
  const client = getClient()
  const recipients = Array.isArray(args.to) ? args.to : [args.to]

  if (!client || !from) {
    console.log(
      `[email] would send to ${recipients.join(', ')}: "${args.subject}" (RESEND_API_KEY or EMAIL_FROM unset)`,
    )
    return { ok: true, skipped: true }
  }

  try {
    const { data, error } = await client.emails.send({
      from,
      to: recipients,
      subject: args.subject,
      html: args.html,
      text: args.text,
      replyTo: args.replyTo,
    })
    if (error) {
      console.error('[email] send failed:', error)
      return { ok: false, error: error.message }
    }
    return { ok: true, id: data?.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown error'
    console.error('[email] threw:', msg)
    return { ok: false, error: msg }
  }
}
