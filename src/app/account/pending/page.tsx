import Link from 'next/link'
import { Clock, Users } from 'lucide-react'

export default function ClaimPendingPage() {
  return (
    <div className="min-h-[calc(100dvh-60px)] bg-[#f4ecdb] px-6 py-16 sm:py-24 flex items-center justify-center">
      <div
        className="w-full max-w-md bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl px-8 py-10 text-center"
        style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.06)' }}
      >
        <Clock className="w-7 h-7 text-[#c8a84b] mx-auto mb-4" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-muted mb-2">
          Penn Men&rsquo;s Golf
        </p>
        <h1
          className="text-[#0a1628] text-2xl font-medium mb-3 font-heading"
        >
          In front of the captain.
        </h1>
        <p className="text-[13.5px] text-[#3d4a5c] leading-relaxed mb-2">
          Your claim is in the captain&rsquo;s queue. We confirm everyone by
          hand so the Penn Golf family stays close.
        </p>
        <p className="text-[13.5px] text-[#3d4a5c] leading-relaxed mb-8">
          You&rsquo;ll get an email at the address you signed in with as soon as
          you&rsquo;re approved — usually within a day or two.
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href="/player"
            className="bg-[#0a1628] hover:bg-[#112240] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-3 rounded-lg transition-colors"
          >
            Look around the Clubhouse
          </Link>
          <Link
            href="/member-book"
            className="text-[12px] text-ink-muted hover:text-[#0a1628] py-2"
          >
            Browse the Member Book
          </Link>
        </div>

        {/* Invite nudge */}
        <div className="mt-6 pt-6 border-t border-[rgba(180,168,150,0.3)]">
          <Link
            href="/invite"
            className="flex items-center gap-2.5 text-left group"
          >
            <Users className="w-4 h-4 text-[#c8a84b] flex-shrink-0" />
            <span className="text-[12.5px] text-[#3d4a5c] group-hover:text-[#0a1628] transition-colors">
              Who else should be here?{' '}
              <span className="font-semibold text-[#0a1628] group-hover:underline">
                Invite your teammates &rarr;
              </span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
