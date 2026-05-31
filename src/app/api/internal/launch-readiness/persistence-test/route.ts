/**
 * Founder-only persistence roundtrip. Writes a 60-second heartbeat to
 * KV and reads it back to confirm the store is actually durable.
 */

import { NextResponse } from 'next/server'
import { requireFounder } from '@/lib/auth/guards'
import { runPersistenceTest } from '@/lib/launch/persistence-check'

export async function POST() {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  const result = await runPersistenceTest()
  return NextResponse.json(result, { status: result.ok ? 200 : 503 })
}
