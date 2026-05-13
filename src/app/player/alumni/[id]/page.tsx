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
  if (!membership || !membership.publishedToNetwork) notFound()

  const enrichment = await getPersonEnrichment(person.id, team.id)

  if (enrichment?.visibleToPlayers === false) notFound()

  const isVerified =
    enrichment?.verificationStatus === 'source_backed' ||
    enrichment?.verificationStatus === 'manually_verified'

  const hasCareer = isVerified && (enrichment?.currentRole || enrichment?.currentCompany)

  const rosterLabel =
    membership.rosterStartYear && membership.rosterEndYear
      ? `Penn Golf ${membership.rosterStartYear}–${String(membership.rosterEndYear).slice(-2)}`
      : membership.rosterStartYear
        ? `Penn Golf ${membership.rosterStartYear}`
        : 'Penn Golf'

  const CONTACT_LABELS: Record<string, string> = {
    team_intro: 'Team intro first',
    email_ok: 'Email is fine',
    linkedin_ok: 'LinkedIn message is fine',
    not_available: 'Not available right now',
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-8 pt-10 pb-10">
        <div className="max-w-[860px] mx-auto">
          <div className="flex items-center gap-2 mb-4 text-xs">
            <Link href="/player" className="text-gray-400 hover:text-gray-200 transition-colors">
              &larr; Player Mode
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-300">{person.canonicalName}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-white text-2xl font-semibold tracking-tight">{person.canonicalName}</h1>
              <p className="text-gray-400 text-sm mt-1">{rosterLabel}</p>
            </div>
            <Link
              href={`/player/outreach/${person.id}`}
              className="flex-shrink-0 text-xs bg-[#990000] hover:bg-[#b30000] text-white px-4 py-2 rounded font-medium transition-colors"
            >
              Ask for help &rarr;
            </Link>
          </div>
        </div>
      </div>

      <div data-testid="player-profile" className="max-w-[860px] mx-auto px-8 py-8">
        <div className="space-y-4">
          {/* Roster info */}
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
              {membership.rosterStartYear && (
                <div>
                  <dt className="text-xs text-[#8a7f70] mb-0.5">Years on team</dt>
                  <dd className="font-medium text-[#0a1628]">{rosterLabel.replace('Penn Golf ', '')}</dd>
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

          {/* Career card — only show if team-verified */}
          {hasCareer && (
            <div
              data-testid="career-contact-card"
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider">Career</p>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                  Team verified
                </span>
              </div>
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
                {enrichment?.city && (
                  <div>
                    <dt className="text-xs text-[#8a7f70] mb-0.5">Location</dt>
                    <dd className="font-medium text-[#0a1628]">
                      {[enrichment.city, enrichment.state].filter(Boolean).join(', ')}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Alumni bio */}
          {enrichment?.alumniBio && (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-3">About</p>
              <p className="text-sm text-[#0a1628] leading-relaxed">{enrichment.alumniBio}</p>
            </div>
          )}

          {/* How I can help */}
          {enrichment?.helpTopics && enrichment.helpTopics.length > 0 && (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-3">
                How I can help
              </p>
              <div className="flex flex-wrap gap-2">
                {enrichment.helpTopics.map(topic => (
                  <span
                    key={topic}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-[#f5f2ee] border border-[rgba(180,168,150,0.5)] text-[#0a1628]"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact preference */}
          {enrichment?.contactPreference && (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-3">
                Best way to reach out
              </p>
              <p className="text-sm text-[#0a1628] font-medium">
                {CONTACT_LABELS[enrichment.contactPreference] ?? enrichment.contactPreference}
              </p>
            </div>
          )}

          {/* Ask for help CTA */}
          <div className="pt-2">
            <Link
              href={`/player/outreach/${person.id}`}
              className="inline-flex items-center text-sm font-semibold bg-[#990000] hover:bg-[#b30000] text-white px-6 py-3 rounded-lg transition-colors"
            >
              Ask {person.firstName ?? person.canonicalName.split(' ')[0]} for help &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
