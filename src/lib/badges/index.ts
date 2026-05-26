/**
 * Member badges — earned automatically based on role + subscription state.
 *
 *  - founder         Ryan Chang only (program founder)
 *  - captain         in the captain email allowlist
 *  - founding-member active sub on the Founding Member ($20) tier
 *  - member          active sub on the Member ($10) tier
 *  - parent          active sub on the Parent tier (when configured)
 *
 * A person can hold multiple badges. The renderer sorts them in priority
 * order so the strongest signal sits on the left.
 */

import type { Account } from '@/lib/store/types'
import { isCaptain } from '@/lib/captains'

export type BadgeId =
  | 'founder'
  | 'captain'
  | 'founding-member'
  | 'member'
  | 'parent'

export interface BadgeMeta {
  id: BadgeId
  label: string
  /** Tooltip / aria description. */
  tooltip: string
  /** Tailwind classes for the pill body. */
  className: string
  /** Optional lucide icon name (rendered by the component). */
  icon: 'crown' | 'shield' | 'star' | 'check' | 'heart'
}

export const BADGE_META: Record<BadgeId, BadgeMeta> = {
  founder: {
    id: 'founder',
    label: 'Founder',
    tooltip: 'Built the Clubhouse',
    className:
      'bg-[#0a1628] text-[#c8a84b] border border-[#c8a84b]/40',
    icon: 'crown',
  },
  captain: {
    id: 'captain',
    label: 'PGC Captain',
    tooltip: 'Penn Golf Clubhouse Captain',
    className:
      'bg-[#0a1628]/8 text-[#0a1628] border border-[#0a1628]/25',
    icon: 'shield',
  },
  'founding-member': {
    id: 'founding-member',
    label: 'Founding Member',
    tooltip: 'Founding Member of the Clubhouse',
    className:
      'bg-[#c8a84b]/15 text-[#7a6420] border border-[#c8a84b]/40',
    icon: 'star',
  },
  member: {
    id: 'member',
    label: 'Member',
    tooltip: 'Supporting Member',
    className:
      'bg-[#f5f2ee] text-[#3d4a5c] border border-[rgba(180,168,150,0.55)]',
    icon: 'check',
  },
  parent: {
    id: 'parent',
    label: 'Parent',
    tooltip: 'Parent or affiliate of the program',
    className:
      'bg-[#990000]/8 text-[#990000] border border-[#990000]/25',
    icon: 'heart',
  },
}

const PRIORITY: BadgeId[] = ['founder', 'captain', 'founding-member', 'member', 'parent']

const FOUNDER_EMAILS = new Set<string>([
  'rtchang@sas.upenn.edu',
  'ryan.taylor.chang@gmail.com',
])

const TEAM_SLUG = 'penn-mens-golf'

/**
 * Resolve the badges for a single account. Returns an empty list if the
 * account is null (e.g. an unclaimed member book entry).
 */
export function getBadgesForAccount(account: Account | null | undefined): BadgeId[] {
  if (!account) return []
  const out: BadgeId[] = []
  const email = (account.email ?? '').toLowerCase().trim()

  if (FOUNDER_EMAILS.has(email)) out.push('founder')
  if (isCaptain(email, TEAM_SLUG)) out.push('captain')

  const sub = account.subscription
  if (sub && (sub.status === 'active' || sub.status === 'trialing')) {
    const priceId = sub.priceId
    if (priceId && priceId === process.env.STRIPE_FOUNDING_PRICE_ID) {
      out.push('founding-member')
    } else if (priceId && priceId === process.env.STRIPE_PARENT_PRICE_ID) {
      out.push('parent')
    } else if (priceId) {
      // Any active sub that isn't Founding or Parent is a base Member.
      out.push('member')
    }
  }

  // De-dup + sort by priority order so visible left → right reads as
  // strongest → weakest.
  const seen = new Set(out)
  return PRIORITY.filter(b => seen.has(b))
}

/**
 * Lookup helper — finds the account linked to a personId and computes its
 * badges. Callers in route handlers should pass the already-loaded
 * accounts array to avoid a second store read.
 */
export function badgesForPerson(
  personId: string,
  accounts: Account[],
): BadgeId[] {
  const account = accounts.find(a => a.linkedPersonId === personId)
  return getBadgesForAccount(account)
}
