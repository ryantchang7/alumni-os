/**
 * POST /api/me/answers-team-questions
 *
 * A current player toggles whether they're available to answer team questions.
 * Body: { value: boolean }. Uses requireApprovedMember + a current-player check
 * (so an opted-out player can still opt back in — requireCurrentPlayer would
 * 403 them once opted out).
 */

import { NextResponse } from 'next/server'
import { getAccountById, readStore, setAnswersTeamQuestions } from '@/lib/store/local-store'
import { requireApprovedMember } from '@/lib/auth/guards'

const TEAM_SLUG = 'penn-mens-golf'

export async function POST(request: Request) {
  const gate = await requireApprovedMember()
  if (!gate.ok) return gate.response

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (typeof body.value !== 'boolean') {
    return NextResponse.json({ error: 'value (boolean) is required.' }, { status: 400 })
  }

  const account = await getAccountById(gate.session.accountId!)
  const store = await readStore()
  const team = store.teams.find(t => t.slug === TEAM_SLUG)
  const isCurrentPlayer = !!(
    account?.linkedPersonId &&
    team &&
    store.teamMemberships.some(
      m =>
        m.personId === account.linkedPersonId &&
        m.teamId === team.id &&
        m.memberRole === 'current_player',
    )
  )
  if (!isCurrentPlayer) {
    return NextResponse.json({ error: 'Current players only.' }, { status: 403 })
  }

  await setAnswersTeamQuestions(gate.session.accountId!, body.value)
  return NextResponse.json({ ok: true, value: body.value })
}
