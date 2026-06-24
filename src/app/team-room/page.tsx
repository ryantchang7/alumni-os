import Link from 'next/link'
import type { Person, TeamMembership, TeamNewsItem, SeasonUpdate } from '@/lib/store/types'
import TeamNewsStrip from '@/components/TeamNewsStrip'
import FoundersWall from '@/components/FoundersWall'
import CaptainsLineup from '@/components/CaptainsLineup'
import MemberAvatar from '@/components/MemberAvatar'
import MemberBadges from '@/components/MemberBadges'
import { badgesForPerson } from '@/lib/badges'
import { getSiteContentOrDefault } from '@/lib/site-content/read'
import HeroCrest from '@/components/HeroCrest'
import LinkPreviewImage from '@/components/LinkPreviewImage'
import {
  computeFoundersForTeam,
  computeFamilySupportersForTeam,
} from '@/lib/founders'
import type { FounderEntry, FamilySupporterEntry } from '@/lib/founders'

interface PlayerEntry {
  person: Person
  membership: TeamMembership
}

const CLASS_ORDER: Record<string, number> = { 'Sr.': 0, 'Jr.': 1, 'So.': 2, 'Fr.': 3 }

const SEASON_KIND_LABELS: Record<SeasonUpdate['kind'], string> = {
  tournament: 'Tournament',
  qualifying: 'Qualifying',
  stat: 'Stat',
  note: 'Note',
}

/** Bare domain for a link's "source" label, e.g. "golfstat.com". */
function seasonLinkDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'Link'
  }
}

const SUPPORT_CARDS = [
  {
    title: 'Show up',
    description:
      'Rounds, dinners, watch parties — the gatherings where Penn Golf still feels like Penn Golf.',
    cta: 'Browse the 19th Hole',
    href: '/19th-hole',
  },
  {
    title: 'Help a player',
    description:
      'Post an ask or an offer in the Career Room — recruiting advice, warm intros, a seat at dinner.',
    cta: 'Open the Career Room',
    href: '/career-room',
  },
  {
    title: 'Contribute',
    description:
      'Become a Supporting Member ($10/mo) or a Founding Member ($20/mo). 70% goes to Penn Men’s Golf.',
    cta: 'Support the program',
    href: '/support',
  },
]

