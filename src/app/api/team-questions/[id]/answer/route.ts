/**
 * POST /api/team-questions/[id]/answer
 *
 * A current player (or founder) answers a question. Appends the answer, marks
 * the question answered, and notifies the asker (in-app + web push).
 */

import { NextResponse } from 'next/server'
import { addTeamQuestionAnswer, getAccountById } from '@/lib/store/local-store'
import { notify } from '@/lib/notifications/notify'
import { requireCurrentPlayer } from '@/lib/auth/guards'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireCurrentPlayer()
  if (!gate.ok) return gate.response

  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const answer = typeof body.body === 'string' ? body.body.trim() : ''
  if (!answer) {
    return NextResponse.json({ error: 'Answer is required.' }, { status: 400 })
  }
  if (answer.length > 2000) {
    return NextResponse.json({ error: 'Answer too long (2000 chars max).' }, { status: 400 })
  }

  const account = await getAccountById(gate.session.accountId!)
  const responderName = account?.name || gate.session.user?.name || 'A player'

  const updated = await addTeamQuestionAnswer(id, {
    responderAccountId: gate.session.accountId!,
    responderName,
    body: answer,
  })
  if (!updated) {
    return NextResponse.json({ error: 'Question not found.' }, { status: 404 })
  }

  // In-app bell + web push to the asker.
  try {
    await notify(updated.askerAccountId, {
      type: 'question_answered',
      title: 'A player answered your question',
      body: `${responderName}: ${answer.slice(0, 80)}${answer.length > 80 ? '…' : ''}`,
      href: '/team/questions',
    })
  } catch (err) {
    console.warn('[team-questions] answer notify failed (non-fatal):', err)
  }

  // Email the asker their answer (no-op if RESEND_API_KEY / EMAIL_FROM unset).
  try {
    const asker = await getAccountById(updated.askerAccountId)
    if (asker?.email) {
      const { sendEmail } = await import('@/lib/email/send')
      const { renderTeamAnswerEmail } = await import('@/lib/email/templates')
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://penngolfclubhouse.com'
      const { subject, html } = renderTeamAnswerEmail({
        askerFirstName: asker.name?.split(' ')[0] ?? null,
        responderName,
        question: updated.question,
        answer,
        url: `${baseUrl}/team/questions`,
      })
      await sendEmail({ to: asker.email, subject, html })
    }
  } catch (err) {
    console.warn('[team-questions] answer email failed (non-fatal):', err)
  }

  return NextResponse.json({ ok: true, question: updated })
}
