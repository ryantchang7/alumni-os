// The Penn Golf Hall of Fame, for either program.
//
// Render the canonical program achievements + cross-link to the Member Book
// players whose careers overlap each championship year. `?program=womens`
// switches books; without it this is the men's record, which is what every
// existing link to this page expects.

import Link from 'next/link'
import { Trophy, Award } from 'lucide-react'
import {
  PENN_GOLF_TRADITION,
  PENN_GOLF_HISTORICAL_NOTES,
  NCAA_CHAMPIONSHIP_YEARS,
  IVY_CHAMPIONSHIP_YEARS,
} from '@/lib/program-history/penn-mens-golf'
import {
  PENN_WOMENS_GOLF_TRADITION,
  PENN_WOMENS_GOLF_HISTORICAL_NOTES,
  WOMENS_IVY_CHAMPIONSHIP_YEARS,
  WOMENS_NCAA_REGIONAL_YEARS,
  WOMENS_UNPUBLISHED_SEASONS,
} from '@/lib/program-history/penn-womens-golf'
import { isMultiProgram, PROGRAMS, type ProgramId } from '@/lib/teams/programs'
import { memberBookEntries } from '@/lib/member-book/data'
import {
  getMemberEndYear,
  getMemberProgram,
  getMemberStartYear,
  isPublicMember,
} from '@/lib/member-book/helpers'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hall of Fame',
  description: 'Penn Golf program honors and history.',
}


/**
 * Each program's record book, so that no year grid can ever pull a name
 * from the other program's members.
 */
const BOOKS = {
  mens: {
    tradition: PENN_GOLF_TRADITION,
    notes: PENN_GOLF_HISTORICAL_NOTES,
    ivyYears: IVY_CHAMPIONSHIP_YEARS as readonly number[],
    postseasonYears: NCAA_CHAMPIONSHIP_YEARS as readonly number[],
    postseasonTitle: 'NCAA Championships',
    postseasonBlurb: 'Penn teams that reached the NCAA Championships stage.',
    postseasonChip: 'NCAA',
    blurb:
      'Championships, postseason appearances, and individual honors from the Penn Golf record book, from the first NCAA appearance in 1947 to today.',
  },
  womens: {
    tradition: PENN_WOMENS_GOLF_TRADITION,
    notes: PENN_WOMENS_GOLF_HISTORICAL_NOTES,
    ivyYears: WOMENS_IVY_CHAMPIONSHIP_YEARS as readonly number[],
    postseasonYears: WOMENS_NCAA_REGIONAL_YEARS as readonly number[],
    postseasonTitle: 'NCAA Regionals',
    postseasonBlurb: 'Both of Penn’s postseason trips, each earned by winning the Ivy League.',
    postseasonChip: 'Regional',
    blurb:
      'Championships and postseason appearances from the Penn Women’s Golf record book. The program went varsity in 1999, a century after the men.',
  },
} as const

function membersForYear(year: number, program: ProgramId) {
  return memberBookEntries
    .filter((m) => {
      if (!isPublicMember(m)) return false
      // A year grid belongs to one program's record book, so a member of the
      // other program must never be listed under it.
      if (getMemberProgram(m) !== program) return false
      const s = getMemberStartYear(m)
      const e = getMemberEndYear(m)
      // letter winner whose career spans this academic year
      if (s == null && e == null) return false
      const start = s ?? e ?? year
      const end = e ?? s ?? year
      return year >= start && year <= end + 1
    })
    .slice(0, 10)
}

