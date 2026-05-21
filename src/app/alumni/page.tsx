import Link from 'next/link'
import { notFound } from 'next/navigation'

interface PageProps {
  searchParams: Promise<{ teamSlug?: string }>
}

const TEAM_SLUG = 'penn-mens-golf'

async function getPeopleList(teamSlug: string) {
  const { getTeamBySlug, getPeopleForTeam } = await import('@/lib/store/local-store')
  const team = await getTeamBySlug(teamSlug)
  if (!team) return null
  const people = await getPeopleForTeam(team.id)
  return people.map(p => ({ id: p.id, canonicalName: p.canonicalName }))
}

export default async function AlumniLandingPage({ searchParams }: PageProps) {
  const { teamSlug } = await searchParams
  const slug = teamSlug ?? TEAM_SLUG

  const people = await getPeopleList(slug)
  if (teamSlug && !people) notFound()

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-8 pt-12 pb-14">
        <div className="max-w-[860px] mx-auto">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35 mb-4">
            Penn Men&rsquo;s Golf
          </p>
          <h1
            className="text-white text-3xl sm:text-4xl font-medium tracking-tight"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Your Profile
          </h1>
          <p className="text-white/55 text-sm sm:text-base mt-3 max-w-xl leading-relaxed">
            Update your hometown, where you live now, and how you can help the next generation.
          </p>
        </div>
      </div>

      <div className="max-w-[860px] mx-auto px-8">
        <div className="-mt-5 relative z-10 space-y-4 pb-16">
          {/* Person picker */}
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-3">
              Find your profile
            </p>
            <p className="text-sm text-[#4a5568] mb-4">
              Select your name to view and update your profile. If you don&rsquo;t see yourself,
              open the{' '}
              <Link href="/member-book" className="text-[#990000] hover:underline font-medium">
                Member Book
              </Link>{' '}
              and click &ldquo;Claim &amp; Update&rdquo; on your card.
            </p>
            {!people || people.length === 0 ? (
              <p className="text-sm text-[#8a7f70]">
                No profiles set up yet.{' '}
                <Link href="/member-book" className="text-[#990000] hover:underline font-medium">
                  Browse the Member Book &rarr;
                </Link>
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {people.map(p => (
                  <Link
                    key={p.id}
                    href={`/alumni/profile/${p.id}?teamSlug=${slug}`}
                    className="text-sm font-medium border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-1.5 text-[#0a1628] hover:border-[#0a1628] hover:bg-[#0a1628] hover:text-white transition-colors"
                  >
                    {p.canonicalName}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* What alumni can do */}
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <p className="text-sm font-semibold text-[#0a1628] mb-4">What you can do</p>
            <div className="space-y-3">
              {[
                {
                  title: 'Update your current role',
                  detail: 'Let players know where you are now.',
                },
                {
                  title: 'Choose how to help',
                  detail: 'Set the topics you are open to — recruiting, career advice, networking.',
                },
                {
                  title: 'Control your visibility',
                  detail: 'Opt out at any time and your profile disappears from the player view.',
                },
              ].map(item => (
                <div key={item.title} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#990000] mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[#0a1628]">{item.title}</p>
                    <p className="text-xs text-[#8a7f70] mt-0.5">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Requests link */}
          <Link
            href={`/alumni/requests?teamSlug=${slug}`}
            className="block bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 hover:shadow-md transition-shadow"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <p className="font-semibold text-[#0a1628] mb-1">Player requests</p>
            <p className="text-sm text-[#8a7f70]">
              See when players want to connect or ask for advice.
            </p>
            <span className="text-xs font-medium text-[#990000] mt-3 block">View requests &rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
