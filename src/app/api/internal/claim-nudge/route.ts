/**
 * POST /api/internal/claim-nudge — write to the people who signed in and
 * stopped.
 *
 * Twelve accounts had signed in and never claimed a card on 2026-11-07,
 * against 36 who had. They already found the site and already have an
 * account, which makes them cheaper to convert than anyone who could be
 * recruited, and nobody had ever written to them.
 *
 * Founder only, and `dryRun` by default: it returns exactly who would be
 * written to and which of the two emails each would get, and sends
 * nothing unless `send: true` is passed. An email cannot be recalled, so
 * the default has to be the harmless one.
 *
 * Each account is stamped so a second run does not write to the same
 * person twice. Pass `force: true` to override that, deliberately.
 */

import { NextResponse } from 'next/server'
import { requireFounder } from '@/lib/auth/guards'
import { findBookEntryForTeamStorePerson } from '@/lib/member-book/bridge'

export const dynamic = 'force-dynamic'

const TEAM_SLUG = 'penn-mens-golf'

export interface NudgeTarget {
  accountId: string
  name: string | null
  email: string
  signedUpAt: string
  /** The Member Book card we think is theirs, if the name matched one. */
  matchName: string | null
  matchClassLabel: string | null
  matchBookId: string | null
  alreadyNudgedAt: string | null
}

/** Shared by the GET preview and the POST send so the list cannot differ. */
async function collectTargets(): Promise<NudgeTarget[]> {
  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return []

  return store.accounts
    .filter(a => a.teamId === team.id && !a.linkedPersonId && !!a.email)
    .map((a): NudgeTarget => {
      const entry = a.name ? findBookEntryForTeamStorePerson(a.name) : null
      return {
        accountId: a.id,
        name: a.name ?? null,
        email: a.email as string,
        signedUpAt: a.createdAt,
        matchName: entry?.displayName ?? null,
        matchClassLabel: entry?.profile.classYearEstimate ?? null,
        matchBookId: entry?.id ?? null,
        alreadyNudgedAt: a.claimNudgeSentAt ?? null,
      }
    })
    .sort((x, y) => x.signedUpAt.localeCompare(y.signedUpAt))
}

export async function GET() {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response
  const targets = await collectTargets()
  return NextResponse.json({
    ok: true,
    total: targets.length,
    matched: targets.filter(t => t.matchBookId).length,
    unmatched: targets.filter(t => !t.matchBookId).length,
    alreadyNudged: targets.filter(t => t.alreadyNudgedAt).length,
    targets,
  })
}

export async function POST(request: Request) {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    /* an empty body is a dry run, which is the safe default */
  }
  const send = body.send === true
  const force = body.force === true
  const only = Array.isArray(body.accountIds) ? new Set(body.accountIds as string[]) : null

  let targets = await collectTargets()
  if (only) targets = targets.filter(t => only.has(t.accountId))
  if (!force) targets = targets.filter(t => !t.alreadyNudgedAt)

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://penngolfclubhouse.com'
  const { renderClaimNudgeEmail } = await import('@/lib/email/templates')

  const planned = targets.map(t => {
    const { subject } = renderClaimNudgeEmail({
      recipientFirstName: t.name?.split(/\s+/)[0] ?? null,
      matchName: t.matchName,
      matchClassLabel: t.matchClassLabel,
      cardUrl: t.matchBookId ? `${baseUrl}/member-book/${t.matchBookId}` : null,
      joinUrl: `${baseUrl}/join`,
      clubhouseUrl: baseUrl,
    })
    return { email: t.email, variant: t.matchBookId ? 'card' : 'join', subject }
  })

  if (!send) {
    return NextResponse.json({ ok: true, dryRun: true, wouldSend: planned.length, planned })
  }

  const { sendEmail } = await import('@/lib/email/send')
  const { stampClaimNudgeSent } = await import('@/lib/store/local-store')
  const sent: string[] = []
  const stamp: string[] = []
  const errors: string[] = []
  for (const t of targets) {
    const { subject, html } = renderClaimNudgeEmail({
      recipientFirstName: t.name?.split(/\s+/)[0] ?? null,
      matchName: t.matchName,
      matchClassLabel: t.matchClassLabel,
      cardUrl: t.matchBookId ? `${baseUrl}/member-book/${t.matchBookId}` : null,
      joinUrl: `${baseUrl}/join`,
      clubhouseUrl: baseUrl,
    })
    const res = await sendEmail({ to: t.email, subject, html })
    if (res.ok) {
      sent.push(t.email)
      // Stamped only on a real send, so a skipped send (no Resend key
      // configured) can be retried rather than silently marked done.
      if (!res.skipped) stamp.push(t.accountId)
    } else {
      errors.push(`${t.email}: ${res.error ?? 'unknown'}`)
    }
  }
  // One write for the whole batch, after the sends.
  await stampClaimNudgeSent(stamp)
  return NextResponse.json({ ok: true, sent: sent.length, stamped: stamp.length, errors })
}
