/**
 * Tell the founder when a scheduled job fails.
 *
 * Every cron here fails silently into a Vercel log nobody reads. That's how
 * the Penn Athletics news feed sat dead for a month, and how the daily backup
 * failed for weeks — the store is a single Redis key, so a quiet backup
 * failure is the scariest one on the list. The roster check runs once a year;
 * without this, a break would surface twelve months later.
 *
 * Never throws: an alert failing must not turn a partial job failure into a
 * 500 that hides the original problem.
 */

import { FOUNDER_EMAILS } from '@/lib/badges'
import { sendEmail } from '@/lib/email/send'

export async function alertFounders(
  job: string,
  detail: string,
): Promise<void> {
  try {
    const to = [...FOUNDER_EMAILS]
    if (to.length === 0) return
    const when = new Date().toISOString()
    await sendEmail({
      to,
      subject: `Clubhouse job failed: ${job}`,
      html: `
        <p style="font-family:system-ui,sans-serif;font-size:15px;color:#0a1628;">
          <strong>${job}</strong> failed at ${when}.
        </p>
        <pre style="font-family:ui-monospace,monospace;font-size:12px;color:#3d4a5c;background:#fdfcf9;padding:12px;border-radius:8px;white-space:pre-wrap;">${String(
          detail,
        ).slice(0, 1500)}</pre>
        <p style="font-family:system-ui,sans-serif;font-size:13px;color:#3d4a5c;">
          Vercel → Project → Logs, filter by the cron path, for the full trace.
        </p>
      `,
    })
  } catch (e) {
    console.warn('[alert] could not send failure alert:', e)
  }
}
