import Link from 'next/link'
import { notFound } from 'next/navigation'
import ClaimModule from './ClaimModule'

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

  // All members must be published to appear here
  if (!membership.publishedToNetwork) notFound()

  const enrichment = await getPersonEnrichment(person.id, team.id)

  if (enrichment?.visibleToPlayers === false) notFound()

  const hasCareer = !!(enrichment?.currentRole || enrichment?.currentCompany)

  const isCurrentPlayer = membership.memberRole === 'current_player'

  const rosterYears =
    membership.rosterStartYear && membership.rosterEndYear
      ? `${membership.rosterStartYear}–${String(membership.rosterEndYear).slice(-2)}`
      : membership.rosterStartYear
        ? `${membership.rosterStartYear}`
        : null

  const subtitle = isCurrentPlayer
    ? [
        membership.classYearEstimate?.split(' / ')[0] ?? membership.classLabel ?? null,
        'Penn Golf',
      ]
        .filter(Boolean)
        .join(' · ')
    : [
        rosterYears ? `Penn Golf ${rosterYears}` : 'Penn Golf',
        membership.classLabel ?? null,
      ]
        .filter(Boolean)
        .join(' · ')

  const openToBadges: string[] = [
    enrichment?.openToCoffee ? 'Coffee chat' : null,
    enrichment?.openToMentorship ? 'Mentorship' : null,
    enrichment?.openToWarmIntroductions ? 'Warm introduction' : null,
    enrichment?.openToGolfRounds ? 'Golf round' : null,
  ].filter((v): v is string => v !== null)

  const location = enrichment?.city
    ? [enrichment.city, enrichment.state].filter(Boolean).join(', ')
    : null

  const first = person.firstName ?? person.canonicalName.split(' ')[0]

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Header */}
      <div className="bg-[#0a1628] px-8 pt-10 pb-12">
        <div className="max-w-[860px] mx-auto">
          <div className="flex items-center gap-2 mb-5 text-xs">
            <Link href="/player" className="text-gray-400 hover:text-gray-200 transition-colors">
              &larr; Player Mode
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-300">{person.canonicalName}</span>
          </div>

          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-white text-3xl font-semibold tracking-tight leading-tight">
                {person.canonicalName}
              </h1>
              <p className="text-gray-400 text-sm mt-2">{subtitle}</p>

              {hasCareer && (
                <p className="text-gray-300 text-sm mt-3">
                  {[enrichment?.currentRole, enrichment?.currentCompany]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}

              {location && (
                <p className="text-gray-400 text-sm mt-1.5">{location}</p>
              )}

              <div className="flex items-center gap-2 mt-4">
                {isCurrentPlayer ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-[#0a1628]/15 border border-[#0a1628]/35 text-[#0a1628]">
                    Current Player
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-[#2d6a4f]/15 border border-[#2d6a4f]/35 text-[#2d6a4f]">
                    Penn Golf Alumni
                  </span>
                )}
              </div>
            </div>

            <Link
              href={`/ask?personId=${person.id}&purpose=career_advice`}
              className="flex-shrink-0 text-sm font-semibold bg-[#990000] hover:bg-[#b30000] text-white px-5 py-2.5 rounded-lg transition-colors"
            >
              Ask for Help &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div data-testid="player-profile" className="max-w-[860px] mx-auto px-8 py-8">
        <div className="space-y-4">

          {/* How I Can Help */}
          {((enrichment?.helpTopics && enrichment.helpTopics.length > 0) || openToBadges.length > 0) && (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-4">
                How I Can Help
              </p>
              {enrichment?.helpTopics && enrichment.helpTopics.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {enrichment.helpTopics.map(topic => (
                    <span
                      key={topic}
                      className="text-xs font-medium px-3 py-1.5 rounded-full bg-[#f5f2ee] border border-[rgba(180,168,150,0.5)] text-[#0a1628]"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}
              {openToBadges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {openToBadges.map(label => (
                    <span
                      key={label}
                      className="text-xs font-medium px-3 py-1.5 rounded-full bg-[#0a1628]/5 border border-[#0a1628]/15 text-[#0a1628]"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Penn Golf section */}
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-4">
              Penn Golf
            </p>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {membership.classLabel && (
                <div>
                  <dt className="text-xs text-[#8a7f70] mb-0.5">Class</dt>
                  <dd className="font-medium text-[#0a1628]">{membership.classLabel}</dd>
                </div>
              )}
              {rosterYears && (
                <div>
                  <dt className="text-xs text-[#8a7f70] mb-0.5">Years on team</dt>
                  <dd className="font-medium text-[#0a1628]">{rosterYears}</dd>
                </div>
              )}
              {membership.hometown && (
                <div>
                  <dt className="text-xs text-[#8a7f70] mb-0.5">Hometown</dt>
                  <dd className="font-medium text-[#0a1628]">{membership.hometown}</dd>
                </div>
              )}
              {membership.highSchool && (
                <div>
                  <dt className="text-xs text-[#8a7f70] mb-0.5">High school</dt>
                  <dd className="font-medium text-[#0a1628]">{membership.highSchool}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Career */}
          {hasCareer && (
            <div
              data-testid="career-contact-card"
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-4">Career</p>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                {enrichment?.currentRole && (
                  <div>
                    <dt className="text-xs text-[#8a7f70] mb-0.5">Role</dt>
                    <dd className="font-medium text-[#0a1628]">{enrichment.currentRole}</dd>
                  </div>
                )}
                {enrichment?.currentCompany && (
                  <div>
                    <dt className="text-xs text-[#8a7f70] mb-0.5">Company</dt>
                    <dd className="font-medium text-[#0a1628]">{enrichment.currentCompany}</dd>
                  </div>
                )}
                {enrichment?.industry && (
                  <div>
                    <dt className="text-xs text-[#8a7f70] mb-0.5">Industry</dt>
                    <dd className="font-medium text-[#0a1628]">{enrichment.industry}</dd>
                  </div>
                )}
                {location && (
                  <div>
                    <dt className="text-xs text-[#8a7f70] mb-0.5">Location</dt>
                    <dd className="font-medium text-[#0a1628]">{location}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Golf section */}
          {(enrichment?.favoriteCourses || enrichment?.openToGolfRounds) && (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-4">
                Golf
              </p>
              <div className="space-y-3 text-sm">
                {enrichment?.favoriteCourses && (
                  <div>
                    <p className="text-xs text-[#8a7f70] mb-0.5">Favorite courses</p>
                    <p className="font-medium text-[#0a1628]">{enrichment.favoriteCourses}</p>
                  </div>
                )}
                {enrichment?.openToGolfRounds && (
                  <span className="inline-block text-xs font-medium px-3 py-1.5 rounded-full bg-[#2d6a4f]/10 border border-[#2d6a4f]/30 text-[#2d6a4f]">
                    Open to golf rounds
                  </span>
                )}
              </div>
            </div>
          )}

          {/* About */}
          {enrichment?.alumniBio && (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-3">About</p>
              <p className="text-sm text-[#0a1628] leading-relaxed">{enrichment.alumniBio}</p>
            </div>
          )}

          {/* Claim module — alumni only, unclaimed profiles */}
          {!isCurrentPlayer && membership.memberStatus !== 'verified' && membership.memberStatus !== 'active' && (
            <ClaimModule memberId={person.id} memberName={person.canonicalName} />
          )}

          {/* Action buttons */}
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href={`/ask?personId=${person.id}&purpose=career_advice`}
              className="inline-flex items-center text-sm font-semibold bg-[#990000] hover:bg-[#b30000] text-white px-6 py-3 rounded-lg transition-colors"
            >
              Ask for Advice &rarr;
            </Link>
            <Link
              href={`/ask?personId=${person.id}&purpose=warm_intro`}
              className="inline-flex items-center text-sm font-medium border border-[rgba(180,168,150,0.6)] hover:border-[#0a1628] text-[#0a1628] px-6 py-3 rounded-lg transition-colors bg-white"
            >
              Request Introduction
            </Link>
            {enrichment?.openToGolfRounds && (
              <Link
                href={`/ask?personId=${person.id}&purpose=golf_round`}
                className="inline-flex items-center text-sm font-medium border border-[rgba(180,168,150,0.6)] hover:border-[#0a1628] text-[#0a1628] px-6 py-3 rounded-lg transition-colors bg-white"
              >
                Invite to a Round
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
