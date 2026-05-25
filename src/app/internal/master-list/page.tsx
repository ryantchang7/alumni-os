import Link from 'next/link'
import type { PersonEnrichment, ReviewItem, TeamMembership } from '@/lib/store/types'

interface RowData {
  personId: string
  name: string
  role: TeamMembership['memberRole']
  years: string
  classLabel: string
  hometown: string
  published: boolean
  visible: boolean
  hasEnrichment: boolean
  reviewCount: number
  profileHref: string | null
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-4 text-center"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
    >
      <p className="text-2xl font-bold text-[#0a1628]">{value}</p>
      <p className="text-xs text-[#8a7f70] mt-0.5 leading-tight">{label}</p>
    </div>
  )
}

export default async function MasterListPage() {
  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug('penn-mens-golf')
  if (!team) return <div className="p-8 text-sm text-red-600">Team not found</div>

  const memberships = store.teamMemberships.filter(m => m.teamId === team.id)
  const people = store.people
  const enrichments: PersonEnrichment[] = store.personEnrichments.filter(
    e => e.teamId === team.id,
  )
  const reviewItems: ReviewItem[] = store.reviewItems.filter(
    r => r.teamId === team.id && r.status === 'open',
  )

  const enrichMap = new Map(enrichments.map(e => [e.personId, e]))
  const pidToName = new Map(people.map(p => [p.id, p.canonicalName]))

  // Review item counts per person
  const reviewCountMap = new Map<string, number>()
  for (const item of reviewItems) {
    if (item.relatedPersonId) {
      reviewCountMap.set(item.relatedPersonId, (reviewCountMap.get(item.relatedPersonId) ?? 0) + 1)
    }
  }

  const currentPlayers = memberships.filter(m => m.memberRole === 'current_player')
  const alumni = memberships.filter(m => m.memberRole === 'alumni')
  const publishedAlumni = alumni.filter(m => m.publishedToNetwork)
  const hiddenAlumni = alumni.filter(m => !m.publishedToNetwork)
  const noEnrichment = alumni.filter(m => !enrichMap.has(m.personId))
  const visibleFalseCount = alumni.filter(
    m => enrichMap.get(m.personId)?.visibleToPlayers === false,
  ).length
  const verifiedCareer = enrichments.filter(
    e =>
      e.verificationStatus === 'source_backed' || e.verificationStatus === 'manually_verified',
  )

  // Build sorted rows: current_player first, then alumni, both alphabetically
  const rows: RowData[] = memberships
    .slice()
    .sort((a, b) => {
      if (a.memberRole === 'current_player' && b.memberRole !== 'current_player') return -1
      if (a.memberRole !== 'current_player' && b.memberRole === 'current_player') return 1
      const nameA = pidToName.get(a.personId) ?? ''
      const nameB = pidToName.get(b.personId) ?? ''
      return nameA.localeCompare(nameB)
    })
    .map(m => {
      const enrichment = enrichMap.get(m.personId)
      const name = pidToName.get(m.personId) ?? m.personId
      const years =
        m.rosterStartYear && m.rosterEndYear
          ? `${m.rosterStartYear}–${String(m.rosterEndYear).slice(-2)}`
          : m.rosterStartYear
            ? `${m.rosterStartYear}`
            : '—'

      return {
        personId: m.personId,
        name,
        role: m.memberRole,
        years,
        classLabel: m.classLabel ?? '—',
        hometown: m.hometown ?? '—',
        published: m.publishedToNetwork ?? false,
        visible: enrichment?.visibleToPlayers !== false,
        hasEnrichment: !!enrichment,
        reviewCount: reviewCountMap.get(m.personId) ?? 0,
        profileHref: m.publishedToNetwork ? `/player/alumni/${m.personId}` : null,
      }
    })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0a1628] px-8 pt-10 pb-12">
        <div className="max-w-[1320px] mx-auto">
          <div className="flex items-center gap-2 mb-4 text-xs">
            <Link href="/internal" className="text-gray-400 hover:text-gray-200 transition-colors">
              &larr; Internal tools
            </Link>
          </div>
          <h1 className="text-white text-2xl font-semibold tracking-tight">Master Member Manager</h1>
          <p className="text-gray-400 text-sm mt-2">Penn Men&apos;s Golf — full member overview</p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-8 pb-16">
        <div className="-mt-5 relative z-10 space-y-6">

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <StatBox label="Total Members" value={memberships.length} />
            <StatBox label="Current Players" value={currentPlayers.length} />
            <StatBox label="Alumni" value={alumni.length} />
            <StatBox label="Published" value={publishedAlumni.length} />
            <StatBox label="Hidden" value={hiddenAlumni.length} />
            <StatBox label="Needs Review" value={reviewItems.length} />
            <StatBox label="No Enrichment" value={noEnrichment.length} />
            <StatBox label="Verified Career" value={verifiedCareer.length} />
          </div>

          {/* Summary line */}
          <div className="text-xs text-[#8a7f70] flex gap-4 flex-wrap">
            <span>Hidden from players (visibleToPlayers=false): <strong className="text-[#0a1628]">{visibleFalseCount}</strong></span>
            <span>Open review items: <strong className="text-[#0a1628]">{reviewItems.length}</strong></span>
          </div>

          {/* Member table */}
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <div className="px-6 py-4 border-b border-[rgba(180,168,150,0.25)]">
              <h2 className="text-sm font-semibold text-[#0a1628]">
                All Members ({memberships.length})
              </h2>
              <p className="text-xs text-[#8a7f70] mt-0.5">
                Current players first, then alumni — both sorted alphabetically. Filters coming soon.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(180,168,150,0.25)] bg-[#faf8f5]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#8a7f70] uppercase tracking-wider whitespace-nowrap">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#8a7f70] uppercase tracking-wider whitespace-nowrap">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#8a7f70] uppercase tracking-wider whitespace-nowrap">Years</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#8a7f70] uppercase tracking-wider whitespace-nowrap">Class</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#8a7f70] uppercase tracking-wider whitespace-nowrap">Hometown</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#8a7f70] uppercase tracking-wider whitespace-nowrap">Published</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#8a7f70] uppercase tracking-wider whitespace-nowrap">Visible</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#8a7f70] uppercase tracking-wider whitespace-nowrap">Enrichment</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#8a7f70] uppercase tracking-wider whitespace-nowrap">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(180,168,150,0.15)]">
                  {rows.map(row => (
                    <tr key={row.personId} className="hover:bg-[#faf8f5] transition-colors">
                      <td className="px-4 py-3 font-medium text-[#0a1628] whitespace-nowrap">
                        {row.profileHref ? (
                          <Link
                            href={row.profileHref}
                            className="text-[#990000] hover:underline"
                          >
                            {row.name}
                          </Link>
                        ) : (
                          row.name
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {row.role === 'current_player' ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Current player
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            Alumni
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#4a5568] whitespace-nowrap">{row.years}</td>
                      <td className="px-4 py-3 text-[#4a5568] whitespace-nowrap">{row.classLabel}</td>
                      <td className="px-4 py-3 text-[#4a5568] whitespace-nowrap max-w-[160px] truncate">{row.hometown}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs font-medium ${row.published ? 'text-emerald-700' : 'text-[#8a7f70]'}`}>
                          {row.published ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs font-medium ${row.visible ? 'text-emerald-700' : 'text-[#990000]'}`}>
                          {row.visible ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs font-medium ${row.hasEnrichment ? 'text-[#0a1628]' : 'text-[#8a7f70]'}`}>
                          {row.hasEnrichment ? 'Has info' : 'None'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {row.reviewCount > 0 ? (
                          <span className="text-xs font-semibold text-[#990000]">
                            {row.reviewCount} open
                          </span>
                        ) : (
                          <span className="text-xs text-[#8a7f70]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Needs Review section */}
          {reviewItems.length > 0 && (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <div className="px-6 py-4 border-b border-[rgba(180,168,150,0.25)]">
                <h2 className="text-sm font-semibold text-[#0a1628]">
                  Needs Review ({reviewItems.length})
                </h2>
                <p className="text-xs text-[#8a7f70] mt-0.5">Open review items across the team</p>
              </div>
              <div className="divide-y divide-[rgba(180,168,150,0.15)]">
                {reviewItems.map((item: ReviewItem) => {
                  const personName = item.relatedPersonId
                    ? pidToName.get(item.relatedPersonId)
                    : null
                  const priorityColor =
                    item.priority === 'high'
                      ? 'text-[#990000]'
                      : item.priority === 'normal'
                        ? 'text-amber-700'
                        : 'text-[#8a7f70]'

                  return (
                    <div key={item.id} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-[#0a1628]">{item.title}</p>
                          {personName && (
                            <p className="text-xs text-[#8a7f70] mt-0.5">Person: {personName}</p>
                          )}
                          {item.description && (
                            <p className="text-xs text-[#4a5568] mt-1 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className={`text-xs font-semibold uppercase tracking-wide ${priorityColor}`}>
                            {item.priority}
                          </span>
                          <span className="text-xs text-[#8a7f70] bg-[#f5f2ee] px-2 py-0.5 rounded-full border border-[rgba(180,168,150,0.4)]">
                            {item.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {reviewItems.length === 0 && (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 text-center"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <p className="text-sm font-medium text-[#0a1628]">No open review items.</p>
              <p className="text-xs text-[#8a7f70] mt-1">All items are resolved or cleared.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
