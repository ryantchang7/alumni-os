/**
 * POST /api/internal/member-clubs
 *
 * Founder-only: set any member's home club(s) — including alumni, who the
 * current-roster editor can't touch (it's restricted to current players).
 * Body: { personId: string, homeCourse?: string, noHomeCourse?: boolean }.
 * homeCourse is free text; several clubs can be comma-separated (they split +
 * combine on The Course via normalizeCourseName).
 */

import { NextResponse } from 'next/server'
import { requireFounder } from '@/lib/auth/guards'
import { getTeamBySlug, setMemberHomeCourse } from '@/lib/store/local-store'

const TEAM_SLUG = 'penn-mens-golf'

export async function POST(request: Request) {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const personId = typeof body.personId === 'string' ? body.personId.trim() : ''
  if (!personId) return NextResponse.json({ error: 'personId is required.' }, { status: 400 })

  const homeCourse =
    typeof body.homeCourse === 'string' ? body.homeCourse.slice(0, 300) : undefined
  const noHomeCourse = typeof body.noHomeCourse === 'boolean' ? body.noHomeCourse : undefined
  if (homeCourse === undefined && noHomeCourse === undefined) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })
  }

  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ error: 'Team not found.' }, { status: 404 })

  const updated = await setMemberHomeCourse({ personId, teamId: team.id, homeCourse, noHomeCourse })
  if (!updated) return NextResponse.json({ error: 'Member not found.' }, { status: 404 })

  return NextResponse.json({
    ok: true,
    homeCourse: updated.homeCourse ?? null,
    noHomeCourse: updated.noHomeCourse ?? false,
  })
}
