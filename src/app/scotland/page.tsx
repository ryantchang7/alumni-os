/**
 * /scotland — the Penn Golf Scotland Tour, October 2026.
 *
 * Recap, as of 18 October 2026. It ran as a preview until the team flew
 * home, which left it reading "Penn Golf is going to Scotland" four days
 * after the trip ended, on the page the Champions Club newsletter points at.
 *
 * Every figure here comes from Penn Athletics' own two recaps, 13 and 14
 * October. Nothing is estimated.
 *
 * Hero image comes from the `scotland.hero-image` Studio slot; empty =
 * text-led hero (same convention as /launch's film section).
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { getSiteContentOrDefault } from '@/lib/site-content/read'

export const metadata: Metadata = {
  title: 'Scotland Tour',
  description:
    'Penn Golf went to Scotland. Two rounds on the Jubilee, match play on the Old Course, and an alumni tour through Kingsbarns and Carnoustie. October 2026.',
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
            Penn Golf went to Scotland.
          </h1>
          <p className="font-heading text-white/85 text-xl sm:text-2xl max-w-2xl leading-snug mb-5" style={{ fontStyle: 'italic' }}>
            Two rounds on the Jubilee, match play on the Old Course, and a week
            the Penn Golf family spent together in the home of golf.
          </p>
          <p className="text-white/75 text-[14.5px] sm:text-base max-w-2xl leading-relaxed">
            The team finished fourth in a field of Penn, Texas, Washington and
            host St Andrews. Then alumni joined them for three nights at the Old
            Course Hotel and rounds at the Castle Course, Kingsbarns and
            Carnoustie.
          </p>
        </div>
      </section>

      {/* The tournament */}
      <section className="px-5 sm:px-8 py-14 sm:py-16">
        <div className="max-w-[1080px] mx-auto">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[#990000] mb-3">
            How it went · Oct 12–14
          </p>
          <h2 className="text-[#0a1628] text-3xl sm:text-4xl font-medium font-heading mb-4">
            St Andrews Links Collegiate
          </h2>
          <div className="text-[#3d4a5c] text-[15px] leading-relaxed max-w-2xl space-y-3 mb-6">
            <p>
              Two days of stroke play on the Jubilee Course against Texas,
              Washington and host St Andrews. Penn posted a two round total of
              66-over 766, an opening 360 followed by a 406 in conditions that
              took a toll on the whole field.
            </p>
            <p>
              Texas claimed the top seed at 23-over 723, St Andrews took second
              at 742 and Washington third at 743, which sent Penn into the
              consolation match{' '}
              <strong className="text-[#0a1628]">on the Old Course itself</strong>.
              Washington won it 5-1. Texas went on to take the title, beating
              St Andrews 4.5 to 1.5 in the championship match.
            </p>
            <p>
              Kayden Wang took Penn&rsquo;s only point of the final day, closing
              out his match 1-up and firing an even-par 72, the low round by a
              Penn golfer that Wednesday.
            </p>
          </div>

          {/* The individual results, which is the part an alum reads twice
              looking for a name they know. Straight from Penn's recap. */}
          <div className="mb-6 rounded-xl border border-[rgba(180,168,150,0.45)] bg-white overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-muted px-4 pt-3 pb-2">
              Stroke play, 36 holes on the Jubilee
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] border-collapse">
                <thead>
                  <tr className="bg-[#fbf9f6]">
                    {['Player', 'Finish', 'Total', 'Rounds'].map(h => (
                      <th key={h} className="text-left font-semibold text-[10px] uppercase tracking-[0.1em] text-ink-muted px-4 py-2 whitespace-nowrap border-b border-[rgba(180,168,150,0.4)]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Arjun Caprihan', '9th', '+7', '70 · 77'],
                    ['Hayden Adams', 'T-13th', '+12', '74 · 78'],
                    ['Kayden Wang', 'T-18th', '+14', '70 · 84'],
                    ['Oliver Uribe', '21st', '+15', '71 · 84'],
                    ['Ryan Chang', 'T-22nd', '+19', '76 · 83'],
                    ['Wesley Hu', 'T-22nd', '+19', '—'],
                  ].map((r, i) => (
                    <tr key={r[0]} className={i % 2 ? 'bg-[#fdfcf9]' : undefined}>
                      {r.map((c, j) => (
                        <td key={j} className={`px-4 py-1.5 whitespace-nowrap ${j === 0 ? 'font-medium text-[#0a1628]' : 'text-[#3d4a5c] tabular-nums'}`}>
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/team-room"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0a1628] hover:text-[#990000] transition-colors"
            >
              See the full season schedule in the Team Room →
            </Link>
            <a
              href="https://pennathletics.com/news/2026/10/14/mens-golf-penn-finishes-st-andrews-week-with-fourth-place-finish.aspx"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#990000] hover:underline"
            >
              Read Penn&rsquo;s match play recap ↗
            </a>
          </div>
        </div>
      </section>

      {/* Itinerary */}
      <section className="px-5 sm:px-8 pb-14 sm:pb-16">
        <div className="max-w-[1080px] mx-auto">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[#990000] mb-3">
            The Tour · Oct 14–17
          </p>
          <h2 className="text-[#0a1628] text-3xl sm:text-4xl font-medium font-heading mb-6">
            Four days the family spent on the links.
          </h2>
          <div className="rounded-2xl overflow-hidden mb-6 border border-[rgba(180,168,150,0.4)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://67u0teziiyoxeaeo.public.blob.vercel-storage.com/a7e59dec-f335-4c98-8e33-3e7b050b58df/1785519877069-4UvITXlalATQ3Ap8xNy8uv68khjkmK.jpg"
              alt="Aerial view of Kingsbarns Golf Links on the coast"
              className="w-full max-h-[420px] object-cover"
            />
          </div>
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
            Registration ran through June 30, 2026, with three package levels, 
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

      {/* The way in.
          This page is public, it is what the Champions Club email points at,
          and it is what a traveller lands on when they go looking for their
          own trip. Every link on it used to go outward: Penn Athletics,
          Charlie's inbox, a LinkedIn profile. Somebody could read the whole
          thing and have nowhere to go. */}
      <section className="px-5 sm:px-8 pb-14 sm:pb-16">
        <div className="max-w-[1080px] mx-auto">
          <div
            className="bg-white border border-[rgba(180,168,150,0.45)] rounded-2xl px-7 sm:px-10 py-9 sm:py-11"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.05)' }}
          >
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[#990000] mb-3">
              Were you there?
            </p>
            <h2 className="text-[#0a1628] text-2xl sm:text-3xl font-medium font-heading mb-3">
              The week lives in the Clubhouse now.
            </h2>
            <p className="text-[#3d4a5c] text-[14.5px] leading-relaxed max-w-2xl mb-6">
              The Castle Course, Kingsbarns and Carnoustie are on the board with
              everyone who played them, and the photos are going up in Moments.
              Claim your spot in the Member Book and you are in, free, for good,
              whether you made this trip or played here forty years ago.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md sm:max-w-none">
              <Link
                href="/account/setup"
                className="inline-flex items-center justify-center bg-[#0a1628] text-white font-semibold text-sm px-7 py-3.5 rounded-lg hover:bg-[#112240] transition-colors tracking-wide"
              >
                Claim Your Member Card
              </Link>
              <Link
                href="/member-book"
                className="inline-flex items-center justify-center border border-[rgba(180,168,150,0.7)] text-[#0a1628] font-semibold text-sm px-7 py-3.5 rounded-lg hover:border-[#0a1628]/50 transition-colors tracking-wide"
              >
                Find Your Name
              </Link>
            </div>
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
              For anything about the Scotland Tour, confirmations, logistics, or
              details, reach Charlie Carroll at the Penn Champions Club.
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
            Were you out there? Add your photos to{' '}
            <Link href="/moments" className="text-[#0a1628] font-medium hover:underline">
              Moments
            </Link>
            . Everyone who could not make the trip is still waiting to see it.
          </p>
          <p className="text-[11px] text-[#b0a898] mt-3">
            Photos: Kohjiro Kinno / St Andrews Links Trust · College Links Golf
          </p>
        </div>
      </section>
    </div>
  )
}
