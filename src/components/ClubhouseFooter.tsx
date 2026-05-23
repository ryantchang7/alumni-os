import Link from 'next/link'
import PennGolfCrest from '@/components/PennGolfCrest'

/**
 * The clubhouse signature that closes every page. Thin gold rule + a
 * single line of club stationery copy + a small crest. Restraint over
 * sitemap — this is not a typical site footer with eight columns of
 * links; it's the way a country club closes a letter.
 */
export default function ClubhouseFooter() {
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
      <div className="max-w-[1180px] mx-auto px-6 sm:px-10 py-10 flex flex-col items-center gap-4">
        <PennGolfCrest size={42} tone="navy" />
        <p
          className="text-[#3d4a5c] text-[12px] tracking-[0.18em] uppercase font-medium text-center"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          Penn Men&rsquo;s Golf · Founded 1894 · Pin&rsquo;s Still In
        </p>
        <p className="text-[10.5px] text-[#8a7f70] italic">
          A clubhouse for members only.{' '}
          <Link
            href="/account/profile"
            className="not-italic underline-offset-2 hover:underline"
          >
            Your locker
          </Link>
          .
        </p>
      </div>
    </footer>
  )
}
