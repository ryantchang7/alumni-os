/**
 * Public GET — list of Founding Members for the Clubhouse founders wall.
 *
 * Includes anyone whose account is either:
 *   1. The hardcoded program Founder (Ryan Chang's email allowlist), or
 *   2. Has an active subscription on the Founding Member price.
 *
 * Returns name + class label only (no email, no internal ids). Sorted with
 * the Founder first, then alphabetical.
 */

import { NextResponse } from 'next/server'
import { getTeamBySlug, readStore } from '@/lib/store/local-store'
import { getBadgesForAccount } from '@/lib/badges'
import { findBookEntryForTeamStorePerson } from '@/lib/member-book/bridge'

const TEAM_SLUG = 'penn-mens-golf'

interface Founder {
  name: string
  classLabel?: string
  isProgramFounder: boolean
  bookId: string | null
}

export async function GET() {
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ founders: [] })

  const store = await readStore()
  const founders: Founder[] = []

  for (const account of store.accounts) {
    if (account.teamId !== team.id) continue
    const badges = getBadgesForAccount(account)
    if (!badges.includes('founding-member') && !badges.includes('founder')) continue

    const person = account.linkedPersonId
      ? store.people.find(p => p.id === account.linkedPersonId)
      : null
    const membership = person
      ? store.teamMemberships.find(m => m.personId === person.id && m.teamId === team.id)
      : null
    const bookEntry = person ? findBookEntryForTeamStorePerson(person.canonicalName) : null
    const name = person?.canonicalName ?? account.name ?? 'Penn Golf Member'

    founders.push({
      name,
      classLabel: membership?.classLabel,
      isProgramFounder: badges.includes('founder'),
      bookId: bookEntry?.id ?? null,
    })
  }

  // Founder first, then alphabetical by name.
  founders.sort((a, b) => {
    if (a.isProgramFounder !== b.isProgramFounder) return a.isProgramFounder ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return NextResponse.json({ founders })
}
