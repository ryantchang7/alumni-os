/**
 * Server-side auth gates for API routes. Centralized so every captain
 * admin endpoint uses the same check — easier to audit + impossible to
 * forget the runtime-overrides check.
 *
 * Usage:
 *   const gate = await requireCaptain()
 *   if (!gate.ok) return gate.response
 *   // gate.session, gate.email available
 */

import { NextResponse } from 'next/server'
import type { Session } from 'next-auth'
import { auth } from '@/auth'
import { isCaptainEmailWithOverrides } from '@/lib/captains-runtime'
import { FOUNDER_EMAILS } from '@/lib/badges'
import { readStore } from '@/lib/store/local-store'

const TEAM_SLUG = 'penn-mens-golf'

interface GatePass {
  ok: true
  session: Session
  email: string
}

interface GateFail {
  ok: false
  response: NextResponse
}

export type GateResult = GatePass | GateFail

export async function requireApprovedMember(): Promise<GateResult> {
  const session = await auth()
  if (!session?.accountId) {
    return { ok: false, response: NextResponse.json({ error: 'Sign in required' }, { status: 401 }) }
  }
  if (!session.linkedPersonId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Approved members only, claim your card to continue.' },
        { status: 403 },
      ),
    }
  }
  const email = (session.user?.email ?? '').toLowerCase().trim()
  return { ok: true, session, email }
}

export async function requireCaptain(): Promise<GateResult> {
  const session = await auth()
  const email = (session?.user?.email ?? '').toLowerCase().trim()
  if (!email) {
    return { ok: false, response: NextResponse.json({ error: 'Sign in required' }, { status: 401 }) }
  }
  const store = await readStore()
  if (!isCaptainEmailWithOverrides(email, TEAM_SLUG, store.accounts)) {
    return { ok: false, response: NextResponse.json({ error: 'Captains only' }, { status: 403 }) }
  }
  return { ok: true, session: session!, email }
}

/**
 * Passes if the signed-in account is a current player on the team
 * (memberRole === 'current_player') AND has not opted out of answering
 * questions (answersTeamQuestions !== false). Founders also pass.
 */
export async function requireCurrentPlayer(): Promise<GateResult> {
  const session = await auth()
  const email = (session?.user?.email ?? '').toLowerCase().trim()
  if (!email || !session?.accountId) {
    return { ok: false, response: NextResponse.json({ error: 'Sign in required' }, { status: 401 }) }
  }
  // Founders always pass.
  if (FOUNDER_EMAILS.has(email)) {
    return { ok: true, session: session!, email }
  }
  const store = await readStore()
  const account = store.accounts.find(a => a.id === session.accountId)
  if (!account) {
    return { ok: false, response: NextResponse.json({ error: 'Account not found' }, { status: 403 }) }
  }
  if (account.answersTeamQuestions === false) {
    return { ok: false, response: NextResponse.json({ error: 'You have opted out of answering questions' }, { status: 403 }) }
  }
  if (!account.linkedPersonId) {
    return { ok: false, response: NextResponse.json({ error: 'Current players only' }, { status: 403 }) }
  }
  const team = store.teams.find(t => t.slug === TEAM_SLUG)
  if (!team) {
    return { ok: false, response: NextResponse.json({ error: 'Team not found' }, { status: 403 }) }
  }
  const membership = store.teamMemberships.find(
    m => m.personId === account.linkedPersonId && m.teamId === team.id && m.memberRole === 'current_player',
  )
  if (!membership) {
    return { ok: false, response: NextResponse.json({ error: 'Current players only' }, { status: 403 }) }
  }
  return { ok: true, session: session!, email }
}

export async function requireFounder(): Promise<GateResult> {
  const session = await auth()
  const email = (session?.user?.email ?? '').toLowerCase().trim()
  if (!email) {
    return { ok: false, response: NextResponse.json({ error: 'Sign in required' }, { status: 401 }) }
  }
  if (!FOUNDER_EMAILS.has(email)) {
    return { ok: false, response: NextResponse.json({ error: 'Founder only' }, { status: 403 }) }
  }
  return { ok: true, session: session!, email }
}
