/**
 * Public GET — list of Founding Members for the Clubhouse founders wall.
 * Includes anyone in the hardcoded program-Founder allowlist OR with an
 * active subscription on the Founding Member price. Sorted with the
 * program Founder first, then alphabetical.
 *
 * Returns name + class label only (no email, no internal ids).
 */

import { NextResponse } from 'next/server'
import { getTeamBySlug, readStore } from '@/lib/store/local-store'
import {
  computeFoundersForTeam,
  computeFamilySupportersForTeam,
} from '@/lib/founders'

const TEAM_SLUG = 'penn-mens-golf'

export async function GET() {
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ founders: [], familySupporters: [] })
  const store = await readStore()
  const founders = computeFoundersForTeam(store, team.id)
  const familySupporters = computeFamilySupportersForTeam(store, team.id)
  return NextResponse.json({ founders, familySupporters })
}
