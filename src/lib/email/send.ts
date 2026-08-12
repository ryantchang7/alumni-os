/**
 * Thin Resend wrapper. Reads RESEND_API_KEY + EMAIL_FROM from env. If
 * either is unset, logs the would-be send and returns { ok: true,
 * skipped: true } so local dev and Vercel previews don't fail.
 */

import { Resend } from 'resend'

interface EmailAttachment {
  /** File name as it should appear in the recipient's inbox. */
  filename: string
  /** UTF-8 string body (for text/calendar, text/plain, etc.). For binary,
   * pre-base64-encode and set content to the string. */
  content: string
  contentType?: string
}

interface SendArgs {
  to: string | string[]
  subject: string
  html: string
  /** Optional plaintext fallback. If omitted, Resend will derive from HTML. */
  text?: string
  /** Optional reply-to header (e.g. captain's email). */
  replyTo?: string
  /** Optional file attachments (e.g. an .ics calendar invite). */
  attachments?: EmailAttachment[]
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
      attachments: args.attachments?.map(a => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
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

/** Resend rejects bursts, so a fan-out goes out a few at a time. */
const BATCH_SIZE = 2
const BATCH_PAUSE_MS = 1100
const RATE_LIMIT_RETRIES = 3

const isRateLimited = (r: SendResult) =>
  !r.ok && /rate|429|too many/i.test(r.error ?? '')

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Send a batch of individually-addressed emails without tripping Resend's
 * rate limit.
 *
 * A launch-day fan-out is dozens of messages. Firing them all at once with
 * Promise.all gets most of them 429'd, and because a failed send only logs,
 * they vanish silently: the members never hear, and nothing looks wrong.
 * This paces them and retries the ones that come back rate limited.
 *
 * Returns per-message results in the same order as the input.
 */
export async function sendEmailBatch(
  messages: SendArgs[],
  /** Injectable purely so the pacing and retry can be tested without Resend. */
  send: (args: SendArgs) => Promise<SendResult> = sendEmail,
): Promise<SendResult[]> {
  const results: SendResult[] = []

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const slice = messages.slice(i, i + BATCH_SIZE)
    const sent = await Promise.all(
      slice.map(async msg => {
        let result = await send(msg)
        for (let attempt = 0; attempt < RATE_LIMIT_RETRIES && isRateLimited(result); attempt++) {
          await sleep(BATCH_PAUSE_MS * (attempt + 2))
          result = await send(msg)
        }
        return result
      }),
    )
    results.push(...sent)
    if (i + BATCH_SIZE < messages.length) await sleep(BATCH_PAUSE_MS)
  }

  const failed = results.filter(r => !r.ok).length
  if (failed > 0) {
    console.warn(`[email] batch of ${messages.length}: ${failed} failed after retries`)
  }
  return results
}
