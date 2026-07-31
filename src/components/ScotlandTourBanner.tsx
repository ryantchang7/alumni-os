/**
 * ScotlandTourBanner — cross-site pointer to /scotland.
 * `featured` = full navy card (Clubhouse home, Team Room);
 * `slim` = single-row bar (19th Hole). No hooks — safe in server pages.
 */

import Link from 'next/link'

export default function ScotlandTourBanner({ variant }: { variant: 'featured' | 'slim' }) {
  if (variant === 'slim') {
    return (
      <Link
        href="/scotland"
        className="flex items-center justify-between gap-3 bg-[#0a1628] text-white rounded-xl px-5 py-3.5 border border-[#c8a84b]/45 hover:border-[#c8a84b] transition-colors group"
      >
        <p className="text-[13px] leading-snug">
          <span className="font-semibold text-[#c8a84b]">Scotland, October 2026</span>
          <span className="text-white/80"> — the team plays St Andrews, and the Penn Golf family goes too.</span>
        </p>
        <span className="text-[#c8a84b] text-[13px] font-semibold whitespace-nowrap group-hover:translate-x-0.5 transition-transform">
          See the trip →
        </span>
      </Link>
    )
  }

  return (
    <Link
      href="/scotland"
      className="block bg-[#0a1628] text-white rounded-2xl px-6 sm:px-8 py-6 sm:py-7 border border-[#c8a84b]/45 hover:border-[#c8a84b] transition-colors group"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.08), 0 10px 30px rgba(10,22,40,0.14)' }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#c8a84b] mb-2">
        October 2026 · St Andrews, Scotland
      </p>
      <p className="text-white text-xl sm:text-2xl font-medium font-heading mb-1.5">
        Penn Golf is going to Scotland.
      </p>
      <p className="text-white/75 text-[13.5px] sm:text-[14px] leading-relaxed max-w-2xl">
        The team competes in the St Andrews Links Collegiate — then alumni and
        family join for three days at the Old Course Hotel, Kingsbarns, and
        Carnoustie.
      </p>
      <span className="inline-block mt-3 text-[13px] font-semibold text-[#c8a84b] group-hover:translate-x-0.5 transition-transform">
        See the trip →
      </span>
    </Link>
  )
}