export default async function HallOfFamePage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>
}) {
  const { program: raw } = await searchParams
  const program: ProgramId = raw === 'womens' && PROGRAMS.womens.live ? 'womens' : 'mens'
  const book = BOOKS[program]
  const ivyRosters = book.ivyYears.map((year) => ({ year, members: membersForYear(year, program) }))
  const ncaaRosters = book.postseasonYears.map((year) => ({ year, members: membersForYear(year, program) }))

  return (
    <div className="min-h-screen bg-[#fbf9f6]">
      {/* Hero */}
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-14 pb-16 relative overflow-hidden">
        {/* Soft gold spotlight on the title */}
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
            {PROGRAMS[program].label} · The Record Book
          </p>
          <h1
            className="text-white text-4xl sm:text-6xl font-medium tracking-tight leading-[1.05] font-heading"
          >
            Hall of Fame
          </h1>
          <span className="block w-12 h-[2px] bg-[#c8a84b] mt-5 mb-5" />
          <p className="text-white/70 text-sm sm:text-base max-w-xl leading-relaxed">
            {book.blurb}
          </p>
          {isMultiProgram() && (
            <div className="mt-7 flex flex-wrap gap-2">
              {(['mens', 'womens'] as const).map((id) => {
                const active = id === program
                return (
                  <Link
                    key={id}
                    href={id === 'mens' ? '/hall-of-fame' : '/hall-of-fame?program=womens'}
                    aria-current={active ? 'page' : undefined}
                    className={`px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] rounded-full border transition-colors ${
                      active
                        ? 'bg-[#c8a84b] text-[#0a1628] border-[#c8a84b]'
                        : 'text-white/75 border-white/25 hover:border-[#c8a84b]/70 hover:text-white'
                    }`}
                  >
                    {PROGRAMS[id].shortLabel}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top-level achievement plaques */}
      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 -mt-8 relative z-10 pb-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {book.tradition.achievements.map((a) => {
            const featured = a.featured
            return (
              <div
                key={a.label}
                className={`bg-white border rounded-xl px-6 py-6 ${
                  featured ? 'border-[#c8a84b]/40' : 'border-[rgba(180,168,150,0.4)]'
                }`}
                style={{
                  boxShadow: featured
                    ? '0 2px 8px rgba(200,168,75,0.18), 0 1px 3px rgba(10,22,40,0.06)'
                    : '0 1px 3px rgba(10,22,40,0.05), 0 4px 12px rgba(10,22,40,0.04)',
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  {featured ? (
                    <Trophy className="w-5 h-5 text-[#c8a84b] flex-shrink-0 mt-1" />
                  ) : (
                    <Award className="w-5 h-5 text-[#990000] flex-shrink-0 mt-1" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-heading text-5xl font-light leading-none ${
                        featured ? 'text-[#990000]' : 'text-[#0a1628]'
                      }`}
                    >
                      {a.value}
                    </p>
                  </div>
                </div>
                <p
                  className="text-[#0a1628] text-[15px] font-medium mb-1.5 font-heading"
                >
                  {a.label}
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted mb-3">
                  {a.detail}
                </p>
                <p className="text-[13px] text-[#3d4a5c] leading-relaxed">{a.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Ivy League Champions */}
      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-14 space-y-14">
        <section>
          <div className="flex items-baseline justify-between mb-1">
            <h2
              className="text-2xl text-[#0a1628] font-medium font-heading"
            >
              Ivy League Champions
            </h2>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c8a84b]">
              {book.ivyYears.length} {book.ivyYears.length === 1 ? 'crown' : 'crowns'}
            </span>
          </div>
          <p className="text-sm text-ink-muted mb-6">
            {program === 'mens'
              ? 'The seasons Penn took the Ivy. Letter winners from each championship team.'
              : 'The seasons Penn took the Ivy. Members whose careers span each championship team.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ivyRosters.map(({ year, members }) => (
              <div
                key={year}
                className="bg-white border border-[#c8a84b]/30 rounded-xl px-6 py-5"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05)' }}
              >
                <div className="flex items-baseline justify-between mb-3">
                  <p
                    className="text-3xl text-[#0a1628] font-medium leading-none font-heading"
                  >
                    {year}
                  </p>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c8a84b]">
                    Ivy Champions
                  </span>
                </div>
                {members.length === 0 ? (
                  <p className="text-[12.5px] text-ink-muted italic">Roster data for this year is still being compiled.</p>
                ) : (
                  <ul className="space-y-1">
                    {members.map((m) => (
                      <li key={m.id}>
                        <Link
                          href={`/member-book/${encodeURIComponent(m.id)}`}
                          className="text-[13px] text-[#0a1628] hover:underline font-heading"
                        >
                          {m.displayName}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* NCAA Team Appearances */}
        <section>
          <div className="flex items-baseline justify-between mb-1">
            <h2
              className="text-2xl text-[#0a1628] font-medium font-heading"
            >
              {book.postseasonTitle}
            </h2>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#990000]">
              {book.postseasonYears.length} appearances
            </span>
          </div>
          <p className="text-sm text-ink-muted mb-6">{book.postseasonBlurb}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {ncaaRosters.map(({ year, members }) => (
              <div
                key={year}
                className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl px-5 py-4 text-center"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05)' }}
              >
                <p
                  className="text-2xl text-[#990000] font-medium leading-none mb-1 font-heading"
                >
                  {year}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  {book.postseasonChip}
                </p>
                {members.length > 0 && (
                  <p className="text-[11px] text-ink-muted mt-2">
                    {members.length} member{members.length === 1 ? '' : 's'}
                  </p>
                )}
              </div>
            ))}
          </div>

          {book.notes.length > 0 && (
            <div className="mt-4 space-y-2">
              {book.notes.map((note) => (
                <div
                  key={note.year}
                  className="bg-white border-l-2 border-[#c8a84b] border-y border-r border-y-[rgba(180,168,150,0.4)] border-r-[rgba(180,168,150,0.4)] rounded-r-xl px-5 py-4"
                  style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05)' }}
                >
                  <p className="text-[13px] text-[#0a1628] font-heading">
                    <span className="text-[#990000] font-medium">{note.year}</span>
                    <span className="text-ink-muted"> &middot; </span>
                    {note.title}
                  </p>
                  <p className="text-[12.5px] text-ink-muted leading-relaxed mt-1">
                    {note.detail}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* The gap in the women's record, stated rather than hidden. */}
        {program === 'womens' && (
          <section
            className="bg-white border-l-2 border-[#990000] border-y border-r border-y-[rgba(180,168,150,0.4)] border-r-[rgba(180,168,150,0.4)] rounded-r-xl px-6 py-5"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05)' }}
          >
            <h2 className="text-[#0a1628] text-base font-medium font-heading">
              Five seasons are missing
            </h2>
            <p className="text-[13px] text-ink-muted leading-relaxed mt-2 max-w-[70ch]">
              Penn Athletics publishes women&rsquo;s golf rosters from 2004-05 onward.
              The program&rsquo;s first five varsity seasons &mdash;{' '}
              {WOMENS_UNPUBLISHED_SEASONS.join(', ')} &mdash; are not online anywhere,
              so the players on them are absent from the Member Book. Stacy Kress, the
              program&rsquo;s first recruit, is one of them. If you played in those
              years, or you kept a program or a clipping, that is what closes the gap.
            </p>
          </section>
        )}

        {/* Footer link to Member Book */}
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
        >
          <div>
            <p
              className="text-[#0a1628] text-base font-medium font-heading"
            >
              Every Penn Golf member, 1930–present
            </p>
            <p className="text-[12.5px] text-ink-muted mt-1">
              The full registry, beyond championship rosters.
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
