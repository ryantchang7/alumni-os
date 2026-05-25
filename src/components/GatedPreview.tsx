import Link from 'next/link'
import { Lock } from 'lucide-react'

interface PreviewStat {
  label: string
  value: string | number
}

interface Props {
  /** Eyebrow above the headline — e.g. "Members only · 19th Hole" */
  eyebrow: string
  /** Display-serif headline, ~2-6 words */
  headline: string
  /** One-sentence value prop */
  blurb: string
  /** Optional 2–4 stats to build curiosity */
  stats?: PreviewStat[]
  /** True if the viewer is signed in but unclaimed. False if not signed in. */
  signedIn: boolean
}

/**
 * Renders the "preview tease" for non-approved viewers on member-only
 * pages. Aggregate counts only — no specifics, no names. The CTA routes
 * signed-in unclaimed users to /account/setup and visitors to /login.
 */
export default function GatedPreview({
  eyebrow,
  headline,
  blurb,
  stats,
  signedIn,
}: Props) {
  const ctaHref = signedIn ? '/account/setup' : '/login?next=/account/setup'
  const ctaLabel = signedIn ? 'Claim your card' : 'Sign in to claim'

  return (
    <div className="max-w-[820px] mx-auto px-6 sm:px-8 py-12 sm:py-16">
      <div
        className="bg-white border border-[rgba(180,168,150,0.45)] rounded-2xl p-8 sm:p-12 text-center"
        style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 10px 28px rgba(10,22,40,0.06)' }}
      >
        <span
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#0a1628] text-white mb-5"
          aria-hidden
        >
          <Lock className="w-4 h-4" />
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#990000] mb-3">
          {eyebrow}
        </p>
        <h1
          className="text-[#0a1628] text-3xl sm:text-4xl font-medium leading-tight mb-3"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          {headline}
        </h1>
        <p className="text-[14px] sm:text-[15px] text-[#3d4a5c] max-w-md mx-auto leading-relaxed mb-7">
          {blurb}
        </p>

        {stats && stats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-md mx-auto mb-8">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-[#faf7f2] border border-[rgba(180,168,150,0.35)] rounded-lg py-3 px-2"
              >
                <p
                  className="text-[#0a1628] text-xl font-medium leading-none mb-1"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  {s.value}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#8a7f70]">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}

        <Link
          href={ctaHref}
          className="inline-block bg-[#0a1628] hover:bg-[#112240] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-6 py-3 rounded-lg transition-colors"
        >
          {ctaLabel}
        </Link>
        <p className="text-[11px] text-[#8a7f70] mt-4">
          Approved by the captain within a day or two.
        </p>
      </div>
    </div>
  )
}
