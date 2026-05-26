import Image from 'next/image'

/**
 * Penn Golf shield. The actual team logo (crossed irons behind a shield
 * with the red Penn P), sitting at /penn-golf-shield.png. Used in the
 * nav, the welcome moment, and the footer.
 *
 * The "tone" prop is preserved for API compat but is a no-op now —
 * the asset itself is the brand.
 */
interface Props {
  size?: number
  tone?: 'gold' | 'navy'
  className?: string
}

export default function PennGolfCrest({
  size = 40,
  tone: _tone = 'gold',
  className = '',
}: Props) {
  return (
    <Image
      src="/penn-golf-shield.png"
      alt="Penn Golf"
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: 'auto',
        objectFit: 'contain',
      }}
      priority={size >= 40}
    />
  )
}
