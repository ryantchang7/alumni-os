/**
 * Founder/cron-only database backup. Snapshots the entire single-blob store
 * (Upstash Redis or the file fallback) and writes it to Vercel Blob under
 * backups/alumni-os-<ISO-timestamp>.json. Returns metadata about the saved
 * snapshot so the caller (or the daily cron) can confirm it landed.
 *
 * Auth: EITHER a valid founder session (requireFounder) OR the cron secret
 * (Authorization: Bearer <CRON_SECRET>, header-only + constant-time compared,
 * mirroring /api/cron/refresh-news). In non-production the cron path falls
 * open exactly like refresh-news so the backup can be exercised locally
 * without a secret set.
 *
 * Requires BLOB_READ_WRITE_TOKEN (same env var as the upload route). Without
 * it the route 503s with a clear message instead of throwing.
 */

import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { requireFounder } from '@/lib/auth/guards'
import { readStore } from '@/lib/store/local-store'
import { checkCronAuth } from '@/lib/cron-auth'

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

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Backups not configured yet — set BLOB_READ_WRITE_TOKEN.' },
      { status: 503 },
    )
  }

  const store = await readStore()
  const json = JSON.stringify(store)
  const savedAt = new Date().toISOString()
  // Colons are legal in blob keys but awkward in URLs/filenames — keep the
  // timestamp filesystem-friendly.
  const key = `backups/alumni-os-${savedAt.replace(/:/g, '-')}.json`

  try {
    const blob = await put(key, json, {
      // PRIVATE — this snapshot is the ENTIRE database (all member PII, contact
      // info, private admin notes). It must require auth to read, unlike the
      // public member photos. @vercel/blob v2 supports per-blob private access.
      access: 'private',
      addRandomSuffix: true,
      contentType: 'application/json',
    })
    return NextResponse.json({
      ok: true,
      key,
      url: blob.url,
      sizeBytes: Buffer.byteLength(json),
      savedAt,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Backup failed'
    console.error('[internal/export] put failed:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
