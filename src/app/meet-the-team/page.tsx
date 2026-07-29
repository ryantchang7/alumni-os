import type { Person, TeamMembership } from '@/lib/store/types'
import MemberAvatar from '@/components/MemberAvatar'
import MemberBadges from '@/components/MemberBadges'
import { badgesForPerson } from '@/lib/badges'
import AskTheTeam, { type AskTarget } from '@/components/AskTheTeam'
import { findBookEntryForTeamStorePerson } from '@/lib/member-book/bridge'
import Link from 'next/link'

interface PlayerEntry {
  person: Person
  membership: TeamMembership
}

const CLASS_ORDER: Record<string, number> = { 'Sr.': 0, 'Jr.': 1, 'So.': 2, 'Fr.': 3 }

export default async function MeetTheTeamPage() {
  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const { auth } = await import('@/auth')
  const store = await readStore()
  const team = await getTeamBySlug('penn-mens-golf')
  // Member-entered bios are approved-members-only (privacy policy); public
  // visitors see roster facts (hometown, high school) only.
  const session = await auth()
  const isApprovedViewer = !!session?.linkedPersonId

  let currentPlayers: PlayerEntry[] = []

  const photoFor = (personId: string): string | null => {
    if (!team) return null
    return (
      store.personEnrichments.find(e => e.personId === personId && e.teamId === team.id)
        ?.photoUrl ??
      store.accounts.find(a => a.linkedPersonId === personId)?.image ??
      null
    )
  }

  const dedupeByName = (entries: PlayerEntry[]): PlayerEntry[] => {
    const seen = new Map<string, PlayerEntry>()
    for (const entry of entries) {
      const key = entry.person.canonicalName.toLowerCase().trim()
      const existing = seen.get(key)
      if (!existing) {
        seen.set(key, entry)
      } else {
        if (!photoFor(existing.person.id) && photoFor(entry.person.id)) {
          seen.set(key, entry)
        }
      }
    }
    return entries.filter(e => seen.get(e.person.canonicalName.toLowerCase().trim()) === e)
  }

  if (team) {
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

    currentPlayers = dedupeByName(currentPlayers)
  }

  // Build AskTarget array for the picker
  const askTargets: AskTarget[] = currentPlayers.map(({ person, membership }) => ({
    personId: person.id,
    name: person.canonicalName,
    photoUrl: photoFor(person.id),
    classShort: membership.classYearEstimate?.split(' / ')[0],
  }))

  return (
    <div className="min-h-screen bg-[#fbf9f6]">
      {/* Hero */}
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-12 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <p className="eyebrow text-gold mb-4">
            The Team
          </p>
          <h1
            className="text-white text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight font-heading"
          >
            Ask the Team
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-xl leading-relaxed mt-5">
            Meet this year&rsquo;s squad below. Ask the whole team &mdash; or tap
            a guy to ask him directly. You&rsquo;ll get a real answer from one of
            the guys on the team.
          </p>
          <div className="mt-8">
            <AskTheTeam players={askTargets} variant="primary" />
          </div>
        </div>
      </div>

      {/* Gold accent line */}
      <div className="h-[3px] bg-gradient-to-r from-[#c8a84b] via-[#d4b75a] to-[#c8a84b]" />

      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-10">
        {currentPlayers.length === 0 ? (
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-6 py-16 text-center"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <p className="text-sm font-semibold text-[#0a1628]">No current players yet</p>
            <p className="text-xs text-ink-muted mt-2 max-w-sm mx-auto">
              Current roster members will appear here once they&rsquo;re added to the Clubhouse.
            </p>
            <div className="mt-6">
              <Link
                href="/team-room"
                className="text-sm font-semibold text-[#990000] hover:underline"
              >
                Visit the Team Room &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {currentPlayers.map(({ person, membership }) => {
              const classShort = membership.classYearEstimate?.split(' / ')[0]
              const badges = badgesForPerson(person.id, store.accounts)
              const account = store.accounts.find(a => a.linkedPersonId === person.id)
              const enrichment = team
                ? store.personEnrichments.find(e => e.personId === person.id && e.teamId === team.id)
                : null
              const first = person.canonicalName.split(' ')[0]

              return (
                <div
                  key={person.id}
                  className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5 flex flex-col gap-4"
                  style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
                >
                  {/* Top row: avatar + name + class year */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <MemberAvatar
                        photoUrl={photoFor(person.id)}
                        name={person.canonicalName}
                        size={48}
                        tone="navy"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-[#0a1628] text-sm leading-tight">
                          {person.canonicalName}
                        </p>
                        {classShort && (
                          <p className="text-xs text-ink-muted mt-0.5">{classShort}</p>
                        )}
                        {badges.length > 0 && (
                          <div className="mt-1.5">
                            <MemberBadges badges={badges} size="sm" />
                          </div>
                        )}
                      </div>
                    </div>
                    {membership.classLabel && (
                      <span className="text-[10px] font-medium text-[#2d6a4f] bg-[#2d6a4f]/10 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                        {membership.classLabel}
                      </span>
                    )}
                  </div>

                  {/* Bio */}
                  {isApprovedViewer && enrichment?.alumniBio && (
                    <p className="text-xs text-[#3a4657] leading-relaxed line-clamp-3">
                      {enrichment.alumniBio}
                    </p>
                  )}

                  {/* Hometown / high school */}
                  {(membership.hometown || membership.highSchool) && !(isApprovedViewer && enrichment?.alumniBio) && (
                    <div className="space-y-0.5">
                      {membership.hometown && (
                        <p className="text-xs text-ink-muted">{membership.hometown}</p>
                      )}
                      {membership.highSchool && (
                        <p className="text-xs text-ink-muted">{membership.highSchool}</p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 mt-auto pt-1">
                    {(() => {
                      // Claimed players link to their public Member Book card
                      // by BOOK slug (account UUIDs 404 here); fall back to the
                      // network profile when no book entry matches the name.
                      const bookEntry = account
                        ? findBookEntryForTeamStorePerson(person.canonicalName)
                        : null
                      const profileHref = bookEntry
                        ? `/member-book/${encodeURIComponent(bookEntry.id)}`
                        : `/player/alumni/${person.id}`
                      return (
                        <Link
                          href={profileHref}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0a1628] border border-[rgba(180,168,150,0.55)] bg-[#fbf9f6] hover:bg-white hover:border-[#0a1628]/30 px-3 py-2 rounded-lg transition-colors"
                        >
                          View Profile
                        </Link>
                      )
                    })()}
                    <AskTheTeam
                      players={askTargets}
                      variant="card"
                      label={`Ask ${first}`}
                      initialTargetPersonIds={[person.id]}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Bottom nudge to ask */}
        {currentPlayers.length > 0 && (
          <div
            className="mt-12 bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <div>
              <p className="font-semibold text-[#0a1628] text-sm">Have a question for the team?</p>
              <p className="text-xs text-ink-muted mt-0.5">
                Current players answer when they can &mdash; usually within a couple days.
              </p>
            </div>
            <div className="flex-shrink-0">
              <AskTheTeam players={askTargets} variant="primary" />
            </div>
          </div>
        )}

        {/* Link to your questions */}
        <div className="mt-6 text-center">
          <Link
            href="/team/questions"
            className="text-xs text-ink-muted hover:text-[#0a1628] transition-colors"
          >
            See your questions &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
