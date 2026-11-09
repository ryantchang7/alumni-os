/**
 * POST /api/internal/merge-account — record that two addresses are one
 * person.
 *
 * Stacy Kress Politziner signed in as both stacypolitziner@gmail.com and
 * slkress@comcast.net. One account holds her card; the other sat on the
 * unclaimed list looking like a stranger, and if she ever used it she
 * would have been told to claim a card she already owns. An alum with a
 * work address and a personal one is the ordinary case.
 *
 * This is NOT a merge in the destructive sense and it does not weaken the
 * guard in linkAccountToPerson that refuses two accounts on one person.
 * The duplicate keeps its row, is marked superseded, and its address is
 * added to the primary's alternates, so a future sign-in with it lands in
 * the primary account.
 *
 * Founder only, dry run by default. It refuses to merge an account that
 * holds its own claimed card, because that is two people with one name
 * rather than one person with two addresses, and the difference is not
 * something software should guess at.
 */

import { NextResponse } from 'next/server'
import { requireFounder } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    /* empty body is a dry run */
  }
  // Either ids or addresses. A captain doing this thinks in addresses,
  // and the account ids are not shown anywhere they can copy them from.
  const str = (k: string) => (typeof body[k] === 'string' ? (body[k] as string) : '')
  const confirm = body.confirm === true
  const primaryRef = str('primaryAccountId') || str('primaryEmail')
  const duplicateRef = str('duplicateAccountId') || str('duplicateEmail')
  if (!primaryRef || !duplicateRef) {
    return NextResponse.json(
      { error: 'Give primaryEmail and duplicateEmail (or the account ids).' },
      { status: 400 },
    )
  }

  const { readStore, mutateStore } = await import('@/lib/store/local-store')
  const pre = await readStore()
  const norm = (v: string) => v.trim().toLowerCase()
  const find = (ref: string) =>
    pre.accounts.find(a => a.id === ref) ??
    pre.accounts.find(a => norm(a.email ?? '') === norm(ref))
  const primary = find(primaryRef)
  const duplicate = find(duplicateRef)
  if (!primary || !duplicate) {
    return NextResponse.json(
      { error: `Account not found: ${!primary ? primaryRef : duplicateRef}` },
      { status: 404 },
    )
  }
  const primaryId = primary.id
  const duplicateId = duplicate.id
  if (primaryId === duplicateId) {
    return NextResponse.json({ error: 'Those are the same account.' }, { status: 400 })
  }
  if (duplicate.linkedPersonId) {
    return NextResponse.json(
      {
        error:
          'The duplicate holds a claimed card of its own. That is two people, not one person with two addresses. Unlink it deliberately first.',
      },
      { status: 409 },
    )
  }
  if (duplicate.supersededByAccountId) {
    return NextResponse.json({ error: 'That account is already merged.' }, { status: 409 })
  }

  const plan = {
    primary: { id: primary.id, email: primary.email, linkedPersonId: primary.linkedPersonId ?? null },
    duplicate: { id: duplicate.id, email: duplicate.email },
    effect: `${duplicate.email} becomes an alternate address of ${primary.email}. Signing in with it will land in ${primary.email}'s account.`,
  }
  if (!confirm) return NextResponse.json({ ok: true, dryRun: true, wouldMerge: plan })

  await mutateStore(store => {
    const now = new Date().toISOString()
    const pIdx = store.accounts.findIndex(a => a.id === primaryId)
    const dIdx = store.accounts.findIndex(a => a.id === duplicateId)
    if (pIdx === -1 || dIdx === -1) return
    const dupEmail = store.accounts[dIdx].email
    const existing = store.accounts[pIdx].alternateEmails ?? []
    store.accounts[pIdx] = {
      ...store.accounts[pIdx],
      alternateEmails: existing.some(e => e.toLowerCase() === (dupEmail ?? '').toLowerCase())
        ? existing
        : [...existing, dupEmail].filter((e): e is string => !!e),
      updatedAt: now,
    }
    store.accounts[dIdx] = {
      ...store.accounts[dIdx],
      supersededByAccountId: primaryId,
      updatedAt: now,
    }
  })

  return NextResponse.json({ ok: true, merged: plan })
}
