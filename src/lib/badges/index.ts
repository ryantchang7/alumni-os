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
  // Founder is intentionally elaborate — gradient navy with gold text, gold
  // border + shadow halo. The renderer keys off `id === 'founder'` for the
  // extra shadow that Tailwind classNames can't easily express.
  founder: {
    id: 'founder',
    label: 'Founder',
    tooltip: 'Built the Penn Golf Clubhouse',
    className:
      'bg-gradient-to-r from-[#0a1628] to-[#1a2d4a] text-[#c8a84b] border border-[#c8a84b]/70',
    icon: 'crown',
  },
  // Captain — navy outline, matches the brand's primary surface chrome.
  captain: {
    id: 'captain',
    label: 'PGC Captain',
    tooltip: 'Penn Golf Clubhouse Captain',
    className:
      'bg-[#0a1628] text-white border border-[#0a1628]',
    icon: 'shield',
  },
  // Founding Member — gold accent, the brand's prestige color.
  'founding-member': {
    id: 'founding-member',
    label: 'Founding Member',
    tooltip: 'Founding Member of the Clubhouse',
    className:
      'bg-[#c8a84b]/20 text-[#7a6420] border border-[#c8a84b]/55',
    icon: 'star',
  },
  // Supporting Member — cream/muted, soft brand tone.
  member: {
    id: 'member',
    label: 'Supporting Member',
    tooltip: 'Supporting Member of the Clubhouse',
    className:
      'bg-[#faf7f2] text-[#3d4a5c] border border-[rgba(180,168,150,0.55)]',
    icon: 'check',
  },
  // Family & Affiliate — Penn red, the brand's warmth/accent color, but
  // softer than a Captain's navy.
  parent: {
    id: 'parent',
    label: 'Family & Affiliate',
    tooltip: 'Family or longtime affiliate of the program',
    className:
      'bg-[#990000]/8 text-[#990000] border border-[#990000]/30',
    icon: 'heart',
  },
}

const PRIORITY: BadgeId[] = ['founder', 'captain', 'founding-member', 'member', 'parent']

export const FOUNDER_EMAILS = new Set<string>([
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
  const isFounder = FOUNDER_EMAILS.has(email)

  if (isFounder) {
    out.push('founder')
    // The Founder is the founding-est member by definition. Auto-grant the
    // Founding Member badge so it shows even without an active subscription.
    out.push('founding-member')
  }
  if (account.manualCaptain === true || isCaptain(email, TEAM_SLUG)) out.push('captain')

  const sub = account.subscription
  if (sub && (sub.status === 'active' || sub.status === 'trialing')) {
    const priceId = sub.priceId
    if (priceId && priceId === process.env.STRIPE_FOUNDING_PRICE_ID) {
      out.push('founding-member')
    } else if (priceId && priceId === process.env.STRIPE_PARENT_PRICE_ID) {
      out.push('parent')
    } else if (priceId) {
      // Any active sub that isn't Founding or Parent is a base Supporting Member.
      out.push('member')
    }
  }

  // Manual grants from /internal/roles — founder-set, no Stripe sub required.
  if (account.manualBadges) {
    for (const b of account.manualBadges) {
      if (b === 'founding-member' || b === 'member' || b === 'parent') out.push(b)
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
