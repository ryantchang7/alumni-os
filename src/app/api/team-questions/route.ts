/**
 * /api/team-questions
 *
 * POST — an approved member asks the current team a question. Rate-limited +
 *        Turnstile-gated (no-op until keyed). Notifies every current player
 *        who hasn't opted out (in-app + web push).
 * GET  — role-aware: current players (and founders) get the open + recently
 *        answered queue; everyone else gets their own questions + answers.
 */

import { NextResponse } from 'next/server'
import {
  addTeamQuestion,
  getAccountById,
  readStore,
} from '@/lib/store/local-store'
import type { Store } from '@/lib/store/types'
import { notifyMany } from '@/lib/notifications/notify'
import { checkRateLimit, ipFromRequest } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'
import { requireApprovedMember } from '@/lib/auth/guards'
import { FOUNDER_EMAILS } from '@/lib/badges'

const TEAM_SLUG = 'penn-mens-golf'

/** personIds of the current-roster players for the team. */
function currentPlayerPersonIds(store: Store): Set<string> {
  const team = store.teams.find(t => t.slug === TEAM_SLUG)
  if (!team) return new Set()
  return new Set(
    store.teamMemberships
      .filter(m => m.teamId === team.id && m.memberRole === 'current_player')
      .map(m => m.personId),
  )
}

export async function POST(request: Request) {
  const gate = await requireApprovedMember()
  if (!gate.ok) return gate.response

  const ip = ipFromRequest(request)
  const rate = await checkRateLimit(`teamq:${ip}`, 5, 600)
  if (!rate.ok) {
    return NextResponse.json({ error: 'Too many questions — try again later.' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const turnstileToken = typeof body.turnstileToken === 'string' ? body.turnstileToken : undefined
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return NextResponse.json({ error: 'Challenge failed — please refresh and try again.' }, { status: 403 })
  }

  const question = typeof body.question === 'string' ? body.question.trim() : ''
  if (!question) {
    return NextResponse.json({ error: 'Question is required.' }, { status: 400 })
  }
  if (question.length > 1000) {
    return NextResponse.json({ error: 'Question too long (1000 chars max).' }, { status: 400 })
  }

  const account = await getAccountById(gate.session.accountId!)
  if (!account) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 400 })
  }

  const store = await readStore()
  const askerName = account.name || gate.session.user?.name || 'A member'
  const team = store.teams.find(t => t.slug === TEAM_SLUG)
  const askerGradYear =
    account.linkedPersonId && team
      ? store.teamMemberships.find(
          m => m.personId === account.linkedPersonId && m.teamId === team.id,
        )?.classYearEstimate
      : undefined

  // Resolve who the question is aimed at (if anyone). Only current players are
  // valid targets; unknown / non-player ids are silently dropped. Cap at 10.
  const playerPersonIds = currentPlayerPersonIds(store)
  const requestedTargetIds = Array.isArray(body.targetPersonIds)
    ? (body.targetPersonIds as unknown[])
        .filter((x): x is string => typeof x === 'string')
        .slice(0, 10)
    : []
  const targets = Array.from(new Set(requestedTargetIds))
    .filter(id => playerPersonIds.has(id))
    .map(id => {
      const person = store.people.find(p => p.id === id)
      return person ? { personId: id, name: person.canonicalName } : null
    })
    .filter((t): t is { personId: string; name: string } => t !== null)

  const created = await addTeamQuestion({
    askerAccountId: account.id,
    askerName,
    askerGradYear,
    question,
    targets,
  })

  // Recipients: the targeted players — or every current player for a whole-team
  // question — minus anyone who opted out and the asker themselves.
  const targetIdSet = new Set(targets.map(t => t.personId))
  const recipientAccounts = store.accounts.filter(
    a =>
      a.linkedPersonId &&
      playerPersonIds.has(a.linkedPersonId) &&
      a.answersTeamQuestions !== false &&
      a.id !== account.id &&
      (targetIdSet.size === 0 || targetIdSet.has(a.linkedPersonId)),
  )
  const targeted = targets.length > 0

  // In-app bell + web push.
  try {
    if (recipientAccounts.length > 0) {
      await notifyMany(recipientAccounts.map(a => a.id), {
        type: 'new_question',
        title: targeted ? `${askerName} asked you a question` : 'New question for the team',
        body: `${question.slice(0, 90)}${question.length > 90 ? '…' : ''}`,
        href: '/team/questions',
      })
    }
  } catch (err) {
    console.warn('[team-questions] notify failed (non-fatal):', err)
  }

  // Email each recipient individually — personalized, and one-per-send so the
  // recipient list stays private. No-ops if RESEND_API_KEY / EMAIL_FROM unset.
  try {
    const withEmail = recipientAccounts.filter(a => a.email)
    if (withEmail.length > 0) {
      const { sendEmail } = await import('@/lib/email/send')
      const { renderTeamQuestionEmail } = await import('@/lib/email/templates')
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://penngolfclubhouse.com'
      const answerUrl = `${baseUrl}/team/questions`
      await Promise.all(
        withEmail.map(a => {
          const { subject, html } = renderTeamQuestionEmail({
            playerFirstName: a.name?.split(' ')[0] ?? null,
            askerName,
            question,
            targeted,
            answerUrl,
          })
          return sendEmail({ to: a.email, subject, html })
        }),
      )
    }
  } catch (err) {
    console.warn('[team-questions] email failed (non-fatal):', err)
  }

  return NextResponse.json({ ok: true, question: created })
}

export async function GET() {
  const gate = await requireApprovedMember()
  if (!gate.ok) return gate.response

  const store = await readStore()
  const account = await getAccountById(gate.session.accountId!)
  const playerPersonIds = currentPlayerPersonIds(store)
  const isFounder = FOUNDER_EMAILS.has(gate.email)
  const isCurrentPlayer = !!(account?.linkedPersonId && playerPersonIds.has(account.linkedPersonId))

  if (isCurrentPlayer || isFounder) {
    const myPersonId = account?.linkedPersonId
    const open = store.teamQuestions.filter(q => {
      if (q.status !== 'open') return false
      // Founders see all; a player sees whole-team questions + ones aimed at them.
      if (isFounder) return true
      if (!q.targets || q.targets.length === 0) return true
      return !!myPersonId && q.targets.some(t => t.personId === myPersonId)
    })
    const answered = store.teamQuestions.filter(q => q.status === 'answered').slice(0, 50)
    return NextResponse.json({ role: 'player', open, answered })
  }

  const mine = store.teamQuestions.filter(q => q.askerAccountId === gate.session.accountId!)
  return NextResponse.json({ role: 'member', mine })
}
