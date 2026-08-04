/**
 * Founder/cron-only database backup. Snapshots the entire store into Redis under
 * alumni-os:store:v1:backup:<ISO> (private by nature — the snapshot is all
 * member PII and must never live on the public blob store). Keeps a rolling
 * window of the newest 14. Returns metadata about the saved
 * snapshot so the caller (or the daily cron) can confirm it landed.
 *
 * Auth: EITHER a valid founder session (requireFounder) OR the cron secret
 * (Authorization: Bearer <CRON_SECRET>, header-only + constant-time compared,
 * mirroring /api/cron/refresh-news). In non-production the cron path falls
 * open exactly like refresh-news so the backup can be exercised locally
 * without a secret set.
 *
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireFounder } from '@/lib/auth/guards'
import { writeBackupSnapshot } from '@/lib/store/local-store'
import { checkCronAuth } from '@/lib/cron-auth'
import { alertFounders } from '@/lib/ops/alert'

export async function GET(req: NextRequest) {
  // Either gate is sufficient. Check the cron secret first (cheap, header-only),
  // then fall back to a founder session for manual exports from the browser.
  let authorized = checkCronAuth(req)
  if (!authorized) {
    const gate = await requireFounder()
    if (gate.ok) authorized = true
  }
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await writeBackupSnapshot()
    if (!result) {
      return NextResponse.json({ ok: true, skipped: 'file-backed dev store' })
    }
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Backup failed'
    console.error('[internal/export] snapshot failed:', msg)
    await alertFounders('daily backup', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
