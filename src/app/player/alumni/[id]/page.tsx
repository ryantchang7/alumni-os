import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Mail, Phone, ExternalLink, Lock } from 'lucide-react'
import { auth } from '@/auth'
import MemberAvatar from '@/components/MemberAvatar'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PlayerAlumniProfilePage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()

  const {
    getTeamBySlug,
    getPeopleForTeam,
    getTeamMembershipsForTeam,
    getPersonEnrichment,
    getAllLinkedAccountsForTeam,
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
  // Members hidden from players (visibleToPlayers === false) are filtered out
  // of every list + the profiles API, so their detail page 404s to match.
  if (enrichment?.visibleToPlayers === false) notFound()

  // Profile photo: the member's uploaded photo, else their Google avatar
  // (stored on the linked Account at sign-in) — same merge as
  // api/player/profiles/route.ts and the Member Book detail page.
  const linkedAccount = (await getAllLinkedAccountsForTeam(team.id)).find(
    a => a.linkedPersonId === person.id,
  )
  const photoUrl = enrichment?.photoUrl ?? linkedAccount?.image ?? null

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

  // Contact-info gating: visible only to signed-in members who have
  // claimed their own card (linkedPersonId on the session). We don't
  // gate viewing the rest of the profile, only direct contact details.
  const viewerIsApproved = !!session?.accountId && !!session?.linkedPersonId
  const hasContactInfo = !!(
    enrichment?.email || enrichment?.phone || enrichment?.linkedinUrl
  )

  return (
    <div className="min-h-screen bg-[#fbf9f6]">

      {/* ── Header ── */}
      <div className="bg-[#0a1628] px-5 sm:px-8 pt-8 pb-14">
        <div className="max-w-[900px] mx-auto">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6 text-[10px] font-medium uppercase tracking-[0.15em]">
            <Link
              href="/member-book"
              className="text-gold hover:text-white transition-colors"
            >
              Member Book
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-white/70">{person.canonicalName}</span>
          </div>

          {/* Main header row */}
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div className="flex items-start gap-5">
              <MemberAvatar photoUrl={photoUrl} name={person.canonicalName} size={80} tone="onDark" />
              <div className="min-w-0">
              {/* Role tag */}
              <span className={`inline-block text-[11px] font-semibold uppercase tracking-[0.18em] px-2 py-0.5 rounded-sm border mb-3 ${
                isCurrentPlayer
                  ? 'text-[#2d6a4f] bg-[#2d6a4f]/15 border-[#2d6a4f]/30'
                  : 'text-gold bg-gold/15 border-gold/30'
              }`}>
                {isCurrentPlayer ? 'Current Player' : 'Penn Golf Alumni'}
              </span>

              {/* Name */}
              <h1
                className="text-white text-3xl sm:text-4xl font-medium leading-tight tracking-tight font-heading"
              >
                {person.canonicalName}
              </h1>
              <p className="text-white/75 text-sm mt-2">{subtitle}</p>
              {hasCareer && (
                <p className="text-white/75 text-sm mt-2">
                  {[enrichment?.currentRole, enrichment?.currentCompany].filter(Boolean).join(', ')}
                </p>
              )}
              {location && <p className="text-white/70 text-sm mt-1">{location}</p>}
              </div>
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
              <div className="px-5 py-3 border-b border-[rgba(180,168,150,0.22)] bg-[#fdfcf9]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
                  Penn Golf
                </p>
              </div>
              <dl className="px-5 py-1 divide-y divide-[rgba(180,168,150,0.18)]">
                {rosterYears && (
                  <div className="flex justify-between items-baseline py-2.5">
                    <dt className="text-xs text-ink-muted">Seasons</dt>
                    <dd className="text-sm font-medium text-[#0a1628]">{rosterYears}</dd>
                  </div>
                )}
                {membership.classLabel && (
                  <div className="flex justify-between items-baseline py-2.5">
                    <dt className="text-xs text-ink-muted">Class</dt>
                    <dd className="text-sm font-medium text-[#0a1628]">{membership.classLabel}</dd>
                  </div>
                )}
                {membership.hometown && (
                  <div className="flex justify-between items-baseline gap-4 py-2.5">
                    <dt className="text-xs text-ink-muted flex-shrink-0">Hometown</dt>
                    <dd className="text-sm font-medium text-[#0a1628] text-right">{membership.hometown}</dd>
                  </div>
                )}
                {membership.highSchool && (
                  <div className="flex justify-between items-baseline gap-4 py-2.5">
                    <dt className="text-xs text-ink-muted flex-shrink-0">High School</dt>
                    <dd className="text-sm font-medium text-[#0a1628] text-right">{membership.highSchool}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Unclaimed — direct visitors to the Member Book / sign-in flow */}
            {unclaimed && (
              <div
                className="bg-[#fdfcf9] border border-[rgba(180,168,150,0.4)] rounded-xl p-5"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05)' }}
              >
                <p
                  className="text-[#0a1628] text-base font-medium font-heading"
                >
                  Is this you?
                </p>
                <p className="text-[12.5px] text-ink-muted mt-1.5">
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
                <div className="px-5 py-3 border-b border-[rgba(180,168,150,0.22)] bg-[#fdfcf9]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
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
                <div className="px-5 py-3 border-b border-[rgba(180,168,150,0.22)] bg-[#fdfcf9]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">Career</p>
                </div>
                <dl className="px-5 py-1 divide-y divide-[rgba(180,168,150,0.18)]">
                  {enrichment?.currentRole && (
                    <div className="flex justify-between items-baseline gap-4 py-2.5">
                      <dt className="text-xs text-ink-muted flex-shrink-0">Role</dt>
                      <dd className="text-sm font-medium text-[#0a1628] text-right">{enrichment.currentRole}</dd>
                    </div>
                  )}
                  {enrichment?.currentCompany && (
                    <div className="flex justify-between items-baseline gap-4 py-2.5">
                      <dt className="text-xs text-ink-muted flex-shrink-0">Company</dt>
                      <dd className="text-sm font-medium text-[#0a1628] text-right">{enrichment.currentCompany}</dd>
                    </div>
                  )}
                  {enrichment?.industry && (
                    <div className="flex justify-between items-baseline gap-4 py-2.5">
                      <dt className="text-xs text-ink-muted flex-shrink-0">Industry</dt>
                      <dd className="text-sm font-medium text-[#0a1628] text-right">{enrichment.industry}</dd>
                    </div>
                  )}
                  {location && (
                    <div className="flex justify-between items-baseline gap-4 py-2.5">
                      <dt className="text-xs text-ink-muted flex-shrink-0">Location</dt>
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
                <div className="px-5 py-3 border-b border-[rgba(180,168,150,0.22)] bg-[#fdfcf9]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">Golf</p>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {enrichment?.favoriteCourses && (
                    <div>
                      <p className="text-[10px] text-ink-muted uppercase tracking-wider mb-1">Favorite courses</p>
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
                <div className="px-5 py-3 border-b border-[rgba(180,168,150,0.22)] bg-[#fdfcf9]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">About</p>
                </div>
                <p className="px-5 py-4 text-sm text-[#0a1628] leading-relaxed">{enrichment.alumniBio}</p>
              </div>
            )}

            {/* Contact — gated to signed-in members who have claimed their card */}
            {!isCurrentPlayer && (
              <div
                data-testid="contact-card"
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
                style={{ boxShadow: '0 1px 4px rgba(10,22,40,0.05)' }}
              >
                <div className="px-5 py-3 border-b border-[rgba(180,168,150,0.22)] bg-[#fdfcf9] flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
                    Contact
                  </p>
                  {!viewerIsApproved && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-ink-muted">
                      <Lock className="w-2.5 h-2.5" />
                      Members only
                    </span>
                  )}
                </div>
                {viewerIsApproved ? (
                  hasContactInfo ? (
                    <dl className="px-5 py-1 divide-y divide-[rgba(180,168,150,0.18)]">
                      {enrichment?.email && (
                        <div className="flex items-center justify-between gap-4 py-2.5">
                          <dt className="text-xs text-ink-muted flex items-center gap-2 flex-shrink-0">
                            <Mail className="w-3 h-3" /> Email
                          </dt>
                          <dd className="text-sm font-medium text-[#0a1628] text-right truncate">
                            <a href={`mailto:${enrichment.email}`} className="hover:underline">
                              {enrichment.email}
                            </a>
                          </dd>
                        </div>
                      )}
                      {enrichment?.phone && (
                        <div className="flex items-center justify-between gap-4 py-2.5">
                          <dt className="text-xs text-ink-muted flex items-center gap-2 flex-shrink-0">
                            <Phone className="w-3 h-3" /> Phone
                          </dt>
                          <dd className="text-sm font-medium text-[#0a1628] text-right">
                            <a href={`tel:${enrichment.phone}`} className="hover:underline">
                              {enrichment.phone}
                            </a>
                          </dd>
                        </div>
                      )}
                      {enrichment?.linkedinUrl && (
                        <div className="flex items-center justify-between gap-4 py-2.5">
                          <dt className="text-xs text-ink-muted flex items-center gap-2 flex-shrink-0">
                            <ExternalLink className="w-3 h-3" /> LinkedIn
                          </dt>
                          <dd className="text-sm font-medium text-[#0a1628] text-right truncate">
                            <a
                              href={enrichment.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {enrichment.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                          </dd>
                        </div>
                      )}
                    </dl>
                  ) : (
                    <p className="px-5 py-4 text-[12.5px] text-ink-muted italic">
                      {person.canonicalName.split(' ')[0]} hasn&rsquo;t added contact details yet. Use the request buttons above to start a private conversation.
                    </p>
                  )
                ) : (
                  <div className="px-5 py-4">
                    <p className="text-[13px] text-[#0a1628] leading-relaxed">
                      Direct contact info opens up to <strong>signed-in Penn Golf members</strong> who have claimed their card.
                    </p>
                    <Link
                      href="/login?next=/account/setup"
                      className="inline-block mt-3 bg-[#0a1628] hover:bg-[#112240] text-white text-[11.5px] font-semibold uppercase tracking-[0.14em] px-4 py-2 rounded-md transition-colors"
                    >
                      Sign in to unlock
                    </Link>
                  </div>
                )}
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
