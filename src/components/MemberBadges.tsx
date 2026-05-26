'use client'

import { Crown, Shield, Star, Check, Heart, type LucideIcon } from 'lucide-react'
import { BADGE_META, type BadgeId } from '@/lib/badges'

const ICONS: Record<string, LucideIcon> = {
  crown: Crown,
  shield: Shield,
  star: Star,
  check: Check,
  heart: Heart,
}

interface Props {
  badges: BadgeId[] | undefined
  /** Sizes the chip — 'sm' fits inline next to a name. */
  size?: 'sm' | 'md'
  /** If true, only show the icon (no label). Useful in tight rows. */
  iconOnly?: boolean
}

/**
 * Renders the set of badges a member has earned (Founder / Captain /
 * Founding Member / Member / Parent). Returns null when the list is empty
 * so the layout doesn't reserve space.
 */
export default function MemberBadges({ badges, size = 'sm', iconOnly = false }: Props) {
  if (!badges || badges.length === 0) return null
  const padding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1'
  const text = size === 'sm' ? 'text-[10px]' : 'text-[11px]'
  const iconSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'

  return (
    <span className="inline-flex items-center gap-1 flex-wrap">
      {badges.map(b => {
        const meta = BADGE_META[b]
        if (!meta) return null
        const Icon = ICONS[meta.icon]
        return (
          <span
            key={b}
            title={meta.tooltip}
            aria-label={meta.tooltip}
            className={`${padding} ${text} ${meta.className} rounded-full inline-flex items-center gap-1 font-semibold uppercase tracking-[0.08em] whitespace-nowrap`}
          >
            {Icon ? <Icon className={iconSize} /> : null}
            {iconOnly ? null : meta.label}
          </span>
        )
      })}
    </span>
  )
}
