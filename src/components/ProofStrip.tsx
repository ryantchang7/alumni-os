/**
 * ProofStrip — the "this is real" line. Static Member Book facts, so it
 * renders identically on launch day and a year in.
 *
 * `variant="line"` is the one-line gold form for the landing splash;
 * `variant="plaques"` is the four-card band for /launch.
 */

import { BOOK_PROOF, BOOK_PROOF_STATS } from '@/lib/proof'

export default function ProofStrip({
  variant = 'plaques',
  className = '',
}: {
  variant?: 'line' | 'plaques'
  className?: string
}) {
  if (variant === 'line') {
    return (
      <p
        className={`text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b] ${className}`}
      >
        {BOOK_PROOF.members} members · {BOOK_PROOF.earliestYear}–{BOOK_PROOF.latestYear} ·{' '}
        {BOOK_PROOF.generations} generations
      </p>
    )
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 ${className}`}>
      {BOOK_PROOF_STATS.map(s => (
        <div
          key={s.label}
          className="bg-white/[0.06] border border-white/15 rounded-xl px-4 py-3.5 text-center"
        >
          <p className="text-white text-2xl sm:text-3xl font-medium font-heading leading-none">
            {s.value}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60 mt-1.5">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  )
}
