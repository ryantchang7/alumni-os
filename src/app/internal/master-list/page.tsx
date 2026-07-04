import Link from 'next/link'
import { requireFounderOr404 } from '@/lib/auth/founder-page-gate'
import type { TeamMembership } from '@/lib/store/types'
import { memberBookEntries } from '@/lib/member-book/data'
import {
  isPublicMember,
  isActiveMember,
  getMemberStartYear,
  getMemberEndYear,
} from '@/lib/member-book/helpers'

const TEAM_SLUG = 'penn-mens-golf'

interface Row {
  key: string
  source: 'store' | 'book'
  name: string
  role: TeamMembership['memberRole'] | 'book'
  years: string
  classLabel: string
  hometown: string
  published: boolean
  visible: boolean
  hasEnrichment: boolean
  profileHref: string | null
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-4 text-center"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
    >
      <p className="text-2xl font-bold text-[#0a1628]">{value}</p>
      <p className="text-xs text-ink-muted mt-0.5 leading-tight">{label}</p>
    </div>
  )
}

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export default async function MasterListPage() {
  await requireFounderOr404()

  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return <div className="p-8 text-sm text-red-600">Team not found</div>

  // ── Team-store members (anyone added via the roster / add-member flow) ──
  const memberships = store.teamMemberships.filter(m => m.teamId === team.id)
  const enrichments = store.personEnrichments.filter(e => e.teamId === team.id)
  const enrichMap = new Map(enrichments.map(e => [e.personId, e]))
  const pidToName = new Map(store.people.map(p => [p.id, p.canonicalName]))

  const seenNames = new Set<string>()

  const storeRows: Row[] = memberships.map(m => {
    const name = pidToName.get(m.personId) ?? m.personId
    seenNames.add(normalize(name))
    const enrichment = enrichMap.get(m.personId)
    const years =
      m.rosterStartYear && m.rosterEndYear
        ? `${m.rosterStartYear}–${String(m.rosterEndYear).slice(-2)}`
        : m.rosterStartYear
          ? `${m.rosterStartYear}`
          : '—'
    return {
      key: `store:${m.personId}`,
      source: 'store',
      name,
      role: m.memberRole,
      years,
      classLabel: m.classLabel ?? '—',
      hometown: m.hometown ?? '—',
      published: m.publishedToNetwork ?? false,
      visible: enrichment?.visibleToPlayers !== false,
      hasEnrichment: !!enrichment,
      profileHref: m.publishedToNetwork ? `/player/alumni/${m.personId}` : null,
    }
  })

  // ── Member Book entries (historical roster from the JSON) ──
  // Include every entry not already on the team store, so the master
  // list truly reflects every Penn Golf member we know about.
  const bookRows: Row[] = []
  for (const entry of memberBookEntries) {
    const norm = normalize(entry.displayName)
    if (seenNames.has(norm)) continue
    seenNames.add(norm)
    const start = getMemberStartYear(entry)
    const end = getMemberEndYear(entry)
    const years =
      start && end
        ? `${start}–${String(end).slice(-2)}`
        : start
          ? `${start}`
          : '—'
    bookRows.push({
      key: `book:${entry.id}`,
      source: 'book',
      name: entry.displayName,
      role: isActiveMember(entry) ? 'current_player' : 'book',
      years,
      classLabel: entry.profile.classYearEstimate ?? '—',
      hometown: entry.profile.hometown ?? '—',
      published: isPublicMember(entry),
      visible: isPublicMember(entry),
      hasEnrichment: false,
      profileHref: isPublicMember(entry) ? `/member-book/${encodeURIComponent(entry.id)}` : null,
    })
  }

  // Sort: current players first, coaches, alumni, parents, member-book historicals last; alpha within each.
  const rolePriority: Record<string, number> = {
    current_player: 0,
    coach: 1,
    alumni: 2,
    parent: 3,
    book: 4,
  }
  const rows = [...storeRows, ...bookRows].sort((a, b) => {
    const pa = rolePriority[a.role ?? 'book'] ?? 3
    const pb = rolePriority[b.role ?? 'book'] ?? 3
    if (pa !== pb) return pa - pb
    return a.name.localeCompare(b.name)
  })

  // ── Stats ──
  const currentPlayerCount = rows.filter(r => r.role === 'current_player').length
  const storeAlumniCount = rows.filter(r => r.role === 'alumni').length
  const bookCount = rows.filter(r => r.source === 'book').length
  const publishedCount = rows.filter(r => r.published).length
  const hiddenCount = rows.filter(r => !r.published).length
  const enrichedCount = rows.filter(r => r.hasEnrichment).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#0a1628] px-8 pt-10 pb-12">
        <div className="max-w-[1320px] mx-auto">
          <div className="flex items-center gap-2 mb-4 text-xs">
            <Link href="/internal" className="text-gray-400 hover:text-gray-200 transition-colors">
              &larr; Internal tools
            </Link>
          </div>
          <h1 className="text-white text-2xl font-semibold tracking-tight">Master Member Manager</h1>
          <p className="text-gray-400 text-sm mt-2">
            Every Penn Men&apos;s Golf member — team store + historical Member Book, unified.
          </p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-8 pb-16">
        <div className="-mt-5 relative z-10 space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatBox label="Total Members" value={rows.length} />
            <StatBox label="Current Players" value={currentPlayerCount} />
            <StatBox label="Active Alumni" value={storeAlumniCount} />
            <StatBox label="Member Book" value={bookCount} />
            <StatBox label="Published" value={publishedCount} />
            <StatBox label="Enriched" value={enrichedCount} />
          </div>

          <p className="text-xs text-ink-muted">
            {hiddenCount} hidden from the public network.
            {' '}<Link href="/internal/add-member" className="text-[#990000] hover:underline font-semibold">+ Add a member</Link>
          </p>

          {/* Member table */}
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <div className="px-6 py-4 border-b border-[rgba(180,168,150,0.25)]">
              <h2 className="text-sm font-semibold text-[#0a1628]">
                All Members ({rows.length})
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Current players first, then alumni in the team store, then the historical Member Book.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(180,168,150,0.25)] bg-[#faf8f5]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider whitespace-nowrap">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider whitespace-nowrap">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider whitespace-nowrap">Years</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider whitespace-nowrap">Class</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider whitespace-nowrap">Hometown</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider whitespace-nowrap">Published</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider whitespace-nowrap">Visible</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider whitespace-nowrap">Enrichment</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider whitespace-nowrap">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(180,168,150,0.15)]">
                  {rows.map(row => (
                    <tr key={row.key} className="hover:bg-[#faf8f5] transition-colors">
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
                        ) : row.role === 'coach' ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#0a1628] text-white">
                            Coach
                          </span>
                        ) : row.role === 'alumni' ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            Alumni
                          </span>
                        ) : row.role === 'parent' ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#990000]/10 text-[#990000] border border-[#990000]/30">
                            Family &amp; Affiliate
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            Historical
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#4a5568] whitespace-nowrap">{row.years}</td>
                      <td className="px-4 py-3 text-[#4a5568] whitespace-nowrap">{row.classLabel}</td>
                      <td className="px-4 py-3 text-[#4a5568] whitespace-nowrap max-w-[160px] truncate">{row.hometown}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs font-medium ${row.published ? 'text-emerald-700' : 'text-ink-muted'}`}>
                          {row.published ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs font-medium ${row.visible ? 'text-emerald-700' : 'text-[#990000]'}`}>
                          {row.visible ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs font-medium ${row.hasEnrichment ? 'text-[#0a1628]' : 'text-ink-muted'}`}>
                          {row.hasEnrichment ? 'Has info' : 'None'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[10px] uppercase tracking-wider text-ink-muted">
                          {row.source === 'store' ? 'Team store' : 'Member book'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
