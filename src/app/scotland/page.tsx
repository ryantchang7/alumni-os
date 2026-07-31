/**
 * /scotland — the Penn Golf Scotland Tour, October 2026.
 *
 * Announcement page: the team competes in the St Andrews Links Collegiate
 * (Oct 12–14), then alumni + family join for the tour (Oct 14–17).
 * Registration closed June 30, 2026 — so this page celebrates the trip
 * and points questions to the Penn Champions Club. No signup CTA.
 *
 * Hero image comes from the `scotland.hero-image` Studio slot; empty =
 * text-led hero (same convention as /launch's film section).
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { getSiteContentOrDefault } from '@/lib/site-content/read'

export const metadata: Metadata = {
  title: 'Scotland Tour · Penn Golf Clubhouse',
  description:
    'Penn Golf is going to Scotland — the St Andrews Links Collegiate, then an alumni & family tour through St Andrews, Kingsbarns, and Carnoustie. October 14–17, 2026.',
}

const ITINERARY = [
  {
    day: 'Wednesday, Oct 14',
    title: 'Arrival & the Castle Course',
    lines: [
      'Land in Scotland, transfer to St Andrews',
      'Round at the St Andrews Castle Course (alumni only)',
      'Check in at the Old Course Hotel · free evening in town',
    ],
  },
  {
    day: 'Thursday, Oct 15',
    title: 'Kingsbarns',
    lines: [
      'Round at Kingsbarns Golf Links',
      'Penn coaches and student-athletes join the group',
      'Team dinner at the Rusacks Hotel, overlooking the Old Course',
    ],
  },
  {
    day: 'Friday, Oct 16',
    title: 'Carnoustie',
    lines: [
      'Round at Carnoustie Golf Links',
      'Farewell dinner at the Carnoustie Clubhouse',
    ],
  },
  {
    day: 'Saturday, Oct 17',
    title: 'Departure',
    lines: ['Breakfast at the hotel', 'Transfer to Edinburgh Airport'],
  },
]

const PACKAGES = [
  { name: 'Bronze', price: '$5,000', detail: 'The full Scotland trip experience.' },
  {
    name: 'Silver',
    price: '$7,500',
    detail: 'The full trip, plus a $2,500 tax-deductible gift sponsoring one Penn student-athlete.',
  },
  {
    name: 'Gold',
    price: '$10,000',
    detail: 'The full trip, plus a $5,000 tax-deductible gift sponsoring two Penn student-athletes.',
  },
]

export default async function ScotlandPage() {
  const heroImage = await getSiteContentOrDefault('scotland.hero-image')

  return (
    <div className="bg-[#fbf9f6] min-h-[calc(100dvh-60px)]">
      {/* Hero */}
      <section className="bg-[#0a1628] text-white px-5 sm:px-8 pt-20 pb-24 sm:pt-24 sm:pb-28 relative overflow-hidden">
        {heroImage && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628]/60 via-[#0a1628]/40 to-[#0a1628]" />
          </>
        )}
        <div className="max-w-[1080px] mx-auto relative z-10">
          <p className="text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-[0.32em] text-[#c8a84b] mb-5">
            Penn Men&rsquo;s Golf · October 2026
          </p>
          <h1 className="text-white text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight leading-[1.02] mb-5 max-w-3xl font-heading">
            Penn Golf is going to Scotland.
          </h1>
          <p className="font-heading text-white/85 text-xl sm:text-2xl max-w-2xl leading-snug mb-5" style={{ fontStyle: 'italic' }}>
            The team tees it up in the St Andrews Links Collegiate, October 12–14.
            Then the Penn Golf family joins them across the pond, October 14–17.
          </p>
          <p className="text-white/75 text-[14.5px] sm:text-base max-w-2xl leading-relaxed">
            Three nights at the Old Course Hotel. Rounds at the Castle Course,
            Kingsbarns, and Carnoustie. Dinners overlooking the Old Course. And a
            daily ballot chance to play the oldest course in the world.
          </p>
        </div>
      </section>

      {/* The tournament */}
      <section className="px-5 sm:px-8 py-14 sm:py-16">
        <div className="max-w-[1080px] mx-auto">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[#990000] mb-3">
            The Tournament
          </p>
          <h2 className="text-[#0a1628] text-3xl sm:text-4xl font-medium font-heading mb-4">
            St Andrews Links Collegiate
          </h2>
          <p className="text-[#3d4a5c] text-[15px] leading-relaxed max-w-2xl mb-4">
            54 holes in the home of golf, October 12–14, 2026 — one of the most
            prestigious events on the schedule. The extended trip means alumni,
            parents, and friends get to watch the team compete, then play the same
            coast themselves.
          </p>
          <Link
            href="/team-room"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0a1628] hover:text-[#990000] transition-colors"
          >
            See the full 2026–27 schedule in the Team Room →
          </Link>
        </div>
      </section>

      {/* Itinerary */}
      <section className="px-5 sm:px-8 pb-14 sm:pb-16">
        <div className="max-w-[1080px] mx-auto">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[#990000] mb-3">
            The Tour · Oct 14–17
          </p>
          <h2 className="text-[#0a1628] text-3xl sm:text-4xl font-medium font-heading mb-8">
            Four days on the links.
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {ITINERARY.map(d => (
              <div
                key={d.day}
                className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl p-6"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.05)' }}
              >
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b] mb-1.5">
                  {d.day}
                </p>
                <h3 className="text-[#0a1628] text-xl font-medium font-heading mb-3">{d.title}</h3>
                <ul className="space-y-1.5">
                  {d.lines.map(line => (
                    <li key={line} className="text-[13.5px] text-[#3d4a5c] leading-relaxed flex gap-2">
                      <span className="text-[#c8a84b] mt-[2px]">·</span>
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-ink-muted mt-6 max-w-2xl leading-relaxed">
            Every day: a ballot entry for a tee time on the Old Course itself. The
            package covers ground transportation and airport transfers, a College
            Links Golf ambassador throughout, clubhouse lunches with each round,
            and a first-tee gift pack.
          </p>
        </div>
      </section>

      {/* Packages (registration closed) */}
      <section className="px-5 sm:px-8 pb-14 sm:pb-16">
        <div className="max-w-[1080px] mx-auto">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[#990000] mb-3">
            The Packages
          </p>
          <h2 className="text-[#0a1628] text-3xl sm:text-4xl font-medium font-heading mb-4">
            How the trip supported the team.
          </h2>
          <p className="text-[#3d4a5c] text-[15px] leading-relaxed max-w-2xl mb-8">
            Registration ran through June 30, 2026, with three package levels —
            the higher tiers folding in a tax-deductible gift to the Penn Golf
            annual fund that directly sponsors student-athletes on this trip.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {PACKAGES.map(p => (
              <div
                key={p.name}
                className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl p-6"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.05)' }}
              >
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b] mb-1">
                  {p.name}
                </p>
                <p className="text-[#0a1628] text-3xl font-medium font-heading mb-2">{p.price}</p>
                <p className="text-[13px] text-[#3d4a5c] leading-relaxed">{p.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact + closing */}
      <section className="px-5 sm:px-8 pb-20">
        <div className="max-w-[1080px] mx-auto">
          <div className="bg-[#0a1628] text-white rounded-2xl px-7 sm:px-10 py-9 sm:py-11">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[#c8a84b] mb-3">
              Registered? Questions?
            </p>
            <h2 className="text-white text-2xl sm:text-3xl font-medium font-heading mb-3">
              The trip is organized with the Penn Champions Club.
            </h2>
            <p className="text-white/75 text-[14.5px] leading-relaxed max-w-2xl mb-5">
              For anything about the Scotland Tour — confirmations, logistics, or
              details — reach Charlie Carroll at the Penn Champions Club.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
              <a href="mailto:ccarrol2@upenn.edu" className="text-[#c8a84b] hover:underline font-medium">
                ccarrol2@upenn.edu
              </a>
              <a href="tel:+12158988899" className="text-[#c8a84b] hover:underline font-medium">
                (215) 898-8899
              </a>
            </div>
          </div>
          <p className="text-[13.5px] text-ink-muted mt-8 leading-relaxed">
            Going? Post your rounds and photos to{' '}
            <Link href="/moments" className="text-[#0a1628] font-medium hover:underline">
              Moments
            </Link>{' '}
            when we&rsquo;re back — the whole clubhouse will want to see it.
          </p>
        </div>
      </section>
    </div>
  )
}
