// The decade Penn Golf has no roster for, and a standing request to fix it.
//
// Public on purpose. Everything else that matters is behind a members-only
// wall, and the people who can close this gap are exactly the people who are
// not members yet, because they are not in the book to claim.

import Link from 'next/link'
import type { Metadata } from 'next'
import {
  CLUB_YEARS_FIRST,
  CLUB_YEARS_LAST,
  CLUB_YEARS_NAMES,
  CLUB_YEARS_OPEN_QUESTIONS,
} from '@/lib/program-history/penn-club-years'

export const metadata: Metadata = {
  title: 'The Club Years',
  description:
    'Penn Golf has no published roster for 1983 to 1992. These are the names alumni have remembered so far.',
}

const SPAN = CLUB_YEARS_LAST - CLUB_YEARS_FIRST + 1
const CONTACT = 'rtchang@upenn.edu'

export default function ClubYearsPage() {
  const years = Array.from({ length: SPAN }, (_, i) => CLUB_YEARS_FIRST + i)

  return (
    <div className="min-h-screen bg-[#fbf9f6]">
      {/* Hero */}
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-14 pb-16 relative overflow-hidden">
        <div
          className="absolute pointer-events-none"
          style={{
            top: '50%',
            left: '15%',
            width: '600px',
            height: '400px',
            transform: 'translate(-50%, -50%)',
            background:
              'radial-gradient(ellipse at center, rgba(200,168,75,0.12) 0%, rgba(200,168,75,0.04) 40%, transparent 70%)',
          }}
        />
        <div className="max-w-[1320px] mx-auto relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]/85 mb-4">
            Penn Golf &middot; The Missing Decade
          </p>
          <h1 className="text-white text-4xl sm:text-6xl font-medium tracking-tight leading-[1.05] font-heading">
            The Club Years
          </h1>
          <span className="block w-12 h-[2px] bg-[#c8a84b] mt-5 mb-5" />
          <p className="text-white/70 text-sm sm:text-base max-w-xl leading-relaxed">
            Penn has no published roster for {CLUB_YEARS_FIRST} through{' '}
            {CLUB_YEARS_LAST}. Ten seasons, and nobody from them is in the
            Member Book. These are the names alumni have remembered so far.
          </p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-14 space-y-14">
        {/* The gap, as the data shows it */}
        <section>
          <h2 className="text-2xl text-[#0a1628] font-medium font-heading">
            What the book is missing
          </h2>
          <p className="text-sm text-ink-muted mt-2 mb-6 max-w-[70ch]">
            The Member Book is built from Penn Athletics&rsquo; own published
            records, 1930 onward. Every season on either side of this run has
            members in it. These ten have none, and that is not a gap in the
            research. Penn stopped publishing a roster.
          </p>
          <div
            className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl px-6 py-6"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05)' }}
          >
            <div className="flex flex-wrap gap-2">
              {years.map((y) => (
                <span
                  key={y}
                  className="px-3 py-1.5 text-[12.5px] font-medium rounded-lg border border-dashed border-[#990000]/40 text-[#990000] bg-[#990000]/[0.04] font-heading"
                >
                  {y}
                </span>
              ))}
            </div>
            <p className="text-[12.5px] text-ink-muted mt-5 leading-relaxed max-w-[70ch]">
              The team was dropped to club status in this era. David Posnick
              (W&rsquo;88) raised it after seeing the Clubhouse: the people who
              played then do not appear in the records. The data agreed with him
              before anyone went looking.
            </p>
          </div>
        </section>

        {/* Names so far */}
        <section>
          <div className="flex items-baseline justify-between gap-3 mb-1 flex-wrap">
            <h2 className="text-2xl text-[#0a1628] font-medium font-heading">
              Remembered so far
            </h2>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c8a84b]">
              {CLUB_YEARS_NAMES.length} names
            </span>
          </div>
          <p className="text-sm text-ink-muted mb-6 max-w-[70ch]">
            Every one of these came from someone&rsquo;s memory, and is credited
            to them. <strong className="text-[#0a1628] font-medium">None is
            verified against a Penn record</strong>, because no Penn record of
            these seasons has been found. They are kept off the Member Book
            until one is, which is why this page exists separately.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CLUB_YEARS_NAMES.map((p) => (
              <div
                key={p.name}
                className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl px-6 py-5"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05)' }}
              >
                <p className="text-[#0a1628] text-lg font-medium font-heading">
                  {p.name}
                </p>
                {p.detail && (
                  <p className="text-[13px] text-[#3d4a5c] mt-1">{p.detail}</p>
                )}
                <p className="text-[11px] text-ink-muted mt-3 pt-3 border-t border-[rgba(180,168,150,0.3)]">
                  Remembered by {p.rememberedBy}
                  {p.uncertain && (
                    <span className="text-[#990000]"> &middot; {p.uncertain}</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Open questions */}
        <section>
          <h2 className="text-2xl text-[#0a1628] font-medium font-heading">
            Still unresolved
          </h2>
          <p className="text-sm text-ink-muted mt-2 mb-6 max-w-[70ch]">
            Three things do not add up yet. They are here rather than quietly
            smoothed over, because the people who can settle them are the people
            reading this.
          </p>
          <div className="space-y-3">
            {CLUB_YEARS_OPEN_QUESTIONS.map((q) => (
              <div
                key={q.question}
                className="bg-white border-l-2 border-[#c8a84b] border-y border-r border-y-[rgba(180,168,150,0.4)] border-r-[rgba(180,168,150,0.4)] rounded-r-xl px-6 py-5"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05)' }}
              >
                <p className="text-[14px] text-[#0a1628] font-medium font-heading">
                  {q.question}
                </p>
                <p className="text-[12.5px] text-ink-muted leading-relaxed mt-1.5 max-w-[75ch]">
                  {q.why}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* The ask */}
        <section
          className="bg-[#0a1628] rounded-2xl px-6 sm:px-10 py-9"
          style={{ boxShadow: '0 2px 8px rgba(10,22,40,0.1)' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b] mb-3">
            If you played in these years
          </p>
          <h2 className="text-white text-2xl sm:text-3xl font-medium font-heading leading-tight max-w-[22ch]">
            One name is enough to start.
          </h2>
          <p className="text-white/70 text-sm leading-relaxed mt-4 max-w-[62ch]">
            A teammate, a captain, a year you are sure about, an old roster or a
            team photo. Partial is fine and a guess clearly marked as a guess is
            fine. Everything gets credited to whoever remembered it, the way the
            names above are, and nothing moves into the Member Book until there
            is a record behind it.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a
              href={`mailto:${CONTACT}?subject=${encodeURIComponent('Penn Golf, the club years')}`}
              className="text-sm font-semibold bg-[#f5f0e8] text-[#0a1628] px-7 py-3 rounded-lg hover:bg-white transition-colors"
            >
              Send a name
            </a>
            <span className="text-white/55 text-[12.5px] select-all">{CONTACT}</span>
          </div>
        </section>

        {/* Where this sits */}
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
        >
          <div>
            <p className="text-[#0a1628] text-base font-medium font-heading">
              Everyone the records do have
            </p>
            <p className="text-[12.5px] text-ink-muted mt-1">
              The Member Book, 1930 to today, with this decade still missing
              from it.
            </p>
          </div>
          <Link
            href="/member-book"
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#990000] hover:underline whitespace-nowrap"
          >
            Open the Member Book &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
