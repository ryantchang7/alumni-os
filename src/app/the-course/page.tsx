import Link from 'next/link'
import { Flag, MapPin, Users } from 'lucide-react'
import { normalizeCourseName } from '@/lib/courses'
import GatheringCard, { type GatheringData } from '@/components/gatherings/GatheringCard'
import type { Person, TeamMembership, PersonEnrichment } from '@/lib/store/types'
import { getApprovalState } from '@/lib/access/approval'
import GatedPreview from '@/components/GatedPreview'
import CourseHero from './CourseHero'
import CourseHoleSection, { CartPathDivider } from './CourseHoleSection'
import CourseRoll, { type CourseRollEntry as CourseRollEntryData } from './CourseRoll'
import OpenRequestStrip from '@/components/OpenRequestStrip'
import AlumniCard from '@/components/alumni/AlumniCard'
import { auth } from '@/auth'
import { prioritizeForViewer, resolveViewerLocation } from '@/lib/prioritize'
import { bucketHandicap, BUCKET_LABELS, BUCKET_SHORT, type HandicapBucket } from '@/lib/handicap'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Course',
  description: 'Find a round or host one — tee times with the Penn Golf family.',
}

interface AlumniEntry {
  person: Person
  membership: TeamMembership
  enrichment: PersonEnrichment
  photoUrl: string | null
}

// City + state when both are set, otherwise whichever exists, then hometown
// as a last-resort fallback. Matches the Career Room card treatment so
// "Brookline" reads as "Brookline, MA".
function alumniLocation(entry: AlumniEntry): string | null {
  return (
    [entry.enrichment.city, entry.enrichment.state].filter(Boolean).join(', ') ||
    entry.membership.hometown ||
    null
  )
}

