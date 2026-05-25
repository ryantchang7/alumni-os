'use client'

import { usePathname } from 'next/navigation'

/**
 * The clubhouse signature that closes every page. Thin gold rule + a
 * whisper-quiet attribution. Restraint over sitemap. Hidden on the
 * landing route so the cover image goes full-bleed.
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
      <div className="max-w-[1180px] mx-auto px-6 sm:px-10 py-6 text-center">
        <p className="text-[10.5px] text-[#8a7f70] tracking-[0.06em]">
          Built by{' '}
          <a
            href="https://www.linkedin.com/in/ryantchang/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0a1628] hover:text-[#990000] hover:underline transition-colors"
          >
            Ryan Chang
          </a>
          .
        </p>
      </div>
    </footer>
  )
}
