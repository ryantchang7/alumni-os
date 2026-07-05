import Link from 'next/link'
import { ArrowRight, Check, MapPin } from 'lucide-react'
import MemberAvatar from '@/components/MemberAvatar'
import MemberBadges from '@/components/MemberBadges'
import type { BadgeId } from '@/lib/badges'

/**
 * The one alumni-card component. Replaces three near-identical components
 * that had drifted apart cosmetically while showing the same underlying
 * data: AlumniRoundCard (the-course), MemberCard (19th-hole), MiniMemberCard
 * (player). Consolidating means the Heritage card treatment (yearbook-plate
 * avatar via MemberAvatar) lands in one place instead of three.
 *
 * `full` reproduces the richer the-course/19th-hole card; `mini` reproduces
 * the compact horizontal-scroll chip used on /player. accentColor lets
 * the-course keep its green "Open to a round" identity while 19th-hole
 * stays neutral, without forking the component.
 */

interface AlumniCardProps {
  variant?: 'full' | 'mini'
  href: string
  name: string
  photoUrl?: string | null
  avatarTone?: 'navy' | 'red' | 'onDark'
  /** Class year / roster label — e.g. "Class of '24" or "Penn Golf '19–23". */
  subline?: string | null
  /** Parent/affiliate relationship line — takes priority over subline+handicap
   *  in the `full` variant when present (matches the old MemberCard branch). */
  relationship?: string | null
  location?: string | null
  handicap?: string | null
  /** GHIN number — renders a small "GHIN" credential next to the handicap
   *  when present, so a typed index reads as verified. */
  ghin?: string | null
  /** Career line — "Analyst · Goldman Sachs". */
  careerLine?: string | null
  /** Favorite-courses quote — the-course only. */
  quote?: string | null
  /** Small "Open"-style pill in the accent color, top-right (the-course). */
  showOpenBadge?: boolean
  /** Green "Player" pill (mini variant, player.tsx's current-player rows). */
  isCurrentPlayer?: boolean
  badges?: BadgeId[]
  accentColor?: string
  ctaLabel?: string
}

export default function AlumniCard({
  variant = 'full',
  href,
  name,
  photoUrl,
  avatarTone = 'navy',
  subline,
  relationship,
  location,
  handicap,
  ghin,
  careerLine,
  quote,
  showOpenBadge,
  isCurrentPlayer,
  badges,
  accentColor = '#0a1628',
  ctaLabel = 'View profile',
}: AlumniCardProps) {
  if (variant === 'mini') {
    return (
      <Link
        href={href}
        className="block bg-[#f8f5f0] border border-[rgba(180,168,150,0.4)] rounded-lg p-3 hover:bg-white hover:shadow-sm transition-all group flex-shrink-0 w-[200px]"
      >
        <div className="flex items-start gap-2">
          <MemberAvatar photoUrl={photoUrl} name={name} size={32} tone={avatarTone} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-1 mb-1">
              <p className="font-semibold text-[#0a1628] text-xs leading-snug truncate">{name}</p>
              {isCurrentPlayer && (
                <span className="flex-shrink-0 text-[11px] font-semibold text-[#2d6a4f] bg-[#2d6a4f]/10 px-1.5 py-0.5 rounded-full">
                  Player
                </span>
              )}
            </div>
            {badges && badges.length > 0 && (
              <div className="mb-1">
                <MemberBadges badges={badges} size="sm" iconOnly />
              </div>
            )}
            {subline && <p className="text-[10px] text-ink-muted">{subline}</p>}
            {careerLine && <p className="text-[10px] text-[#4a5568] mt-0.5 truncate">{careerLine}</p>}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className="group block bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden hover:shadow-md transition-all"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
    >
      <div
        className="px-5 py-4"
        style={{ borderLeft: `4px solid ${accentColor}` }}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-3 min-w-0">
            <MemberAvatar photoUrl={photoUrl} name={name} size={44} tone={avatarTone} />
            <div className="min-w-0">
              <p className="text-[#0a1628] text-base font-medium leading-snug font-heading">{name}</p>
              {relationship ? (
                <p className="text-[13px] text-[#990000] mt-0.5">{relationship}</p>
              ) : (
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {subline && <p className="text-[11.5px] text-ink-muted">{subline}</p>}
                  {handicap && (
                    <span
                      className="text-[10px] font-semibold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-full whitespace-nowrap"
                      style={{ color: accentColor, backgroundColor: `${accentColor}14`, border: `1px solid ${accentColor}40` }}
                    >
                      HCP {handicap}
                    </span>
                  )}
                  {ghin && (
                    <span
                      className="inline-flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-full whitespace-nowrap text-gold-ink bg-gold/12 border border-gold/40"
                      title={`GHIN #${ghin}`}
                    >
                      <Check className="w-2.5 h-2.5" /> GHIN
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          {showOpenBadge && (
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.16em] px-2 py-1 rounded-full whitespace-nowrap"
              style={{ color: accentColor, backgroundColor: `${accentColor}14`, border: `1px solid ${accentColor}40` }}
            >
              Open
            </span>
          )}
        </div>
        {location && (
          <div className="flex items-center gap-1.5 text-[12px] text-[#4a5568] mt-1">
            <MapPin className="w-3 h-3 text-ink-muted" />
            <span>{location}</span>
          </div>
        )}
        {careerLine && (
          <p className="text-[12px] text-[#4a5568] mt-1">{careerLine}</p>
        )}
        {quote && (
          <p className="text-[12px] text-[#3d4a5c] mt-2 italic leading-relaxed">&ldquo;{quote}&rdquo;</p>
        )}
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#990000] mt-3 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex items-center gap-1">
          {ctaLabel} <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  )
}
