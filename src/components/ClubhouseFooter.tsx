'use client'

import { usePathname } from 'next/navigation'

/**
 * The clubhouse signature that closes every page. Just a thin gold
 * rule — the way a country club closes a letter. Restraint over
 * sitemap. Hidden on the landing route so the cover image goes
 * full-bleed.
 */
export default function ClubhouseFooter() {
  const pathname = usePathname()
  if (pathname === '/') return null

  return (
    <footer className="bg-[#f4ecdb] border-t border-[#d9c8a8]/40 mt-16">
      <div
        className="mx-auto"
        style={{
          width: '64px',
          height: '1px',
          background:
            'linear-gradient(90deg, transparent, rgba(200,168,75,0.55) 50%, transparent)',
          marginTop: '0',
        }}
      />
      <div className="max-w-[1180px] mx-auto px-6 sm:px-10 py-8" />
    </footer>
  )
}
