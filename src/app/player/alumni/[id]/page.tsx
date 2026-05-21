import Link from 'next/link'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PlayerAlumniProfilePage({ params }: PageProps) {
  const { id } = await params

  const {
    getTeamBySlug,
    getPeopleForTeam,
    getTeamMembershipsForTeam,
    getPersonEnrichment,
  } = await import('@/lib/store/local-store')

  const team = await getTeamBySlug('penn-mens-golf')
  if (!team) notFound()

  const people = await getPeopleForTeam(team.id)
  const person = people.find(p => p.id === id)
  if (!person) notFound()

  const memberships = await getTeamMembershipsForTeam(team.id)
  const membership = memberships.find(m => m.personId === person.id)
  if (!membership) notFound()

  if (!membership.publishedToNetwork) notFound()

  const enrichment = await getPersonEnrichment(person.id, team.id)
  if (enrichment?.visibleToPlayers === false) notFound()

  const hasCareer = !!(enrichment?.currentRole || enrichment?.currentCompany)
  const isCurrentPlayer = membership.memberRole === 'current_player'

  const rosterYears =
    membership.rosterStartYear && membership.rosterEndYear
      ? `${membership.rosterStartYear}–${membership.rosterEndYear}`
      : membership.rosterStartYear
        ? `${membership.rosterStartYear}`
        : null

  const subtitle = isCurrentPlayer
    ? [membership.classYearEstimate?.split(' / ')[0] ?? membership.classLabel, 'Penn Golf']
        .filter(Boolean).join(' · ')
    : [rosterYears ? `Penn Golf ${rosterYears}` : 'Penn Golf', membership.classLabel]
        .filter(Boolean).join(' · ')

  const openToBadges: string[] = [
    enrichment?.openToCoffee ? 'Coffee chat' : null,
    enrichment?.openToMentorship ? 'Mentorship' : null,
    enrichment?.openToWarmIntroductions ? 'Warm introduction' : null,
    enrichment?.openToGolfRounds ? 'Golf round' : null,
  ].filter((v): v is string => v !== null)

  const location = enrichment?.city
    ? [enrichment.city, enrichment.state].filter(Boolean).join(', ')
    : null

  const unclaimed =
    !isCurrentPlayer &&
    membership.memberStatus !== 'verified' &&
    membership.memberStatus !== 'active'

  return (
    <div className="min-h-screen bg-[#f8f5f0]">

      {/* ── Header ── */}
      <div className="bg-[#0a1628] px-5 sm:px-8 pt-8 pb-14">
        <div className="max-w-[900px] mx-auto">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6 text-[10px] font-medium uppercase tracking-[0.15em]">
            <Link
              href="/player/search?teamSlug=penn-mens-golf"
              className="text-white/35 hover:text-white/60 transition-colors"
            >
              Member Book
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-white/55">{person.canonicalName}</span>
          </div>

          {/* Main header row */}
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              {/* Role tag */}
              <span className={`inline-block text-[9px] font-semibold uppercase tracking-[0.18em] px-2 py-0.5 rounded-sm border mb-3 ${
                isCurrentPlayer
                  ? 'text-[#2d6a4f] bg-[#2d6a4f]/15 border-[#2d6a4f]/30'
                  : 'text-white/45 bg-white/8 border-white/15'
              }`}>
                {isCurrentPlayer ? 'Current Player' : 'Penn Golf Alumni'}
              </span>

              {/* Name */}
              <h1
                className="text-white text-3xl sm:text-4xl font-medium leading-tight tracking-tight"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                {person.canonicalName}
              </h1>
              <p className="text-white/50 text-sm mt-2">{subtitle}</p>
              {hasCareer && (
                <p className="text-white/75 text-sm mt-2">
                  {[enrichment?.currentRole, enrichment?.currentCompany].filter(Boolean).join(', ')}
                </p>
              )}
              {location && <p className="text-white/40 text-sm mt-1">{location}</p>}
            </div>

            {!isCurrentPlayer && (
              <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                <Link
                  href={`/ask?personId=${person.id}&purpose=career_advice`}
                  className="text-sm font-semibold bg-[#990000] hover:bg-[#b30000] text-white px-5 py-2.5 rounded-lg transition-colors text-center"
                >
                  Ask for Advice
                </Link>
                <Link
                  href={`/ask?personId=${person.id}&purpose=warm_intro`}
                  className="text-sm font-medium border border-white/20 text-white/80 hover:bg-white/10 px-5 py-2.5 rounded-lg transition-colors text-center"
                >
                  Request Introduction
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content — book-spread two-column on desktop ── */}
      <div data-testid="player-profile" className="max-w-[900px] mx-auto px-5 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-start">

          {/* Left: Penn Golf identity + claim */}
          <div className="space-y-4">

            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
              style={{ boxShadow: '0 1px 4px rgba(10,22,40,0.05)' }}
            >
              <div className="px-5 py-3 border-b border-[rgba(180,168,150,0.22)] bg-[#faf7f2]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70]">
                  Penn Golf
                </p>
              </div>
              <dl className="px-5 py-1 divide-y divide-[rgba(180,168,150,0.18)]">
                {rosterYears && (
                  <div className="flex justify-between items-baseline py-2.5">
                    <dt className="text-xs text-[#8a7f70]">Seasons</dt>
                    <dd className="text-sm font-medium text-[#0a1628]">{rosterYears}</dd>
                  </div>
                )}
                {membership.classLabel && (
                  <div className="flex justify-between items-baseline py-2.5">
                    <dt className="text-xs text-[#8a7f70]">Class</dt>
                    <dd className="text-sm font-medium text-[#0a1628]">{membership.classLabel}</dd>
                  </div>
                )}
                {membership.hometown && (
                  <div className="flex justify-between items-baseline gap-4 py-2.5">
                    <dt className="text-xs text-[#8a7f70] flex-shrink-0">Hometown</dt>
                    <dd className="text-sm font-medium text-[#0a1628] text-right">{membership.hometown}</dd>
                  </div>
                )}
                {membership.highSchool && (
                  <div className="flex justify-between items-baseline gap-4 py-2.5">
                    <dt className="text-xs text-[#8a7f70] flex-shrink-0">High School</dt>
                    <dd className="text-sm font-medium text-[#0a1628] text-right">{membership.highSchool}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Unclaimed — direct visitors to the Member Book / sign-in flow */}
            {unclaimed && (
              <div
                className="bg-[#faf7f2] border border-[rgba(180,168,150,0.4)] rounded-xl p-5"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05)' }}
              >
                <p
                  className="text-[#0a1628] text-base font-medium"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  Is this you?
                </p>
                <p className="text-[12.5px] text-[#8a7f70] mt-1.5">
                  Sign in with Google to claim {person.canonicalName.split(' ')[0]}&rsquo;s card and start sharing your story with the Clubhouse.
                </p>
                <Link
                  href="/login?next=/account/setup"
                  className="inline-block mt-4 bg-[#0a1628] hover:bg-[#112240] text-white text-[12.5px] font-semibold px-5 py-2.5 rounded-lg transition-colors"
                >
                  Sign in to claim
                </Link>
              </div>
            )}
          </div>

          {/* Right: career, help, golf, about, actions */}
          <div className="space-y-4">

            {/* How I Can Help */}
            {((enrichment?.helpTopics && enrichment.helpTopics.length > 0) || openToBadges.length > 0) && (
              <div
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
                style={{ boxShadow: '0 1px 4px rgba(10,22,40,0.05)' }}
              >
                <div className="px-5 py-3 border-b border-[rgba(180,168,150,0.22)] bg-[#faf7f2]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70]">
                    How I Can Help
                  </p>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {enrichment?.helpTopics && enrichment.helpTopics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {enrichment.helpTopics.map(topic => (
                        <span
                          key={topic}
                          className="text-xs font-medium px-3 py-1 rounded-sm bg-[#f5f2ee] border border-[rgba(180,168,150,0.45)] text-[#0a1628]"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                  {openToBadges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {openToBadges.map(label => (
                        <span
                          key={label}
                          className="text-xs font-medium px-3 py-1 rounded-sm bg-[#0a1628]/5 border border-[#0a1628]/12 text-[#0a1628]"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Career */}
            {hasCareer && (
              <div
                data-testid="career-contact-card"
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
                style={{ boxShadow: '0 1px 4px rgba(10,22,40,0.05)' }}
              >
                <div className="px-5 py-3 border-b border-[rgba(180,168,150,0.22)] bg-[#faf7f2]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70]">Career</p>
                </div>
                <dl className="px-5 py-1 divide-y divide-[rgba(180,168,150,0.18)]">
                  {enrichment?.currentRole && (
                    <div className="flex justify-between items-baseline gap-4 py-2.5">
                      <dt className="text-xs text-[#8a7f70] flex-shrink-0">Role</dt>
                      <dd className="text-sm font-medium text-[#0a1628] text-right">{enrichment.currentRole}</dd>
                    </div>
                  )}
                  {enrichment?.currentCompany && (
                    <div className="flex justify-between items-baseline gap-4 py-2.5">
                      <dt className="text-xs text-[#8a7f70] flex-shrink-0">Company</dt>
                      <dd className="text-sm font-medium text-[#0a1628] text-right">{enrichment.currentCompany}</dd>
                    </div>
                  )}
                  {enrichment?.industry && (
                    <div className="flex justify-between items-baseline gap-4 py-2.5">
                      <dt className="text-xs text-[#8a7f70] flex-shrink-0">Industry</dt>
                      <dd className="text-sm font-medium text-[#0a1628] text-right">{enrichment.industry}</dd>
                    </div>
                  )}
                  {location && (
                    <div className="flex justify-between items-baseline gap-4 py-2.5">
                      <dt className="text-xs text-[#8a7f70] flex-shrink-0">Location</dt>
                      <dd className="text-sm font-medium text-[#0a1628] text-right">{location}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Golf */}
            {(enrichment?.favoriteCourses || enrichment?.openToGolfRounds) && (
              <div
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
                style={{ boxShadow: '0 1px 4px rgba(10,22,40,0.05)' }}
              >
                <div className="px-5 py-3 border-b border-[rgba(180,168,150,0.22)] bg-[#faf7f2]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70]">Golf</p>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {enrichment?.favoriteCourses && (
                    <div>
                      <p className="text-[10px] text-[#8a7f70] uppercase tracking-wider mb-1">Favorite courses</p>
                      <p className="text-sm font-medium text-[#0a1628]">{enrichment.favoriteCourses}</p>
                    </div>
                  )}
                  {enrichment?.openToGolfRounds && (
                    <span className="inline-block text-xs font-medium px-3 py-1 rounded-sm bg-[#2d6a4f]/10 border border-[#2d6a4f]/25 text-[#2d6a4f]">
                      Open to golf rounds
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* About */}
            {enrichment?.alumniBio && (
              <div
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
                style={{ boxShadow: '0 1px 4px rgba(10,22,40,0.05)' }}
              >
                <div className="px-5 py-3 border-b border-[rgba(180,168,150,0.22)] bg-[#faf7f2]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70]">About</p>
                </div>
                <p className="px-5 py-4 text-sm text-[#0a1628] leading-relaxed">{enrichment.alumniBio}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              {enrichment?.openToGolfRounds && (
                <Link
                  href={`/ask?personId=${person.id}&purpose=golf_round`}
                  className="text-sm font-medium border border-[rgba(180,168,150,0.55)] hover:border-[#0a1628] text-[#0a1628] px-5 py-2.5 rounded-lg transition-colors bg-white"
                >
                  Invite to a Round
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
