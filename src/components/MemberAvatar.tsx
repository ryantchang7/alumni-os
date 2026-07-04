// Shared member avatar: shows the member's photo when present, otherwise a
// clean initials circle. Used on every surface a member appears so photos are
// consistent across the app. Photos are remote (Vercel Blob / Google), so the
// <img> is lazy-loaded and sized to avoid layout shift.

interface MemberAvatarProps {
  /** Merged photo: enrichment.photoUrl ?? account.image. */
  photoUrl?: string | null
  /** Member name — drives the initials fallback + alt text. */
  name: string
  /** Rendered size in px (square). Default 48. */
  size?: number
  /** Fallback circle tone: 'navy' (default, on light bg), 'red' (family/affiliate), 'onDark' (on a dark header). */
  tone?: 'navy' | 'red' | 'onDark'
  className?: string
}

// "Engraved yearbook plate" — the no-photo state is designed, not a plain
// grey circle, since ~50 members means plenty of unclaimed/no-upload cards.
// onDark gets a lighter glass fill (not another navy-on-navy gradient,
// which would nearly disappear against the header it already sits on).
const FALLBACK_TONE = {
  navy: 'bg-gradient-to-br from-[#0a1628] to-[#060e1a] text-gold border-gold/40',
  red: 'bg-gradient-to-br from-[#0a1628] to-[#990000] text-gold border-gold/40',
  onDark: 'bg-gradient-to-br from-white/20 to-white/5 text-gold border-gold/35',
} as const

const PHOTO_BORDER = {
  navy: 'border-[rgba(180,168,150,0.5)]',
  red: 'border-[rgba(180,168,150,0.5)]',
  onDark: 'border-white/15',
} as const

export default function MemberAvatar({
  photoUrl,
  name,
  size = 48,
  tone = 'navy',
  className = '',
}: MemberAvatarProps) {
  const dims = { width: size, height: size }

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        style={dims}
        className={`rounded-full object-cover border flex-shrink-0 ${PHOTO_BORDER[tone]} ${className}`}
      />
    )
  }

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div
      style={dims}
      className={`rounded-full flex items-center justify-center flex-shrink-0 border ${FALLBACK_TONE[tone]} ${className}`}
      aria-hidden
    >
      <span
        className="font-heading italic font-medium leading-none"
        style={{ fontSize: Math.round(size * 0.4) }}
      >
        {initials}
      </span>
    </div>
  )
}
