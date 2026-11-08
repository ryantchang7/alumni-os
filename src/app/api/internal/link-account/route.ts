/**
 * POST /api/internal/link-account — founder links an account to the
 * historical card it should always have matched.
 *
 * The self-serve path assumes the member finds their own card. That fails
 * for exactly the people it most needs to serve: a 1976 captain whose card
 * carries a middle initial his account name does not, and a 2004-05
 * women's captain whose card is under her maiden name and whose account
 * carries no name at all. Both were reported "no match" and both were in
 * the book the whole time. There was no way to fix either from the admin
 * side; this is it.
 *
 * Founder only, dry run by default, and it refuses rather than guesses:
 *  - the account must exist and must not already be linked,
 *  - the card must exist and be public,
 *  - the card must not already belong to a different account.
 *
 * It writes an approved ProfileClaimRequest alongside the link so the
 * action leaves the same audit trail a member-initiated claim would,
 * attributed to the founder who ran it rather than looking like the member
 * claimed it themselves.
 */

import { NextResponse } from 'next/server'
import { requireFounder } from '@/lib/auth/guards'
import { getMemberById } from '@/lib/member-book/data'
import { isPublicMember, getMemberProgram } from '@/lib/member-book/helpers'
import { ensurePersonForBookEntry } from '@/lib/member-book/ensure-person'
import type { ClubhouseProfileClaimRequest } from '@/lib/store/types'

export const dynamic = 'force-dynamic'

const TEAM_SLUG = 'penn-mens-golf'

export async function POST(request: Request) {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    /* empty body is a dry run */
  }
  const accountId = typeof body.accountId === 'string' ? body.accountId : ''
  const bookId = typeof body.bookId === 'string' ? body.bookId : ''
  const note = typeof body.note === 'string' ? body.note.slice(0, 400) : ''
  const confirm = body.confirm === true
  if (!accountId || !bookId) {
    return NextResponse.json({ error: 'accountId and bookId required' }, { status: 400 })
  }

  const entry = getMemberById(bookId)
  if (!entry || !isPublicMember(entry)) {
    return NextResponse.json({ error: 'Member Book entry not found' }, { status: 404 })
  }

  const { readStore, mutateStore, getTeamBySlug, linkAccountToPerson } = await import(
    '@/lib/store/local-store'
  )
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const pre = await readStore()
  const account = pre.accounts.find(a => a.id === accountId)
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  if (account.linkedPersonId) {
    return NextResponse.json(
      { error: 'That account is already linked. Unlink it by hand first.' },
      { status: 409 },
    )
  }

  const plan = {
    account: { id: account.id, email: account.email, name: account.name ?? null },
    card: {
      bookId,
      displayName: entry.displayName,
      program: getMemberProgram(entry),
      startYear: entry.career.startYear ?? entry.letterWinner.firstYear ?? null,
      endYear: entry.career.finishYear ?? entry.letterWinner.lastYear ?? null,
    },
    note,
  }

  if (!confirm) {
    return NextResponse.json({ ok: true, dryRun: true, wouldLink: plan })
  }

  // Bootstrap the person rows and record the approval in one write, so a
  // retry cannot half-apply. The link itself is CAS-guarded separately and
  // refuses if another account took the person in between.
  const personId = await mutateStore<string>(store => {
    const id = ensurePersonForBookEntry(store, entry, team.id)
    const claim: ClubhouseProfileClaimRequest = {
      id: crypto.randomUUID(),
      teamId: team.id,
      memberId: bookId,
      personId: id,
      requesterName: entry.displayName,
      requesterEmail: account.email ?? '',
      requesterAccountId: account.id,
      matchHint: 'strong',
      note:
        note ||
        `Linked by ${gate.email} from /internal/activity. The automated matcher missed this card.`,
      status: 'approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    store.profileClaimRequests.push(claim)
    return id
  })

  const linked = await linkAccountToPerson(account.id, personId)
  if (!linked) {
    return NextResponse.json(
      { error: 'Another account already holds that person record. Nothing linked.' },
      { status: 409 },
    )
  }

  return NextResponse.json({ ok: true, linked: { ...plan, personId } })
}
