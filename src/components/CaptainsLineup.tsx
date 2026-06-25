/**
 * CaptainsLineup — "Your Clubhouse Captains" section.
 *
 * Resolves accounts that hold founder or captain-tier status, finds their
 * linked person + enrichment for photo/name, and renders them as an
 * on-brand row of MemberAvatar + name + badge.
 *
 * Server component — no client boundary needed; no interactivity required.
 */

import type { Store } from '@/lib/store/types'
import { getBadgesForAccount } from '@/lib/badges'
import MemberAvatar from '@/components/MemberAvatar'
import MemberBadges from '@/components/MemberBadges'

interface Props {
  store: Store
  teamId: string
}

export default function CaptainsLineup({
  store,
  teamId,
}: Props) {
  // Collect all accounts that are founder or captain for this team.
  const captainAccounts = store.accounts.filter(a => {
    if (a.teamId !== teamId) return false
    const badges = getBadgesForAccount(a)
    return badges.includes('founder') || badges.includes('captain')
  })

  if (captainAccounts.length === 0) return null

  // For each captain account, resolve their linked person + enrichment photo.
  const captains = captainAccounts.map(account => {
    const person = account.linkedPersonId
      ? store.people.find(p => p.id === account.linkedPersonId)
      : null
    const enrichment = account.linkedPersonId
      ? store.personEnrichments.find(
          e => e.personId === account.linkedPersonId && e.teamId === teamId,
        )
      : null
    const displayName = person?.canonicalName ?? account.name ?? 'Captain'
    const photoUrl = enrichment?.photoUrl ?? account.image ?? null
    const badges = getBadgesForAccount(account)
    // Show only the top badge (founder or captain) — keep it tight
    const topBadge = badges.find(b => b === 'founder' || b === 'captain')
    return { account, displayName, photoUrl, badges: topBadge ? [topBadge] : badges }
  })

  return (
    <section>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c8a84b] mb-1.5">
        Leadership
      </p>
      <h2 className="text-base font-semibold text-[#0a1628] mb-1">
        Clubhouse Captains
      </h2>
      <p className="text-sm text-[#8a7f70] mb-5">
        The members who built and look after the Clubhouse — your point people for the Penn Golf family.
      </p>
      <div className="flex flex-wrap gap-4">
        {captains.map(({ account, displayName, photoUrl, badges }) => (
          <div
            key={account.id}
            className="flex items-center gap-3 bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-4 py-3"
            style={{
              boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)',
            }}
          >
            <MemberAvatar
              photoUrl={photoUrl}
              name={displayName}
              size={40}
              tone="navy"
            />
            <div className="min-w-0">
              <p
                className="text-sm font-semibold text-[#0a1628] leading-snug"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                {displayName}
              </p>
              <div className="mt-1">
                <MemberBadges badges={badges} size="sm" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
