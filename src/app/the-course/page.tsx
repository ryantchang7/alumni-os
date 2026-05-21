import Link from 'next/link'
import { Flag, MapPin, Users, ArrowRight } from 'lucide-react'
import GatheringCard, { type GatheringData } from '@/components/gatherings/GatheringCard'
import type { Person, TeamMembership, PersonEnrichment } from '@/lib/store/types'

interface AlumniEntry {
  person: Person
  membership: TeamMembership
  enrichment: PersonEnrichment
}

function AlumniRoundCard({ entry }: { entry: AlumniEntry }) {
  const { person, membership, enrichment } = entry
  const location =
    enrichment.city ?? membership.hometown ?? null
  return (
    <Link
      href={`/player/alumni/${person.id}?teamSlug=penn-mens-golf`}
      className="group block bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden hover:border-[#2d6a4f]/40 hover:shadow-md transition-all"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
    >
      <div className="border-l-4 border-[#2d6a4f] px-5 py-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p
              className="text-[#0a1628] text-base font-medium leading-snug"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {person.canonicalName}
            </p>
            {membership.classLabel && (
              <p className="text-[11.5px] text-[#8a7f70] mt-0.5">{membership.classLabel}</p>
            )}
          </div>
          <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#2d6a4f] bg-[#2d6a4f]/8 border border-[#2d6a4f]/25 px-2 py-1 rounded-full whitespace-nowrap">
            Open
          </span>
        </div>
        {location && (
          <div className="flex items-center gap-1.5 text-[12px] text-[#4a5568] mt-1">
            <MapPin className="w-3 h-3 text-[#8a7f70]" />
            <span>{location}</span>
          </div>
        )}
        {enrichment.favoriteCourses && (
          <p className="text-[12px] text-[#3d4a5c] mt-2 italic leading-relaxed">
            &ldquo;{enrichment.favoriteCourses}&rdquo;
          </p>
        )}
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#990000] mt-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          Send a note <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  )
}

function CourseRollEntry({
  course,
  count,
  isHome,
}: {
  course: string
  count: number
  isHome: boolean
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5 border-b border-[rgba(180,168,150,0.22)] last:border-b-0">
      <span className="flex items-center gap-2 min-w-0">
        <span
          className="text-[14px] text-[#0a1628] leading-snug truncate"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          {course}
        </span>
        {isHome && (
          <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#2d6a4f] bg-[#2d6a4f]/8 border border-[#2d6a4f]/25 px-1.5 py-0.5 rounded-full whitespace-nowrap">
            Home course
          </span>
        )}
      </span>
      <span className="text-[11px] font-medium text-[#8a7f70] whitespace-nowrap">
        {count} {count === 1 ? 'member' : 'members'}
      </span>
    </li>
  )
}

export default async function TheCoursePage() {
  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug('penn-mens-golf')

  let openToRounds: AlumniEntry[] = []
  let rounds: GatheringData[] = []
  const interestedByGathering = new Map<string, number>()
  const courseRoll = new Map<string, number>()
  const homeCourseSet = new Set<string>()

  if (team) {
    const memberships = store.teamMemberships.filter(
      (m) => m.teamId === team.id && m.memberRole === 'alumni' && m.publishedToNetwork === true,
    )
    const enrichMap = new Map(
      store.personEnrichments.filter((e) => e.teamId === team.id).map((e) => [e.personId, e]),
    )

    const visible: AlumniEntry[] = memberships
      .map((m) => {
        const person = store.people.find((p) => p.id === m.personId)
        const enrichment = enrichMap.get(m.personId)
        if (!person || !enrichment) return null
        if (enrichment.visibleToPlayers === false) return null
        return { person, membership: m, enrichment }
      })
      .filter((x): x is AlumniEntry => x !== null)

    openToRounds = visible.filter((a) => a.enrichment.openToGolfRounds)

    // Aggregate notable courses from alumni's home-course + favorite-course
    // entries. Each member counts at most once per course; home course gets
    // ranked first when equal counts.
    for (const v of visible) {
      const candidates: string[] = []
      if (v.enrichment.homeCourse) candidates.push(v.enrichment.homeCourse)
      if (v.enrichment.favoriteCourses) {
        // Split by comma or ' and ' so "Pine Valley, Merion" yields two.
        candidates.push(
          ...v.enrichment.favoriteCourses
            .split(/,| and /i)
            .map((c) => c.trim())
            .filter((c) => c.length > 2 && c.length < 60),
        )
      }
      const seenForMember = new Set<string>()
      for (const c of candidates) {
        const key = c.trim()
        if (!key || seenForMember.has(key)) continue
        seenForMember.add(key)
        courseRoll.set(key, (courseRoll.get(key) ?? 0) + 1)
        if (v.enrichment.homeCourse === key) homeCourseSet.add(key)
      }
    }

    rounds = store.clubhouseGatherings.filter(
      (g) => g.teamId === team.id && g.type === 'round' && g.status !== 'closed',
    ) as GatheringData[]

    for (const r of store.clubhouseGatheringRequests) {
      if (r.teamId !== team.id) continue
      if (r.status === 'declined' || r.status === 'closed') continue
      interestedByGathering.set(
        r.gatheringId,
        (interestedByGathering.get(r.gatheringId) ?? 0) + 1,
      )
    }
  }

  const sortedCourses = Array.from(courseRoll.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]
      // tiebreak: home-course wins
      const aHome = homeCourseSet.has(a[0]) ? 1 : 0
      const bHome = homeCourseSet.has(b[0]) ? 1 : 0
      return bHome - aHome
    })
    .slice(0, 12)

  const actionCards = [
    {
      label: 'Find a Round',
      description: 'Browse alumni open to hosting or joining a round near you.',
      href: '#open-to-rounds',
      icon: Flag,
    },
    {
      label: 'Host a Round',
      description: 'Mark yourself open to a tee time at your home course.',
      href: '/alumni',
      icon: Users,
    },
    {
      label: 'Browse the Map',
      description: 'See where Penn Golf members are playing across the country.',
      href: '/member-map',
      icon: MapPin,
    },
  ]

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Hero — green tee marker rule */}
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-12 pb-16 relative overflow-hidden">
        <div className="max-w-[1320px] mx-auto relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35 mb-4">
            Penn Men&rsquo;s Golf
          </p>
          <h1
            className="text-white text-4xl sm:text-5xl font-medium tracking-tight"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            The Course
          </h1>
          <span className="block w-12 h-[2px] bg-[#2d6a4f] mt-5 mb-5" />
          <p className="text-white/55 text-sm sm:text-base max-w-xl leading-relaxed">
            Tee times, foursomes, and home courses across the Penn Golf network.
            Golf travels well — find a round wherever you land.
          </p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-12 space-y-14">
        {/* Scorecard-style action row */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {actionCards.map((card) => {
              const Icon = card.icon
              return (
                <Link
                  key={card.label}
                  href={card.href}
                  className="group block bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5 hover:border-[#2d6a4f]/40 hover:shadow-md transition-all"
                  style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#2d6a4f]/8 text-[#2d6a4f] flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </span>
                    <div>
                      <p
                        className="text-[#0a1628] text-[15px] font-medium leading-snug mb-1"
                        style={{ fontFamily: 'var(--font-playfair)' }}
                      >
                        {card.label}
                      </p>
                      <p className="text-[12.5px] text-[#8a7f70] leading-snug">{card.description}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Organized Rounds */}
        {rounds.length > 0 && (
          <section data-testid="rounds-section">
            <div className="flex items-baseline justify-between mb-1">
              <h2
                className="text-xl text-[#0a1628] font-medium"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Tee Times
              </h2>
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2d6a4f]">
                {rounds.length} open
              </span>
            </div>
            <p className="text-sm text-[#8a7f70] mb-6">
              Organized rounds open for members to join.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rounds.map((g) => (
                <GatheringCard
                  key={g.id}
                  gathering={g}
                  interestedCount={interestedByGathering.get(g.id) ?? 0}
                />
              ))}
            </div>
          </section>
        )}

        {/* Open to a Round — alumni */}
        <section id="open-to-rounds">
          <div className="flex items-baseline justify-between mb-1">
            <h2
              className="text-xl text-[#0a1628] font-medium"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Open to a Round
            </h2>
            {openToRounds.length > 0 && (
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2d6a4f]">
                {openToRounds.length} available
              </span>
            )}
          </div>
          <p className="text-sm text-[#8a7f70] mb-6">
            Alumni who&rsquo;ve marked themselves open to hosting or joining a round.
          </p>
          {openToRounds.length === 0 ? (
            <div
              className="bg-white border border-dashed border-[rgba(180,168,150,0.5)] rounded-xl p-8 text-center"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.04)' }}
            >
              <Flag className="w-6 h-6 text-[#2d6a4f] mx-auto mb-3" />
              <p
                className="text-[#0a1628] text-base font-medium mb-2"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                No one&rsquo;s teed off yet.
              </p>
              <p className="text-[13px] text-[#8a7f70] mb-5 max-w-md mx-auto">
                Be the first. Mark yourself open to hosting a round and players in your
                city will find you here.
              </p>
              <Link
                href="/alumni"
                className="inline-block bg-[#2d6a4f] hover:bg-[#234f3a] text-white text-[12.5px] font-semibold uppercase tracking-[0.12em] px-5 py-2.5 rounded-lg transition-colors"
              >
                Open Your Tee Box
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {openToRounds.map((entry) => (
                <AlumniRoundCard key={entry.person.id} entry={entry} />
              ))}
            </div>
          )}
        </section>

        {/* How a Penn Golf round works */}
        <section>
          <div className="flex items-baseline justify-between mb-1">
            <h2
              className="text-xl text-[#0a1628] font-medium"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              How a Penn Golf round works
            </h2>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a7f70]">
              The unwritten rules
            </span>
          </div>
          <p className="text-sm text-[#8a7f70] mb-6">
            Penn Golf has run on a quiet hospitality network for decades. A few notes for first-timers.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: 'Reach out before you travel',
                body:
                  'If a tournament or business trip is taking you near a member, send a note a week or two ahead. Hosts plan their members&rsquo; book carefully.',
              },
              {
                title: 'Ask once, accept gracefully',
                body:
                  'Members are limited in how often they can host guests under their own membership. One thoughtful ask per visit is the right tempo.',
              },
              {
                title: 'Pay your way, write the note',
                body:
                  'Offer to pay for caddie, lunch, and any guest fees. A handwritten thank-you after the round is the Penn Golf way.',
              },
              {
                title: 'Pay it forward',
                body:
                  'If you&rsquo;ve been hosted, look for a current player or younger alum to host yourself within the year. The network only works if it cycles.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-5 py-4"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05)' }}
              >
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#2d6a4f] flex-shrink-0" />
                  <p
                    className="text-[#0a1628] text-[15px] font-medium leading-snug"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    {item.title}
                  </p>
                </div>
                <p
                  className="text-[12.5px] text-[#3d4a5c] leading-relaxed pl-3.5"
                  dangerouslySetInnerHTML={{ __html: item.body }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Notable Courses */}
        {sortedCourses.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between mb-1">
              <h2
                className="text-xl text-[#0a1628] font-medium"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Where Penn Golf plays
              </h2>
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a7f70]">
                The course roll
              </span>
            </div>
            <p className="text-sm text-[#8a7f70] mb-6">
              Home courses across the alumni network — DMs to access often run through these.
            </p>
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-6 py-4"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <ul>
                {sortedCourses.map(([course, count]) => (
                  <CourseRollEntry
                    key={course}
                    course={course}
                    count={count}
                    isHome={homeCourseSet.has(course)}
                  />
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          <div>
            <p
              className="text-[#0a1628] text-base font-medium"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Have a home course?
            </p>
            <p className="text-[12.5px] text-[#8a7f70] mt-1">
              Add it to your profile and mark yourself open to hosting. Members and current players will find you.
            </p>
          </div>
          <Link
            href="/alumni"
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#990000] hover:underline whitespace-nowrap"
          >
            Update your card &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