export default async function TeamRoomPage() {
  const y = new Date().getFullYear()
  const rosterLabel = `${y}–${String(y + 1).slice(2)} Roster`
  const { readStore, getTeamBySlug, getRecentTeamNewsItems, getSeasonUpdatesForTeam } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug('penn-mens-golf')

  let currentPlayers: PlayerEntry[] = []
  let coaches: PlayerEntry[] = []
  let recentAlumni: PlayerEntry[] = []
  let newsItems: TeamNewsItem[] = []
  let seasonUpdates: SeasonUpdate[] = []
  let founders: FounderEntry[] = []
  let familySupporters: FamilySupporterEntry[] = []
  const captainNote = await getSiteContentOrDefault('team-room.captain-note')
  const crestImage = await getSiteContentOrDefault('team-room.crest-image')

  if (team) {
    founders = computeFoundersForTeam(store, team.id)
    familySupporters = computeFamilySupportersForTeam(store, team.id)
    coaches = store.teamMemberships
      .filter(m => m.teamId === team.id && m.memberRole === 'coach' && m.publishedToNetwork === true)
      .map(m => {
        const person = store.people.find(p => p.id === m.personId)
        return person ? { membership: m, person } : null
      })
      .filter((x): x is PlayerEntry => x !== null)
      .sort((a, b) => a.person.canonicalName.localeCompare(b.person.canonicalName))
    newsItems = await getRecentTeamNewsItems(team.id, 4)
    seasonUpdates = await getSeasonUpdatesForTeam(team.id)
    currentPlayers = store.teamMemberships
      .filter(m => m.teamId === team.id && m.memberRole === 'current_player')
      .map(m => {
        const person = store.people.find(p => p.id === m.personId)
        return person ? { membership: m, person } : null
      })
      .filter((x): x is PlayerEntry => x !== null)
      .sort((a, b) => {
        const aOrder = CLASS_ORDER[a.membership.classLabel ?? ''] ?? 99
        const bOrder = CLASS_ORDER[b.membership.classLabel ?? ''] ?? 99
        if (aOrder !== bOrder) return aOrder - bOrder
        return a.person.canonicalName.localeCompare(b.person.canonicalName)
      })

    recentAlumni = store.teamMemberships
      .filter(m => m.teamId === team.id && m.memberRole === 'alumni' && m.publishedToNetwork === true)
      .map(m => {
        const person = store.people.find(p => p.id === m.personId)
        return person ? { membership: m, person } : null
      })
      .filter((x): x is PlayerEntry => x !== null)
      .sort((a, b) => (b.membership.rosterEndYear ?? 0) - (a.membership.rosterEndYear ?? 0))
      .slice(0, 6)
  }

  // Resolve a member's photo the same way /the-course does: enrichment photo
  // first, then their account image. Returns null for the initials fallback.
  const photoFor = (personId: string): string | null => {
    if (!team) return null
    return (
      store.personEnrichments.find(e => e.personId === personId && e.teamId === team.id)
        ?.photoUrl ??
      store.accounts.find(a => a.linkedPersonId === personId)?.image ??
      null
    )
  }

  // Everyone rendered in the roster / alumni / staff sections — by personId
  // AND by normalized name — so a captain who already appears in one of those
  // sections is skipped in CaptainsLineup (each person shows exactly once).
  const renderedPersonIds: string[] = []
  const renderedNames: string[] = []
  for (const { person } of [...currentPlayers, ...recentAlumni, ...coaches]) {
    renderedPersonIds.push(person.id)
    renderedNames.push(person.canonicalName.toLowerCase().trim())
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-12 pb-14 overflow-hidden">
        <div className="max-w-[1320px] mx-auto flex items-center gap-5 sm:gap-7">
          <HeroCrest src={crestImage} alt="Team Room crest" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35 mb-4">
              Penn Men&rsquo;s Golf
            </p>
            <h1
              className="text-white text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Team Room
            </h1>
            <p className="text-white/55 text-sm sm:text-base max-w-xl leading-relaxed mt-5">
              The current roster, the season as it unfolds, and the people behind the program.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-10 space-y-14">

        {/* Latest from Penn Athletics — sits at the top of the Team Room
            since it's the most "current team" thing here */}
        {newsItems.length > 0 && <TeamNewsStrip items={newsItems} />}

        {/* Current season roster */}
        <section>
          <h2 className="text-base font-semibold text-[#0a1628] mb-1">{rosterLabel}</h2>
          <p className="text-sm text-[#8a7f70] mb-6">Current players on the Penn Men&apos;s Golf team.</p>
          {currentPlayers.length === 0 ? (
            <p className="text-sm text-[#8a7f70]">Roster will appear here once players are added to the Clubhouse.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentPlayers.map(({ person, membership }) => {
                const classShort = membership.classYearEstimate?.split(' / ')[0]
                const badges = badgesForPerson(person.id, store.accounts)
                return (
                  <Link
                    key={person.id}
                    href={`/player/alumni/${person.id}`}
                    className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-4 hover:border-[#0a1628]/30 transition-colors block"
                    style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <MemberAvatar photoUrl={photoFor(person.id)} name={person.canonicalName} size={40} tone="navy" />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0a1628] text-sm">{person.canonicalName}</p>
                          {badges.length > 0 && (
                            <div className="mt-1">
                              <MemberBadges badges={badges} size="sm" />
                            </div>
                          )}
                        </div>
                      </div>
                      {classShort && (
                        <span className="text-[10px] font-medium text-[#2d6a4f] bg-[#2d6a4f]/10 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                          {classShort}
                        </span>
                      )}
                    </div>
                    {membership.hometown && (
                      <p className="text-xs text-[#8a7f70] mt-2">{membership.hometown}</p>
                    )}
                    {membership.highSchool && (
                      <p className="text-xs text-[#8a7f70]">{membership.highSchool}</p>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Season Tracker — founder-authored qualifying/tournament/stat
            updates from /internal/season. Falls back to a "work in progress"
            card until the first update is posted. */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#990000] mb-1.5">
            Live from the Course
          </p>
          <h2 className="text-base font-semibold text-[#0a1628] mb-1">Season Tracker</h2>
          <p className="text-sm text-[#8a7f70] mb-6">
            Qualifying, tournament results, and stats as the season unfolds.
          </p>
          {seasonUpdates.length > 0 ? (
            <ol className="relative border-l border-[rgba(180,168,150,0.45)] pl-6 space-y-5">
              {seasonUpdates.map(u => (
                <li key={u.id} className="relative">
                  <span className="absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#990000] ring-4 ring-[#f8f5f0]" />
                  <div
                    className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5"
                    style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
                  >
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#0a1628] bg-[#0a1628]/8 px-2 py-0.5 rounded-full">
                        {SEASON_KIND_LABELS[u.kind]}
                      </span>
                      <span className="text-[11px] text-[#8a7f70]">{u.dateText}</span>
                    </div>
                    <p className="text-sm font-semibold text-[#0a1628]">{u.title}</p>
                    {u.body && (
                      <p className="text-sm text-[#8a7f70] mt-1.5 leading-relaxed whitespace-pre-line">{u.body}</p>
                    )}
                    {u.linkUrl && (
                      u.previewImageUrl ? (
                        <a
                          href={u.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block mt-3 rounded-lg overflow-hidden border border-[rgba(180,168,150,0.4)] hover:border-[#0a1628]/30 transition-colors group/link"
                        >
                          <LinkPreviewImage
                            src={u.previewImageUrl}
                            className="w-full h-40 object-cover bg-[#faf7f2]"
                          />
                          <div className="px-3.5 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a7f70]">
                              {seasonLinkDomain(u.linkUrl)}
                            </p>
                            {(u.previewTitle || u.linkLabel) && (
                              <p className="text-[13px] font-semibold text-[#0a1628] mt-1 leading-snug line-clamp-2">
                                {u.previewTitle || u.linkLabel}
                              </p>
                            )}
                            <span className="text-xs text-[#990000] font-medium mt-1.5 inline-block group-hover/link:underline">
                              {u.linkLabel || 'View'} &rarr;
                            </span>
                          </div>
                        </a>
                      ) : (
                        <a
                          href={u.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-[#990000] hover:underline font-medium mt-2.5 border border-[#990000]/25 rounded-full px-3 py-1.5"
                        >
                          {u.linkLabel || seasonLinkDomain(u.linkUrl)} &rarr;
                        </a>
                      )
                    )}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-6 py-12 text-center"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <p className="text-sm font-semibold text-[#0a1628]">
                Live qualifying, tournament results, and stats are coming soon.
              </p>
              <p className="text-xs text-[#8a7f70] mt-2 max-w-md mx-auto">
                Updates will appear here as the season unfolds.
              </p>
            </div>
          )}
        </section>

        {/* Coaching Staff */}
        {coaches.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-[#0a1628] mb-1">Coaching Staff</h2>
            <p className="text-sm text-[#8a7f70] mb-6">The coaches behind the program.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {coaches.map(({ person, membership }) => {
                const badges = badgesForPerson(person.id, store.accounts)
                return (
                  <div
                    key={person.id}
                    className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-4"
                    style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <MemberAvatar photoUrl={photoFor(person.id)} name={person.canonicalName} size={40} tone="navy" />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0a1628] text-sm">{person.canonicalName}</p>
                          {badges.length > 0 && (
                            <div className="mt-1">
                              <MemberBadges badges={badges} size="sm" />
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-white bg-[#0a1628] px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                        Coach
                      </span>
                    </div>
                    {membership.hometown && (
                      <p className="text-xs text-[#8a7f70] mt-2">{membership.hometown}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Captain's Note */}
        <section>
          <h2 className="text-base font-semibold text-[#0a1628] mb-1">Captain&apos;s Note</h2>
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            {captainNote ? (
              <p className="text-sm text-[#3d4a5c] leading-relaxed whitespace-pre-wrap">
                {captainNote}
              </p>
            ) : (
              <p className="text-sm text-[#8a7f70] leading-relaxed italic">
                A note from this year&apos;s captain will appear here each season.
              </p>
            )}
          </div>
        </section>

        {/* Recent Alumni */}
        {recentAlumni.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-[#0a1628] mb-1">Recent Alumni</h2>
            <p className="text-sm text-[#8a7f70] mb-6">Just finished their Penn Golf careers.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentAlumni.map(({ person, membership }) => {
                const badges = badgesForPerson(person.id, store.accounts)
                return (
                  <Link
                    key={person.id}
                    href={`/player/alumni/${person.id}`}
                    className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-4 hover:border-[#0a1628]/30 transition-colors block"
                    style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <MemberAvatar photoUrl={photoFor(person.id)} name={person.canonicalName} size={40} tone="navy" />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0a1628] text-sm">{person.canonicalName}</p>
                          {badges.length > 0 && (
                            <div className="mt-1">
                              <MemberBadges badges={badges} size="sm" />
                            </div>
                          )}
                        </div>
                      </div>
                      {membership.rosterEndYear && (
                        <span className="text-[10px] font-medium text-[#8a7f70] bg-[#f8f5f0] px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 border border-[rgba(180,168,150,0.35)]">
                          &apos;{String(membership.rosterEndYear).slice(2)}
                        </span>
                      )}
                    </div>
                    {membership.hometown && (
                      <p className="text-xs text-[#8a7f70] mt-2">{membership.hometown}</p>
                    )}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Captains Lineup — who runs this Clubhouse. Exclude anyone already
            shown above (roster / alumni / staff) so a captain who's also on
            the roster appears exactly once, on their roster card. */}
        {team && (
          <CaptainsLineup
            store={store}
            teamId={team.id}
            excludePersonIds={renderedPersonIds}
            excludeNames={renderedNames}
          />
        )}

        {/* Support the Program — three ways */}
        <section>
          <h2 className="text-base font-semibold text-[#0a1628] mb-1">Support the Program</h2>
          <p className="text-sm text-[#8a7f70] mb-6">
            Three ways alumni keep Penn Men&rsquo;s Golf moving forward.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {SUPPORT_CARDS.map(card => (
              <div
                key={card.title}
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5 flex flex-col"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
              >
                <p className="font-semibold text-[#0a1628] text-sm mb-1">{card.title}</p>
                <p className="text-xs text-[#4a5568] mb-4 leading-relaxed flex-1">{card.description}</p>
                <Link
                  href={card.href}
                  className="text-xs font-semibold text-[#990000] hover:underline"
                >
                  {card.cta} &rarr;
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Founders Wall preview */}
        {founders.length > 0 && (
          <section>
            <FoundersWall
              founders={founders}
              familySupporters={familySupporters}
              preview
              limit={6}
            />
          </section>
        )}

        {/* Bottom CTA */}
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          <div>
            <p className="font-semibold text-[#0a1628] text-sm">Browse the Member Book</p>
            <p className="text-xs text-[#8a7f70] mt-0.5">Every Penn Men&rsquo;s Golf member, across generations.</p>
          </div>
          <Link
            href="/member-book"
            className="text-sm font-semibold text-[#990000] hover:underline whitespace-nowrap"
          >
            Open the Member Book &rarr;
          </Link>
        </div>

      </div>
    </div>
  )
}