export default async function TheCoursePage() {
  const approval = await getApprovalState()
  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug('penn-mens-golf')

  let openToRounds: AlumniEntry[] = []
  let rounds: GatheringData[] = []
  let viewerOptedToRounds = false
  let viewerPersonId: string | undefined
  let viewerAccountId: string | undefined
  let viewerHandicap: string | undefined
  let similarPlayers: AlumniEntry[] = []
  let viewerBucket: HandicapBucket | null = null
  // Open Requests (intent='round') visible on this surface. Includes the
  // viewer's own (the strip badges + pins them with a Close button).
  type RoundOpenRequest = import('@/lib/store/types').OpenRequest
  let openRoundRequests: RoundOpenRequest[] = []
  // Bunched course roll: each course name → the members who claim it as
  // home or favorite. Fed into the searchable CourseRoll client. Home
  // member float to the top of each course's expanded list.
  interface CourseRollMember {
    personId: string
    name: string
    isHome: boolean
    photoUrl?: string | null
  }
  const courseMembers = new Map<string, CourseRollMember[]>()
  const interestedByGathering = new Map<string, number>()
  const courseRoll = new Map<string, number>()
  const homeCourseSet = new Set<string>()
  // normalized course key → first-seen human spelling, so "The International"
  // and "International" combine but still display a real name.
  const courseDisplay = new Map<string, string>()

  if (team) {
    // Any role can opt into "Open to a Round" — players, alumni, coach,
    // and family/affiliates. The page groups them by role with subheads
    // so the list reads cleanly regardless of who's opted in.
    const memberships = store.teamMemberships.filter(
      (m) =>
        m.teamId === team.id &&
        (m.memberRole === 'alumni' ||
          m.memberRole === 'current_player' ||
          m.memberRole === 'coach' ||
          m.memberRole === 'parent') &&
        m.publishedToNetwork === true,
    )
    const enrichMap = new Map(
      store.personEnrichments.filter((e) => e.teamId === team.id).map((e) => [e.personId, e]),
    )
    const accountImg = new Map(
      store.accounts
        .filter((a) => a.teamId === team.id && a.linkedPersonId && a.image)
        .map((a) => [a.linkedPersonId as string, a.image as string]),
    )
    const photoFor = (personId: string): string | null =>
      enrichMap.get(personId)?.photoUrl ?? accountImg.get(personId) ?? null

    const visible: AlumniEntry[] = memberships
      .map((m) => {
        const person = store.people.find((p) => p.id === m.personId)
        const enrichment = enrichMap.get(m.personId)
        if (!person || !enrichment) return null
        if (enrichment.visibleToPlayers === false) return null
        return { person, membership: m, enrichment, photoUrl: photoFor(m.personId) }
      })
      .filter((x): x is AlumniEntry => x !== null)

    // Prioritize for the viewer: same-city first, then same-state,
    // then recently active. Filter the viewer out of their own list.
    const session = await auth()
    viewerAccountId = session?.accountId ?? undefined
    const viewer = resolveViewerLocation(session, store, team.id)
    const decorated = visible
      .filter((a) => a.enrichment.openToGolfRounds)
      .map((entry) => ({
        personId: entry.person.id,
        city: entry.enrichment.city,
        state: entry.enrichment.state,
        updatedAt: entry.enrichment.updatedAt,
        entry,
      }))
    openToRounds = prioritizeForViewer(decorated, viewer).map((d) => d.entry)

    // Viewer's own "Open to a Round" opt-in — surfaces the small
    // "You're on this list too — Edit" chip above the list so they
    // know they're visible without seeing their own card mixed in.
    viewerPersonId = viewer.personId
    if (viewer.personId) {
      const myEnrichment = enrichMap.get(viewer.personId)
      viewerOptedToRounds = myEnrichment?.openToGolfRounds === true
      viewerHandicap = myEnrichment?.handicap
    }

    // Players around your level — same handicap bucket, opted into
    // rounds, viewer-prioritized.
    viewerBucket = bucketHandicap(viewerHandicap)
    if (viewerBucket && viewer.personId) {
      const sameBucket = visible
        .filter(a => a.person.id !== viewer.personId)
        .filter(a => a.enrichment.openToGolfRounds)
        .filter(a => bucketHandicap(a.enrichment.handicap) === viewerBucket)
        .map(entry => ({
          personId: entry.person.id,
          city: entry.enrichment.city,
          state: entry.enrichment.state,
          updatedAt: entry.enrichment.updatedAt,
          entry,
        }))
      similarPlayers = prioritizeForViewer(sameBucket, viewer).map(d => d.entry)
    }

    // Aggregate notable courses from alumni's home-course + favorite-course
    // entries. Each member counts at most once per course; home course gets
    // ranked first when equal counts.
    for (const v of visible) {
      // Split home + favorite fields the same way, so "Belmont and International"
      // (in either field) becomes two courses that each combine with anyone at
      // Belmont or International.
      // Split only on comma/semicolon (the documented multi-club separator) —
      // NOT " and ", which would mangle a single club named "X Golf and Country
      // Club". normalizeCourseName then merges "Belmont G&CC" with the spelled-out
      // "Belmont Golf and Country Club".
      const splitCourses = (s: string): string[] =>
        s
          .split(/[,;]+/)
          .map((c) => c.trim())
          .filter((c) => c.length > 2 && c.length < 60)
      const homeParts = v.enrichment.homeCourse ? splitCourses(v.enrichment.homeCourse) : []
      const homeKeys = new Set(homeParts.map(normalizeCourseName).filter(Boolean))
      const candidates: string[] = [...homeParts]
      if (v.enrichment.favoriteCourses) {
        candidates.push(...splitCourses(v.enrichment.favoriteCourses))
      }
      const seenForMember = new Set<string>()
      for (const c of candidates) {
        const display = c.trim()
        const key = normalizeCourseName(c)
        if (!key || seenForMember.has(key)) continue
        seenForMember.add(key)
        if (!courseDisplay.has(key)) courseDisplay.set(key, display)
        courseRoll.set(key, (courseRoll.get(key) ?? 0) + 1)
        const isHome = homeKeys.has(key)
        if (isHome) homeCourseSet.add(key)
        const list = courseMembers.get(key) ?? []
        list.push({
          personId: v.person.id,
          name: v.person.canonicalName,
          isHome,
          photoUrl: photoFor(v.person.id),
        })
        courseMembers.set(key, list)
      }
    }

    const { isExampleGathering, isHiddenGathering } = await import('@/lib/seed-data/example-gatherings')
    rounds = store.clubhouseGatherings
      .filter(
        (g) =>
          g.teamId === team.id &&
          g.type === 'round' &&
          g.status !== 'closed' &&
          !isHiddenGathering(g.id),
      )
      .map(g => ({ ...g, isExample: isExampleGathering(g.id, g.isExample) })) as GatheringData[]

    for (const r of store.clubhouseGatheringRequests) {
      if (r.teamId !== team.id) continue
      if (r.status === 'declined' || r.status === 'closed') continue
      interestedByGathering.set(
        r.gatheringId,
        (interestedByGathering.get(r.gatheringId) ?? 0) + 1,
      )
    }

    // Open Requests with intent='round' — visiting members looking for
    // a tee time. The viewer's own requests stay in: the strip pins them
    // first with a "Your request" badge and a Close button, so the poster
    // can confirm it's live and take it down.
    const { getOpenRequestsForTeam } = await import('@/lib/store/local-store')
    openRoundRequests = await getOpenRequestsForTeam(team.id, ['round'])
  }

  // Build homeCourse lookup for the Open Requests strip.
  // Join: request.fromPersonId → personEnrichments (same teamId) → homeCourse.
  // OpenRequest does NOT carry homeCourse itself — we resolve it here on
  // the server and pass a plain Map so the component stays presentational.
  const homeCourseByPersonId = new Map<string, string>()
  if (team) {
    const enrichForTeam = new Map(
      store.personEnrichments
        .filter(e => e.teamId === team.id && !!e.homeCourse)
        .map(e => [e.personId, e.homeCourse as string]),
    )
    for (const req of openRoundRequests) {
      if (!req.fromPersonId) continue
      const course = enrichForTeam.get(req.fromPersonId)
      if (course) homeCourseByPersonId.set(req.fromPersonId, course)
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
    .slice(0, 50)

  // Bunched + ordered course roll for the CourseRoll client (search +
  // expandable per-course member list). Same sort as sortedCourses
  // (count desc, home-courses break ties), but carrying the per-course
  // member list along for the ride.
  const courseRollEntries: CourseRollEntryData[] = sortedCourses.map(
    ([course, count]) => {
      void count
      const members = courseMembers.get(course) ?? []
      // Dedupe in case a member listed the same course as both home +
      // favorite — the earlier loop already does, but defensive.
      const seen = new Set<string>()
      const deduped = members.filter(m => {
        if (seen.has(m.personId)) return false
        seen.add(m.personId)
        return true
      })
      return {
        course: courseDisplay.get(course) ?? course,
        members: deduped,
        isHomeForAnyone: homeCourseSet.has(course),
      }
    },
  )

  const actionCards = [
    {
      label: 'Find a Round',
      description: 'Browse alumni open to hosting or joining a round near you.',
      href: '#open-to-rounds',
      icon: Flag,
    },
    {
      label: 'Host a Round',
      description: 'Open a tee time at your home course on the tee sheet.',
      href: '/the-course/host',
      icon: Users,
    },
    {
      label: 'Browse the Map',
      description: 'See where Penn Golf members are playing across the country.',
      href: '/member-map',
      icon: MapPin,
    },
  ]

  if (!approval.approved) {
    const cityCount = new Set(
      [...rounds.map((r) => r.city).filter(Boolean), ...openToRounds.map((e) => e.enrichment.city).filter(Boolean)],
    ).size
    return (
      <div className="min-h-screen bg-[#fbf9f6]">
        <CourseHero />
        <GatedPreview
          signedIn={approval.signedIn}
          eyebrow="Members only · The Course"
          headline="Tee times open up to the Penn Golf family."
          blurb="The Course is where Penn Golf alumni post home-course rounds and find players nearby. Claim your card to see open tee times and add your own."
          stats={[
            { label: 'Open rounds', value: rounds.length },
            { label: 'Cities', value: cityCount },
            { label: 'Hosting', value: openToRounds.length },
            { label: 'Courses', value: sortedCourses.length },
          ]}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fbf9f6]">
      <CourseHero />

      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-12 space-y-14">
        {/* Host a Round — prominent CTA, always visible */}
        <section>
          <div
            className="bg-gradient-to-r from-[#0a1628] to-[#112240] text-white rounded-2xl px-6 py-7 sm:px-8 sm:py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border border-[#c8a84b]/25"
            style={{ boxShadow: '0 4px 14px rgba(10,22,40,0.18), 0 18px 40px rgba(10,22,40,0.10)' }}
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b] mb-2">
                Open your tee box
              </p>
              <p
                className="text-white text-xl sm:text-2xl font-medium leading-snug font-heading"
              >
                Host a round. Penn Golf will find you there.
              </p>
              <p className="text-[13px] text-white/70 mt-1.5">
                Pick a date, pick a course — alumni and current players in your city will see it and ask in.
              </p>
            </div>
            <Link
              href="/the-course/host"
              data-testid="host-a-round"
              className="bg-[#c8a84b] hover:bg-[#d4b75a] text-[#0a1628] text-[13px] font-semibold uppercase tracking-[0.14em] px-7 py-3.5 rounded-lg transition-colors whitespace-nowrap"
            >
              Host a Round &rarr;
            </Link>
          </div>
        </section>

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
                        className="text-[#0a1628] text-[15px] font-medium leading-snug mb-1 font-heading"
                      >
                        {card.label}
                      </p>
                      <p className="text-[12.5px] text-ink-muted leading-snug">{card.description}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Organized Rounds — Hole 1 */}
        {rounds.length > 0 && (
          <div id="rounds-section" data-testid="rounds-section">
            <CourseHoleSection
              hole={1}
              title="Tee Times"
              rightLabel={`${rounds.length} open`}
              subtitle="Organized rounds open for members to join."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rounds.map((g) => (
                  <GatheringCard
                    key={g.id}
                    gathering={g}
                    interestedCount={interestedByGathering.get(g.id) ?? 0}
                    detailHref={`/gatherings/${g.id}`}
                  />
                ))}
              </div>
            </CourseHoleSection>
            <CartPathDivider />
          </div>
        )}

        {/* Open Requests — members in town looking for a tee time.
            Always renders: the strip's empty state advertises the
            "Post a request" CTA so the surface stays discoverable. */}
        <div className="-mt-4 mb-2">
          <OpenRequestStrip
            requests={openRoundRequests}
            eyebrow="Open Requests"
            title="In town, looking for a round."
            subtitle="Penn Golf members visiting somewhere — ping them if you can play host."
            accent="#2d6a4f"
            limit={6}
            homeCourseByPersonId={homeCourseByPersonId}
            viewerAccountId={viewerAccountId}
          />
        </div>

        {/* Open to a Round — Hole 2 */}
        <div id="open-to-rounds">
          <CourseHoleSection
            hole={rounds.length > 0 ? 2 : 1}
            title="Open to a Round"
            rightLabel={openToRounds.length > 0 ? `${openToRounds.length} available` : undefined}
            subtitle="Penn Golf members open to hosting or joining a round."
          >
          {viewerOptedToRounds && viewerPersonId && (
            <div className="mb-5 inline-flex items-center gap-2 bg-white border border-[#2d6a4f]/30 rounded-full px-3.5 py-1.5 text-[11.5px] text-[#3d4a5c]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]" />
              You&rsquo;re on this list too.
              <Link
                href={`/alumni/profile/${encodeURIComponent(viewerPersonId)}?teamSlug=penn-mens-golf`}
                className="font-semibold text-[#990000] hover:underline"
              >
                Edit
              </Link>
            </div>
          )}
          {openToRounds.length === 0 ? (
            <div
              className="bg-white border border-dashed border-[rgba(180,168,150,0.5)] rounded-xl p-8 text-center"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.04)' }}
            >
              <Flag className="w-6 h-6 text-[#2d6a4f] mx-auto mb-3" />
              <p
                className="text-[#0a1628] text-base font-medium mb-2 font-heading"
              >
                No one&rsquo;s teed off yet.
              </p>
              <p className="text-[13px] text-ink-muted mb-5 max-w-md mx-auto">
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
            (() => {
              // Group "Open to a Round" by role so the page reads cleanly:
              // Current Players, then Alumni, then Coach. Skip empty
              // groups. (Parents/affiliates can opt in too if they ever
              // do, though the role typically belongs to alumni + players.)
              const ROLE_GROUPS = [
                { key: 'current_player', label: 'Current Players' },
                { key: 'alumni', label: 'Alumni' },
                { key: 'coach', label: 'Coach' },
                { key: 'parent', label: 'Family & Affiliate' },
              ] as const
              return (
                <div className="space-y-8">
                  {ROLE_GROUPS.map((g) => {
                    const rows = openToRounds.filter(
                      (e) => e.membership.memberRole === g.key,
                    )
                    if (rows.length === 0) return null
                    return (
                      <div key={g.key}>
                        <div className="flex items-baseline gap-2 mb-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#2d6a4f]">
                            {g.label}
                          </p>
                          <span className="text-[10.5px] tabular-nums text-ink-muted">
                            · {rows.length}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {rows.slice(0, 24).map((entry) => (
                            <AlumniCard
                              key={entry.person.id}
                              href={`/player/alumni/${entry.person.id}?teamSlug=penn-mens-golf`}
                              name={entry.person.canonicalName}
                              photoUrl={entry.photoUrl}
                              subline={entry.membership.classLabel}
                              location={alumniLocation(entry)}
                              handicap={entry.enrichment.handicap}
                              ghin={entry.enrichment.ghin}
                              quote={entry.enrichment.favoriteCourses}
                              showOpenBadge
                              accentColor="#2d6a4f"
                              ctaLabel="Send a note"
                            />
                          ))}
                        </div>
                        {rows.length > 24 && (
                          <div className="mt-3">
                            <Link
                              href="/member-book"
                              className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#2d6a4f] hover:underline"
                            >
                              See all {rows.length} in the Member Book &rarr;
                            </Link>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })()
          )}
          </CourseHoleSection>
        </div>

        {/* Players around your level — same handicap bucket as the
            viewer, opted into rounds. Hidden when the viewer hasn't
            saved a handicap. */}
        {viewerBucket && similarPlayers.length > 0 && (
          <div>
            <div className="flex items-baseline gap-2 mb-1 mt-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#2d6a4f]">
                Around your level
              </p>
              <span className="text-[10.5px] tabular-nums text-ink-muted">
                · {similarPlayers.length}
              </span>
            </div>
            <h2 className="text-base font-semibold text-[#0a1628] mb-1">
              {BUCKET_SHORT[viewerBucket]}
            </h2>
            <p className="text-sm text-ink-muted mb-5">
              Penn Golf members in your bucket — {BUCKET_LABELS[viewerBucket].toLowerCase()}.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {similarPlayers.slice(0, 24).map(entry => (
                <AlumniCard
                  key={entry.person.id}
                  href={`/player/alumni/${entry.person.id}?teamSlug=penn-mens-golf`}
                  name={entry.person.canonicalName}
                  photoUrl={entry.photoUrl}
                  subline={entry.membership.classLabel}
                  location={alumniLocation(entry)}
                  handicap={entry.enrichment.handicap}
                  ghin={entry.enrichment.ghin}
                  quote={entry.enrichment.favoriteCourses}
                  showOpenBadge
                  accentColor="#2d6a4f"
                  ctaLabel="Send a note"
                />
              ))}
            </div>
            {similarPlayers.length > 24 && (
              <div className="mt-3">
                <Link
                  href="/member-book"
                  className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#2d6a4f] hover:underline"
                >
                  See all {similarPlayers.length} in the Member Book &rarr;
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Notable Courses — Hole 3 */}
        {sortedCourses.length > 0 && (
          <div>
            <CartPathDivider />
            <CourseHoleSection
              hole={rounds.length > 0 ? 3 : 2}
              title="Where Penn Golf plays"
              rightLabel="The course roll"
              subtitle="Home courses across the alumni network — access often runs through these."
            >
              <CourseRoll entries={courseRollEntries} />
            </CourseHoleSection>
          </div>
        )}

        {/* Bottom CTA */}
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          <div>
            <p
              className="text-[#0a1628] text-base font-medium font-heading"
            >
              Have a home course?
            </p>
            <p className="text-[12.5px] text-ink-muted mt-1">
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
