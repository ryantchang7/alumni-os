/**
 * Penn Golf crest. Used in the nav, the welcome moment, and the footer
 * signature. Built as inline SVG so it scales cleanly from 24px (nav) to
 * 96px (welcome). Two layered rings, navy field, gold serif "P" with two
 * crossed clubs underneath and "1894" set in tiny gold caps.
 *
 * The crest is monochromatic-by-default (gold-on-navy). The "tone" prop
 * gives an inverted version (navy-on-cream) for surfaces like the footer
 * signature where we sit on parchment.
 */
interface Props {
  size?: number
  tone?: 'gold' | 'navy'
  className?: string
}

export default function PennGolfCrest({
  size = 40,
  tone = 'gold',
  className = '',
}: Props) {
  const isGold = tone === 'gold'
  const field = isGold ? '#0a1628' : '#faf6ec'
  const accent = isGold ? '#c8a84b' : '#0a1628'
  const accentSoft = isGold ? '#9c8438' : '#3d4a5c'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden
    >
      {/* Outer ring */}
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="none"
        stroke={accent}
        strokeWidth="2"
      />
      {/* Inner field */}
      <circle cx="32" cy="32" r="27" fill={field} />
      {/* Inner ring (thinner) */}
      <circle
        cx="32"
        cy="32"
        r="24"
        fill="none"
        stroke={accent}
        strokeWidth="0.8"
        opacity="0.8"
      />

      {/* Serif "P" — drawn so it reads at small sizes */}
      <text
        x="32"
        y="36"
        textAnchor="middle"
        fontFamily="var(--font-playfair), Georgia, serif"
        fontSize="26"
        fontWeight="500"
        fill={accent}
        style={{ letterSpacing: '0.04em' }}
      >
        P
      </text>

      {/* Crossed clubs under the P — two thin lines with grip caps */}
      <g stroke={accent} strokeWidth="1.4" strokeLinecap="round">
        <line x1="22" y1="44" x2="32" y2="50" />
        <line x1="42" y1="44" x2="32" y2="50" />
        {/* Tiny club heads */}
        <circle cx="22" cy="44" r="1.3" fill={accent} />
        <circle cx="42" cy="44" r="1.3" fill={accent} />
      </g>

      {/* Year ring around the bottom */}
      <text
        x="32"
        y="58"
        textAnchor="middle"
        fontFamily="var(--font-playfair), Georgia, serif"
        fontSize="5.2"
        letterSpacing="2"
        fill={accentSoft}
      >
        1894
      </text>
    </svg>
  )
}
