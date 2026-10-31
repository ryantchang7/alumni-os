/**
 * The last two beats of /scotland: Ryan's own note, and the invitation to
 * everyone else who was there.
 *
 * Split out of page.tsx to keep that file readable, and because these two
 * are the parts most likely to be edited by hand later. The note is Ryan's
 * writing, lightly set. Leave the voice alone.
 */

import Link from 'next/link'
import { WRAP } from '@/components/scotland/layout'

export function FounderNote() {
  return (
    <section className={`${WRAP} pb-18 sm:pb-26`}>
      <div
        className="relative mx-auto max-w-[720px] overflow-hidden rounded-2xl border border-[rgba(180,168,150,0.5)] bg-[#fffdf8] px-7 py-10 sm:px-14 sm:py-14"
        style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 16px 40px rgba(10,22,40,0.06)' }}
      >
        <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-[#c8a84b]" />
        <p className="eyebrow mb-7 text-[#7a6420]">A note from Ryan</p>
        <div className="space-y-5 text-[16px] leading-[1.8] text-[#2d3a4a] sm:text-[17px]">
          <p>
            I still can&rsquo;t quite believe we got to play a college golf
            tournament at St Andrews.
          </p>
          <p>
            On the Old Course, I holed out for eagle on the third hole and
            found myself four under through six. I eventually finished with a
            73, but getting to have a stretch like that in a Penn uniform, at
            the Home of Golf, is something I will never forget.
          </p>
          <p>
            And somehow the week got even better after the tournament. We
            played Kingsbarns and Carnoustie, got to visit the R&amp;A, and
            spent time with Penn Golf alumni Carter Thompson and Amay Poria.
            Some of my favorite memories came from just being out on the course
            together and getting to know guys who played for Penn before us.
          </p>
          <p>
            When I started building Penn Golf Clubhouse, I wanted to find a way
            to bring different generations of Penn golfers together. It&rsquo;s
            one thing to look through old team rosters and see the names.
            It&rsquo;s another to be playing golf in Scotland with people who
            wore the same Penn uniform years before you.
          </p>
          <p>
            I&rsquo;m incredibly grateful to everyone who helped make this trip
            possible. It&rsquo;s hard to imagine a better experience with this
            team, and I know we&rsquo;ll be talking about this week for a long
            time.
          </p>
        </div>
        <div className="mt-9 border-t border-[rgba(180,168,150,0.5)] pt-6">
          <p className="font-heading text-[23px] text-[#0a1628]" style={{ fontStyle: 'italic' }}>
            Ryan Chang
          </p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">
            Penn Men&rsquo;s Golf
            <span className="mx-1.5 text-[#c8a84b]">·</span>
            Founder, Penn Golf Clubhouse
          </p>
        </div>
      </div>
    </section>
  )
}

export function ClosingInvitation() {
  return (
    <section className="bg-[#0a1628]">
      <div className={`${WRAP} py-18 sm:py-26`}>
        <p className="font-heading max-w-[20ch] text-[1.75rem] leading-[1.22] font-medium text-white sm:max-w-[26ch] sm:text-[2.7rem]">
          Four courses, a few thousand miles from Philadelphia, and a week that
          is going to get retold for a long time.
        </p>
        <p className="mt-7 max-w-[58ch] text-[15px] leading-[1.75] text-white/70">
          The alumni portion of the trip was organized with the Penn Champions
          Club, and the support of the Penn Golf community is what made the
          week possible for the players on it.
        </p>

        <div className="mt-11 border-t border-white/12 pt-9">
          <p className="eyebrow mb-3 text-[#c8a84b]">Were you in Scotland?</p>
          <p className="max-w-[54ch] text-[15px] leading-[1.75] text-white/70">
            There are nine photos on this page and there were a lot more than
            nine good ones. Add yours to Moments so the rest of the Penn Golf
            family gets to see the week too.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/moments"
              className="inline-flex items-center justify-center rounded-lg bg-[#c8a84b] px-7 py-3.5 text-sm font-semibold tracking-wide text-[#0a1628] transition-colors hover:bg-[#d8ba5e]"
            >
              View Scotland Moments
            </Link>
            <Link
              href="/moments/new"
              className="inline-flex items-center justify-center rounded-lg border border-white/25 px-7 py-3.5 text-sm font-semibold tracking-wide text-white transition-colors hover:border-white/60"
            >
              Add Your Photos
            </Link>
            <Link
              href="/team-room"
              className="inline-flex items-center justify-center px-1 py-2 text-sm font-semibold tracking-wide text-white/65 transition-colors hover:text-white sm:px-4"
            >
              Explore the 2026-27 team &rarr;
            </Link>
          </div>
        </div>

        <p className="mt-12 text-[11.5px] leading-relaxed text-white/35">
          Tournament photography: St Andrews Links Trust. Additional
          photographs from the Penn Golf travelling party.
        </p>
      </div>
    </section>
  )
}
