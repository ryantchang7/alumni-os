import Link from 'next/link'
import StatCard from '@/components/StatCard'
import type { Person, TeamMembership, Team } from '@/lib/store/types'
import type { GraphQualityResult } from '@/lib/store/graph-quality'

interface Props {
  searchParams: Promise<{ teamSlug?: string }>
}

export default async function BuilderGraphPage({ searchParams }: Props) {
  const { teamSlug } = await searchParams

  let realPeople: Person[] = []
  let realMemberships: TeamMembership[] = []
  let team: Team | undefined
  let qualityResult: GraphQualityResult | undefined

  if (teamSlug) {
    const { getTeamBySlug, getPeopleForTeam, getTeamMembershipsForTeam } = await import(
      '@/lib/store/local-store'
    )
    const { calculateGraphQuality } = await import('@/lib/store/graph-quality')
    team = await getTeamBySlug(teamSlug)
    if (team) {
      ;[realPeople, realMemberships, qualityResult] = await Promise.all([
        getPeopleForTeam(team.id),
        getTeamMembershipsForTeam(team.id),
        calculateGraphQuality(team.id),
      ])
    }
  }

  const hasRealData = realPeople.length > 0

  const avgConfidence =
    realMemberships.length > 0
      ? Math.round(
          (realMemberships.reduce((s, m) => s + m.confidence, 0) / realMemberships.length) * 100,
        )
      : 0

  function getMembership(personId: string): TeamMembership | undefined {
    return realMemberships.find(m => m.personId === personId)
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Navy header band */}
      <div className="bg-[#0a1628] px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <Link
            href="/builder"
            className="text-xs text-gray-400 hover:text-white transition-colors mb-3 block"
          >
            ← Builder
          </Link>
          {teamSlug && (
            <Link
              href={`/builder/workspace?teamSlug=${teamSlug}`}
              className="text-xs text-gray-400 hover:text-white transition-colors mb-2 block"
            >
              ← Team Workspace
            </Link>
          )}
          <h1 className="text-white text-3xl font-semibold tracking-tight">Alumni Graph Output</h1>
          <p className="text-gray-400 text-sm mt-1">
            {hasRealData
              ? `${realPeople.length} people promoted from ${teamSlug} roster data.`
              : teamSlug
                ? `No promoted people yet for ${teamSlug}.`
                : 'Choose a team to view the alumni graph.'}
          </p>
        </div>
      </div>

      {hasRealData ? (
        <>
          {/* Real data stats */}
          <div className="max-w-[1320px] mx-auto px-8 -mt-5 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="People Promoted" value={realPeople.length} sublabel="from roster" accentColor="green" />
              <StatCard label="Memberships" value={realMemberships.length} sublabel="team records" accentColor="navy" />
              <StatCard label="Avg Confidence" value={avgConfidence} sublabel="extraction quality %" accentColor="navy" />
              <StatCard label="Open Warnings" value={qualityResult?.warnings.length ?? 0} sublabel="need human review" accentColor="amber" />
            </div>
          </div>

          {/* Real people table */}
          <div className="max-w-[1320px] mx-auto px-8 pt-10 pb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#0a1628] tracking-tight">Promoted People</h2>
              <Link
                href={`/builder/people?teamSlug=${teamSlug}`}
                className="text-xs font-medium text-[#990000] hover:underline"
              >
                Full view →
              </Link>
            </div>

            <div
              className="bg-[#fffdf9] border border-[rgba(180,168,150,0.35)] rounded-lg overflow-hidden mb-8"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f0ece5]">
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8a7f70]">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8a7f70]">Class</th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8a7f70]">Hometown</th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8a7f70]">High School</th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8a7f70]">Conf.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(180,168,150,0.2)]">
                  {realPeople.map(person => {
                    const m = getMembership(person.id)
                    return (
                      <tr key={person.id} className="hover:bg-[#f5f2ed] transition-colors">
                        <td className="px-4 py-3 font-medium text-[#0d1f3c]">{person.canonicalName}</td>
                        <td className="px-4 py-3 text-[#8a7f70]">{m?.classLabel ?? <span className="text-[#c4bbb0]">—</span>}</td>
                        <td className="px-4 py-3 text-[#8a7f70]">{m?.hometown ?? <span className="text-[#c4bbb0]">—</span>}</td>
                        <td className="px-4 py-3 text-[#8a7f70]">{m?.highSchool ?? <span className="text-[#c4bbb0]">—</span>}</td>
                        <td className="px-4 py-3">
                          {m ? (
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                m.confidence >= 0.8
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {Math.round(m.confidence * 100)}%
                            </span>
                          ) : (
                            <span className="text-[#c4bbb0]">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Graph quality readiness strip */}
            {qualityResult && (
              <div className="mb-6 flex items-center justify-between bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-5 py-4"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Graph Quality</p>
                    <p className={`text-2xl font-bold ${qualityResult.score >= 80 ? 'text-emerald-600' : qualityResult.score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                      {qualityResult.score}<span className="text-sm font-normal text-gray-400">/100</span>
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${qualityResult.label === 'graph-ready' ? 'bg-emerald-100 text-emerald-700' : qualityResult.label === 'needs-review' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    {qualityResult.label === 'graph-ready' ? 'Graph Ready' : qualityResult.label === 'needs-review' ? 'Needs Review' : 'Incomplete'}
                  </span>
                </div>
                <Link
                  href={`/builder/quality?teamSlug=${teamSlug}`}
                  className="text-sm font-medium text-[#990000] hover:underline"
                >
                  View Quality Report →
                </Link>
              </div>
            )}

            <div className="border-t border-[rgba(180,168,150,0.35)] pt-8 flex flex-wrap gap-3">
              <Link
                href={`/builder/promote?teamSlug=${teamSlug}`}
                className="text-sm font-semibold text-white bg-[#990000] hover:bg-[#b30000] px-5 py-2.5 rounded-md transition-colors"
              >
                Promote More Entries →
              </Link>
              <Link
                href={`/builder/people?teamSlug=${teamSlug}`}
                className="text-sm font-medium text-[#0a1628] border border-[#0a1628] hover:bg-[#0a1628] hover:text-white px-4 py-2.5 rounded-md transition-colors"
              >
                View All People →
              </Link>
              <Link
                href={`/builder/quality?teamSlug=${teamSlug}`}
                className="text-sm font-medium text-[#0a1628] border border-[#0a1628] hover:bg-[#0a1628] hover:text-white px-4 py-2.5 rounded-md transition-colors"
              >
                Graph Quality →
              </Link>
            </div>
          </div>
        </>
      ) : (
        <div className="max-w-[1320px] mx-auto px-8 pt-14 pb-16">
          {!teamSlug ? (
            <div className="text-center py-16">
              <p className="text-base font-semibold text-[#0a1628] mb-2">Choose a team to view the alumni graph.</p>
              <Link
                href="/builder/workspace?teamSlug=penn-mens-golf"
                className="text-sm font-medium text-[#990000] hover:underline"
              >
                Open Penn Men&apos;s Golf Workspace →
              </Link>
            </div>
          ) : (
            <div className="py-8">
              <p className="text-base font-semibold text-[#0a1628] mb-1">
                No promoted people yet for <span className="font-mono text-sm">{teamSlug}</span>.
              </p>
              <p className="text-sm text-[#8a7f70] mb-6">
                Extract the roster and promote entries before the graph can be built.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/builder/debug-roster?teamSlug=${teamSlug}`}
                  className="text-sm font-semibold text-white bg-[#990000] hover:bg-[#b30000] px-5 py-2.5 rounded-md transition-colors"
                >
                  Extract Roster →
                </Link>
                <Link
                  href={`/builder/promote?teamSlug=${teamSlug}`}
                  className="text-sm font-medium text-[#0a1628] border border-[#0a1628] hover:bg-[#0a1628] hover:text-white px-4 py-2.5 rounded-md transition-colors"
                >
                  Promote Entries →
                </Link>
                <Link
                  href={`/builder/workspace?teamSlug=${teamSlug}`}
                  className="text-sm font-medium text-[#0a1628] border border-[#0a1628] hover:bg-[#0a1628] hover:text-white px-4 py-2.5 rounded-md transition-colors"
                >
                  Team Workspace →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
