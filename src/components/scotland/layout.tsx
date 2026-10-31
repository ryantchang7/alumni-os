/**
 * The two measurements and the one section label that every chapter of
 * /scotland shares. Kept in one place so the article holds a single rhythm
 * rather than drifting a few pixels per section.
 */

/** Outer gutter. Photographs and results tables sit on this. */
export const WRAP = 'mx-auto w-full max-w-[1240px] px-5 sm:px-8'

/** Reading measure, roughly 70 characters. Body copy only. */
export const MEASURE = 'max-w-[660px]'

/** Small gold- or red-ruled section label. */
export function Eyebrow({
  children,
  tone = 'ink',
}: {
  children: React.ReactNode
  tone?: 'ink' | 'gold'
}) {
  return (
    <p
      className={`eyebrow mb-4 flex items-center gap-3 ${
        tone === 'gold' ? 'text-[#c8a84b]' : 'text-[#990000]'
      }`}
    >
      <span
        aria-hidden
        className={`h-px w-7 ${tone === 'gold' ? 'bg-[#c8a84b]/60' : 'bg-[#990000]/40'}`}
      />
      {children}
    </p>
  )
}
