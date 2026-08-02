// The Penn Men's Golf Hall of Fame.
//
// Render the canonical program achievements + cross-link to the Member Book
// players whose careers overlap each championship year.

import Link from 'next/link'
import { Trophy, Award } from 'lucide-react'
import { PENN_GOLF_TRADITION } from '@/lib/program-history/penn-mens-golf'
import { memberBookEntries } from '@/lib/member-book/data'
import { isPublicMember, getMemberStartYear, getMemberEndYear } from '@/lib/member-book/helpers'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hall of Fame',
  description: 'Penn Golf program honors and history.',
}

const IVY_YEARS = [1998, 2007, 2012, 2015]
const NCAA_TEAM_YEARS = [1947, 1958, 1965, 1973, 1974]

function membersForYear(year: number) {
  return memberBookEntries
    .filter((m) => {
      if (!isPublicMember(m)) return false
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

export default function HallOfFamePage() {
  const ivyRosters = IVY_YEARS.map((year) => ({ year, members: membersForYear(year) }))
  const ncaaRosters = NCAA_TEAM_YEARS.map((year) => ({ year, members: membersForYear(year) }))

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
            Penn Men&rsquo;s Golf · The Record Book
          </p>
          <h1
            className="text-white text-4xl sm:text-6xl font-medium tracking-tight leading-[1.05] font-heading"
          >
            Hall of Fame
          </h1>
          <span className="block w-12 h-[2px] bg-[#c8a84b] mt-5 mb-5" />
          <p className="text-white/70 text-sm sm:text-base max-w-xl leading-relaxed">
            Championships, postseason appearances, and individual honors from the
            Penn Golf record book — from the first NCAA appearance in 1947 to today.
          </p>
        </div>
      </div>

      {/* Top-level achievement plaques */}
      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 -mt-8 relative z-10 pb-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {PENN_GOLF_TRADITION.achievements.map((a) => {
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
              4 crowns
            </span>
          </div>
          <p className="text-sm text-ink-muted mb-6">
            The four seasons Penn took the Ivy. Letter winners from each championship team.
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
              NCAA Championships
            </h2>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#990000]">
              5 appearances
            </span>
          </div>
          <p className="text-sm text-ink-muted mb-6">
            Penn teams that reached the NCAA Championships stage.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
                  NCAA
                </p>
                {members.length > 0 && (
                  <p className="text-[11px] text-ink-muted mt-2">
                    {members.length} member{members.length === 1 ? '' : 's'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

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
