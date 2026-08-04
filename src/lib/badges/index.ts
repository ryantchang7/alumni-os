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
  | 'coach'

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

export interface BadgeGlow {
  /** CSS box-shadow value for the insignia glow. */
  boxShadow: string
}

export const BADGE_META: Record<BadgeId, BadgeMeta & { glow?: BadgeGlow }> = {
  // Founder — deepest navy gradient, gold text, gold ring, gold halo glow.
  founder: {
    id: 'founder',
    label: 'Founder',
    tooltip: 'Built the Penn Golf Clubhouse',
    className:
      'bg-gradient-to-br from-[#0a1628] via-[#0f1f3d] to-[#0a1628] text-[#c8a84b] border border-[#c8a84b]/80',
    icon: 'crown',
    glow: {
      boxShadow:
        '0 0 0 1px rgba(200,168,75,0.30), 0 1px 2px rgba(10,22,40,0.22), 0 4px 18px rgba(200,168,75,0.28), 0 0 28px rgba(200,168,75,0.12)',
    },
  },
  // Captain — leadership tier. Navy gradient, GOLD ring, soft gold glow.
  // Clearly above Member; distinctly below Founder.
  captain: {
    id: 'captain',
    label: 'PGC Captain',
    tooltip: 'Penn Golf Clubhouse Captain',
    className:
      'bg-gradient-to-br from-[#0d1e38] to-[#0a1628] text-[#e8d49c] border border-[#c8a84b]/70',
    icon: 'shield',
    glow: {
      boxShadow:
        '0 0 0 1px rgba(200,168,75,0.20), 0 1px 2px rgba(10,22,40,0.20), 0 3px 12px rgba(200,168,75,0.20)',
    },
  },
  // Founding Member — richer gold gradient, warm glow.
  'founding-member': {
    id: 'founding-member',
    label: 'Founding Member',
    tooltip: 'Founding Member of the Clubhouse',
    className:
      'bg-gradient-to-br from-[#c8a84b]/28 to-[#c8a84b]/14 text-[#7a6420] border border-[#c8a84b]/65',
    icon: 'star',
    glow: {
      boxShadow:
        '0 0 0 1px rgba(200,168,75,0.18), 0 1px 2px rgba(10,22,40,0.10), 0 3px 10px rgba(200,168,75,0.18)',
    },
  },
  // Supporting Member — clean cream/tan, polished but humble.
  member: {
    id: 'member',
    label: 'Supporting Member',
    tooltip: 'Supporting Member of the Clubhouse',
    className:
      'bg-gradient-to-br from-[#faf7f2] to-[#f3efe8] text-[#4a5568] border border-[rgba(180,168,150,0.65)]',
    icon: 'check',
    glow: {
      boxShadow:
        '0 0 0 1px rgba(180,168,150,0.20), 0 1px 2px rgba(10,22,40,0.08)',
    },
  },
  // Family & Affiliate — soft Penn-red gradient, subtle red glow.
  parent: {
    id: 'parent',
    label: 'Family & Affiliate',
    tooltip: 'Family or longtime affiliate of the program',
    className:
      'bg-gradient-to-br from-[#990000]/12 to-[#990000]/6 text-[#990000] border border-[#990000]/38',
    icon: 'heart',
    glow: {
      boxShadow:
        '0 0 0 1px rgba(153,0,0,0.14), 0 1px 2px rgba(10,22,40,0.08), 0 3px 10px rgba(153,0,0,0.12)',
    },
  },
  // Coaching staff — navy, so it reads as program authority, not a supporter.
  coach: {
    id: 'coach',
    label: 'Coach',
    tooltip: "Penn Men's Golf coaching staff",
    className:
      'bg-gradient-to-br from-[#0a1628]/12 to-[#0a1628]/6 text-[#0a1628] border border-[#0a1628]/35',
    icon: 'shield',
    glow: {
      boxShadow:
        '0 0 0 1px rgba(10,22,40,0.14), 0 1px 2px rgba(10,22,40,0.08), 0 3px 10px rgba(10,22,40,0.12)',
    },
  },
}

const PRIORITY: BadgeId[] = ['founder', 'captain', 'coach', 'founding-member', 'member', 'parent']

export const FOUNDER_EMAILS = new Set<string>([
  'rtchang@sas.upenn.edu',
  'rtchang@upenn.edu',
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
  memberRole?: string,
): BadgeId[] {
  const account = accounts.find(a => a.linkedPersonId === personId)
  const badges = getBadgesForAccount(account)
  // Joining as family is free, so the 'parent' badge can't come from a paid
  // tier alone — otherwise family members render with no role signal at all.
  if (memberRole === 'parent' && !badges.includes('parent')) badges.push('parent')
  if (memberRole === 'coach' && !badges.includes('coach')) badges.push('coach')
  return badges
}
