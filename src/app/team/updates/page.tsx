import Link from 'next/link'
import { auth } from '@/auth'
import type { SeasonUpdate } from '@/lib/store/types'
import LinkPreviewImage from '@/components/LinkPreviewImage'
import FollowTeamButton from '@/components/FollowTeamButton'

const SEASON_KIND_LABELS: Record<SeasonUpdate['kind'], string> = {
  tournament: 'Tournament',
  qualifying: 'Qualifying',
  stat: 'Stat',
  note: 'Note',
}

function seasonLinkDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'Link'
  }
}

export default async function TeamUpdatesPage() {
  const { readStore, getTeamBySlug, getSeasonUpdatesForTeam, getAccountById } = await import(
    '@/lib/store/local-store'
  )

  const team = await getTeamBySlug('penn-mens-golf')
  const updates: SeasonUpdate[] = team
    ? (await getSeasonUpdatesForTeam(team.id)).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    : []

  const session = await auth()
  let signedIn = false
  // undefined followsTeam means "following" per the API contract
  let initialFollowing = true

  if (session?.accountId) {
    signedIn = true
    const account = await getAccountById(session.accountId)
    // followsTeam === false means explicitly unfollowed; undefined/true means following
    initialFollowing = account?.followsTeam !== false
  }

  // suppress unused-import warning in case readStore isn't called
  void readStore

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Hero */}
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-12 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35 mb-4">
            Penn Men&rsquo;s Golf
          </p>
          <h1
            className="text-white text-4xl sm:text-5xl font-medium tracking-tight mb-4"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Team Updates
          </h1>
          <p className="text-white/55 text-sm sm:text-base max-w-xl leading-relaxed mb-8">
            Results, qualifiers, and news from the current team. Follow to get notified.
          </p>
          <FollowTeamButton initialFollowing={initialFollowing} signedIn={signedIn} />
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-10">
        {updates.length > 0 ? (
          <ol className="relative border-l border-[rgba(180,168,150,0.45)] pl-6 space-y-5">
            {updates.map(u => (
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
                    <p className="text-sm text-[#8a7f70] mt-1.5 leading-relaxed whitespace-pre-line">
                      {u.body}
                    </p>
                  )}
                  {u.linkUrl &&
                    (u.previewImageUrl ? (
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
                    ))}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-6 py-12 text-center"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <p className="text-sm font-semibold text-[#0a1628]">No updates yet.</p>
            <p className="text-xs text-[#8a7f70] mt-2 max-w-md mx-auto">
              Qualifying results, tournament recaps, and stats will appear here as the season
              unfolds. Follow the team to be the first to know.
            </p>
          </div>
        )}

        {/* Back link */}
        <div className="mt-10 pt-6 border-t border-[rgba(180,168,150,0.35)]">
          <Link
            href="/team-room"
            className="text-sm text-[#8a7f70] hover:text-[#0a1628] transition-colors"
          >
            &larr; Team Room
          </Link>
        </div>
      </div>
    </div>
  )
}
