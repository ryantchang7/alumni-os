/**
 * Founder-only launch metrics. Simple counts. No cookies, no third
 * parties.
 */

import { NextResponse } from 'next/server'
import { requireFounder } from '@/lib/auth/guards'
import { getLaunchMetrics } from '@/lib/launch/metrics'

export async function GET() {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  const metrics = await getLaunchMetrics()
  return NextResponse.json(metrics)
}
