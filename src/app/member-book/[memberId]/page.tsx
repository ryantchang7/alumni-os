import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { auth } from '@/auth'
import { getMemberById } from '@/lib/member-book/data'
import {
  isPublicMember,
  getMemberPennGolfYears,
  getMemberHometownLabel,
  isActiveMember,
} from '@/lib/member-book/helpers'
import { findTeamStorePersonForBookEntry } from '@/lib/member-book/bridge'
import { readStore, getTeamBySlug } from '@/lib/store/local-store'
import type { TeamMembership, PersonEnrichment } from '@/lib/store/types'
import { getBadgesForAccount, type BadgeId } from '@/lib/badges'
import MemberBadges from '@/components/MemberBadges'
import MessageMemberButton from '@/components/MessageMemberButton'

// Detail pages render on demand so we don't ship 337 prebuilt HTML payloads
// in the deploy artifact (caused vercel CLI Upload aborted at ~29 MB).
export const dynamic = 'force-dynamic'

const TEAM_SLUG = 'penn-mens-golf'

interface StoreMatch {
  personId: string
  membership: TeamMembership | undefined
  enrichment: PersonEnrichment | undefined
  accountImage: string | undefined
  accountId: string | undefined
  badges: BadgeId[]
}

async function lookupStoreMatch(displayName: string): Promise<StoreMatch | null> {
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return null
  const store = await readStore()
  const match = findTeamStorePersonForBookEntry(
    { displayName } as Parameters<typeof findTeamStorePersonForBookEntry>[0],
    store.people,
  )
  if (!match) return null
  const membership = store.teamMemberships.find(
    (m) => m.teamId === team.id && m.personId === match.id,
  )
  const enrichment = store.personEnrichments.find(
    (e) => e.teamId === team.id && e.personId === match.id,
  )
  // The account that claimed this person (if any) carries their Google avatar.
  const account = store.accounts.find(
    (a) => a.teamId === team.id && a.linkedPersonId === match.id,
  )
  return {
    personId: match.id,
    membership,
    enrichment,
    accountImage: account?.image,
    accountId: account?.id,
    badges: getBadgesForAccount(account),
  }
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ memberId: string }>
}) {
  const { memberId } = await params
  const decoded = decodeURIComponent(memberId)
  const member = getMemberById(decoded)

  if (!member || !isPublicMember(member)) {
    notFound()
  }

  const [storeMatch, session] = await Promise.all([
    lookupStoreMatch(member.displayName),
    auth(),
  ])
  const isOwner =
    !!session?.linkedPersonId &&
    !!storeMatch?.personId &&
    session.linkedPersonId === storeMatch.personId

  const years = getMemberPennGolfYears(member)
  const hometown =
    storeMatch?.membership?.hometown ?? getMemberHometownLabel(member)
  const classYear = member.profile.classYearEstimate
  const isCurrent =
    isActiveMember(member) ||
    storeMatch?.membership?.memberRole === 'current_player'
  const totalLetters = member.letterWinner.years.length
  const totalSeasons =
    member.career.verifiedRosterSeasonCount > 0
      ? member.career.verifiedRosterSeasonCount
      : member.career.inferredLetterSeasons.length

  // Bridged enrichment (team-store) takes precedence over book profile fields.
  const enr = storeMatch?.enrichment
  const role = enr?.currentRole ?? member.profile.currentRole ?? null
  const company = enr?.currentCompany ?? member.profile.currentCompany ?? null
  const industry = enr?.industry ?? null
  const city = enr?.city ?? member.profile.city ?? null
  const state = enr?.state ?? null
  const additionalLocations = enr?.additionalLocations ?? []
  const bio = enr?.alumniBio ?? null
  const helpTopics = enr?.helpTopics ?? []
  const homeCourse = enr?.homeCourse ?? null
  const favoriteCourses = enr?.favoriteCourses ?? null
  const favoritePennGolfMemory = enr?.favoritePennGolfMemory ?? null
  const interests = enr?.interests ?? null
  const highSchool = member.profile.highSchool ?? null
  // Contact info only surfaces for signed-in viewers (privacy).
  const showContact = !!session
  const contactEmail = showContact ? enr?.email ?? null : null
  const contactPhone = showContact ? enr?.phone ?? null : null
  const linkedinUrl = showContact ? enr?.linkedinUrl ?? null : null
  // Photo: prefer the alum's manually-set URL, fall back to their Google
  // avatar (stored on their Account at sign-in).
  const photoUrl = enr?.photoUrl ?? storeMatch?.accountImage ?? null

  const hasProfileDetails =
    role || company || industry || city || additionalLocations.length > 0 || bio || interests
  const hasGolfDetails = homeCourse || favoriteCourses || favoritePennGolfMemory
  const hasContact = contactEmail || contactPhone || linkedinUrl

  // Claim CTA destination depends on whether a store record exists.
  const claimHref = storeMatch
    ? `/alumni/profile/${storeMatch.personId}?teamSlug=${TEAM_SLUG}`
    : `/alumni/claim?bookId=${encodeURIComponent(member.id)}`
  const claimLabel = storeMatch ? 'Update Profile' : 'Claim & Update'

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Header strip */}
      <div className="bg-[#0a1628] px-5 sm:px-8 py-5">
        <div className="max-w-[820px] mx-auto flex items-center justify-between">
          <Link
            href="/member-book"
            className="inline-flex items-center gap-1.5 text-[12px] text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to the Member Book</span>
          </Link>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
            Penn Men&rsquo;s Golf
          </p>
        </div>
      </div>

      {/* Main card */}
      <div className="max-w-[820px] mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <div
          className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl overflow-hidden"
          style={{
            boxShadow:
              '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.06)',
          }}
        >
          {/* Identity */}
          <div className="px-7 sm:px-10 pt-10 pb-8 border-b border-[rgba(180,168,150,0.3)] relative">
            <span className="block w-12 h-[2px] bg-[#990000] mb-6" />
            <div className="flex items-start gap-5">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={member.displayName}
                  className="w-20 h-20 rounded-full object-cover border border-[rgba(180,168,150,0.4)] flex-shrink-0"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full bg-[#0a1628] text-white flex items-center justify-center flex-shrink-0 border border-[rgba(180,168,150,0.4)]"
                  aria-hidden
                >
                  <span
                    className="text-[26px] font-medium"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    {member.displayName
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase() ?? '')
                      .join('')}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1
                  className="text-[#0a1628] text-3xl sm:text-4xl font-medium leading-tight"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                  data-testid="member-detail-name"
                >
                  {member.displayName}
                </h1>
                {storeMatch?.badges && storeMatch.badges.length > 0 && (
                  <div className="mt-3">
                    <MemberBadges badges={storeMatch.badges} size="md" />
                  </div>
                )}
            {years && (
              <p className="text-[15px] text-[#3d4a5c] mt-3" data-testid="member-detail-years">
                {years}
              </p>
            )}
            <dl className="text-[13.5px] text-[#3d4a5c] mt-3 space-y-0.5">
              {classYear && (
                <div className="flex gap-2">
                  <dt className="text-[#8a7f70]">Class:</dt>
                  <dd>{classYear}</dd>
                </div>
              )}
              {highSchool && (
                <div className="flex gap-2">
                  <dt className="text-[#8a7f70]">High school:</dt>
                  <dd>{highSchool}</dd>
                </div>
              )}
              {hometown && (
                <div className="flex gap-2">
                  <dt className="text-[#8a7f70]">Hometown:</dt>
                  <dd>{hometown}</dd>
                </div>
              )}
            </dl>
                {isCurrent && (
                  <span className="inline-block mt-5 text-[10px] font-medium px-2.5 py-1 rounded-full text-[#2d6a4f] bg-[#2d6a4f]/8 border border-[#2d6a4f]/25 uppercase tracking-[0.14em]">
                    Current Player
                  </span>
                )}
                {storeMatch?.accountId && !isOwner && (
                  <div className="mt-6">
                    <MessageMemberButton
                      targetAccountId={storeMatch.accountId}
                      targetFirstName={member.displayName.split(/\s+/)[0]}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Penn Golf section */}
          <Section title="Penn Golf">
            {years && (
              <p className="text-[14px] text-[#3d4a5c] leading-relaxed">
                {years.replace('Penn Golf ', 'On the team from ')}.
              </p>
            )}
            {(totalLetters > 0 || totalSeasons > 0) && (
              <div className="mt-5 grid grid-cols-2 gap-4 max-w-md">
                {totalLetters > 0 && (
                  <Stat
                    value={totalLetters}
                    label={totalLetters === 1 ? 'Letter Year' : 'Letter Years'}
                  />
                )}
                {totalSeasons > 0 && (
                  <Stat
                    value={totalSeasons}
                    label={totalSeasons === 1 ? 'Season' : 'Seasons'}
                  />
                )}
              </div>
            )}
            {!years && totalLetters === 0 && totalSeasons === 0 && (
              <p className="text-[14px] text-[#8a7f70] italic">
                Years and letter history coming as the archive is reconciled.
              </p>
            )}
          </Section>

          {/* Clubhouse Profile */}
          <Section title="Clubhouse Profile">
            {hasProfileDetails ? (
              <div className="space-y-2 text-[14px] text-[#3d4a5c]">
                {role && company && (
                  <p>
                    {role} ·{' '}
                    <span className="text-[#0a1628]">{company}</span>
                  </p>
                )}
                {role && !company && <p>{role}</p>}
                {!role && company && <p>{company}</p>}
                {industry && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {industry
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#8a7f70]/10 text-[#3d4a5c] border border-[#8a7f70]/25"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                )}
                {(city || additionalLocations.length > 0) && (
                  <p>
                    {city && <span>{[city, state].filter(Boolean).join(', ')}</span>}
                    {additionalLocations.map((loc, i) => {
                      const place = [loc.city, loc.state].filter(Boolean).join(', ')
                      if (!place) return null
                      return (
                        <span key={i} className="text-[#8a7f70]">
                          {city || i > 0 ? ' · ' : ''}
                          {place}
                          {loc.label && (
                            <span className="italic"> ({loc.label})</span>
                          )}
                        </span>
                      )
                    })}
                  </p>
                )}
                {bio && (
                  <p className="text-[#3d4a5c] leading-relaxed pt-1">{bio}</p>
                )}
                {interests && (
                  <p className="text-[#3d4a5c] leading-relaxed pt-1">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7f70] mr-2">
                      Interests
                    </span>
                    {interests}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[14px] text-[#8a7f70] italic">
                This member hasn&rsquo;t added details yet.
              </p>
            )}
          </Section>

          {/* Contact (signed-in only) */}
          {hasContact && (
            <Section title="Contact">
              <div className="space-y-1.5 text-[14px] text-[#3d4a5c]">
                {contactEmail && (
                  <p>
                    <a
                      href={`mailto:${contactEmail}`}
                      className="text-[#0a1628] hover:underline"
                    >
                      {contactEmail}
                    </a>
                  </p>
                )}
                {contactPhone && (
                  <p>
                    <a
                      href={`tel:${contactPhone}`}
                      className="text-[#0a1628] hover:underline"
                    >
                      {contactPhone}
                    </a>
                  </p>
                )}
                {linkedinUrl && (
                  <p>
                    <a
                      href={linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0a1628] hover:underline"
                    >
                      LinkedIn
                    </a>
                  </p>
                )}
              </div>
            </Section>
          )}

          {/* Golf */}
          {hasGolfDetails && (
            <Section title="Golf">
              <div className="space-y-2.5 text-[14px] text-[#3d4a5c]">
                {homeCourse && (
                  <p>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7f70] mr-2">
                      Home Course
                    </span>
                    <span className="text-[#0a1628]">{homeCourse}</span>
                  </p>
                )}
                {favoriteCourses && (
                  <p>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7f70] mr-2">
                      Favorites
                    </span>
                    {favoriteCourses}
                  </p>
                )}
                {favoritePennGolfMemory && (
                  <div className="pt-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7f70] mb-1.5">
                      Penn Golf Memory
                    </p>
                    <p className="leading-relaxed italic">&ldquo;{favoritePennGolfMemory}&rdquo;</p>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Reach out (signed-in non-owner) or Claim Profile */}
          {isOwner ? (
            <div className="px-7 sm:px-10 py-8 bg-[#faf7f2] border-t border-[rgba(180,168,150,0.3)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p
                  className="text-[#0a1628] text-base font-medium"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  This is your card.
                </p>
                <p className="text-[12.5px] text-[#8a7f70] mt-1 max-w-md">
                  Update your hometown, location, and how you can help.
                </p>
              </div>
              <Link
                href={claimHref}
                data-testid="member-detail-claim-cta"
                className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#990000] hover:underline whitespace-nowrap"
              >
                Update Profile &rarr;
              </Link>
            </div>
          ) : storeMatch && session ? (
            <div className="px-7 sm:px-10 py-8 bg-gradient-to-br from-[#0a1628] to-[#112240] border-t border-[#c8a84b]/25 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b] mb-2">
                Ask for help
              </p>
              <p
                className="text-white text-xl sm:text-2xl font-medium leading-snug mb-2"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Send {member.displayName.split(' ')[0]} a request.
              </p>
              <p className="text-[13.5px] text-white/70 mb-5 max-w-lg leading-relaxed">
                Career advice, a warm intro, a coffee chat, a round — a structured
                4-step request that lands in {member.displayName.split(' ')[0]}&rsquo;s
                Clubhouse inbox.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/ask?personId=${storeMatch.personId}`}
                  data-testid="member-detail-reach-out-cta"
                  className="bg-[#c8a84b] hover:bg-[#d4b75a] text-[#0a1628] text-[13px] font-semibold uppercase tracking-[0.14em] px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
                >
                  Send a request &rarr;
                </Link>
                <Link
                  href="/player/requests"
                  className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-white/55 hover:text-white transition-colors"
                >
                  Track your requests &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <div className="px-7 sm:px-10 py-8 bg-[#faf7f2] border-t border-[rgba(180,168,150,0.3)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p
                  className="text-[#0a1628] text-base font-medium"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  Is this you?
                </p>
                <p className="text-[12.5px] text-[#8a7f70] mt-1 max-w-md">
                  Sign in to claim your card or reach out to other members.
                </p>
              </div>
              <Link
                href={claimHref}
                data-testid="member-detail-claim-cta"
                className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#990000] hover:underline whitespace-nowrap"
              >
                {claimLabel} &rarr;
              </Link>
            </div>
          )}
        </div>

        {/* Back link below card */}
        <div className="mt-8 text-center">
          <Link
            href="/member-book"
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7f70] hover:text-[#0a1628] transition-colors"
          >
            &larr; The Member Book
          </Link>
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="px-7 sm:px-10 py-7 border-b border-[rgba(180,168,150,0.3)] last:border-b-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mb-3">
        {title}
      </p>
      {children}
    </section>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-[#faf7f2] border border-[rgba(180,168,150,0.4)] rounded-lg px-4 py-3">
      <p
        className="text-2xl text-[#0a1628] font-medium leading-none"
        style={{ fontFamily: 'var(--font-playfair)' }}
      >
        {value}
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7f70] mt-1.5">
        {label}
      </p>
    </div>
  )
}
