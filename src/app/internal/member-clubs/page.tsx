import Link from 'next/link'
import { requireFounderOr404 } from '@/lib/auth/founder-page-gate'
import MemberClubsEditor, { type MemberRow } from './MemberClubsEditor'

const TEAM_SLUG = 'penn-mens-golf'

export default async function MemberClubsPage() {
  await requireFounderOr404()

  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug(TEAM_SLUG)

  if (!team) {
    return (
      <div className="min-h-screen bg-[#fbf9f6] p-8">
        <p className="text-sm text-red-600">Team not found: {TEAM_SLUG}</p>
      </div>
    )
  }

  const memberships = store.teamMemberships.filter(m => m.teamId === team.id)
  const enrichments = store.personEnrichments.filter(e => e.teamId === team.id)
  const enrichMap = new Map(enrichments.map(e => [e.personId, e]))
  const peopleMap = new Map(store.people.map(p => [p.id, p]))

  const seen = new Set<string>()
  const rows: MemberRow[] = []

  for (const m of memberships) {
    if (seen.has(m.personId)) continue
    seen.add(m.personId)
    const person = peopleMap.get(m.personId)
    if (!person) continue
    const enrichment = enrichMap.get(m.personId)

    const years =
      m.rosterStartYear && m.rosterEndYear
        ? `${m.rosterStartYear}–${String(m.rosterEndYear).slice(-2)}`
        : m.rosterStartYear
          ? `${m.rosterStartYear}`
          : ''

    rows.push({
      personId: person.id,
      name: person.canonicalName,
      role: m.memberRole ?? 'alumni',
      classLabel: m.classLabel ?? '',
      years,
      homeCourse: enrichment?.homeCourse ?? '',
      noHomeCourse: enrichment?.noHomeCourse === true,
    })
  }

  rows.sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="min-h-screen bg-[#fbf9f6]">
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <div className="flex items-center gap-2 mb-4 text-xs">
            <Link href="/internal" className="text-gray-400 hover:text-gray-200 transition-colors">
              &larr; Internal
            </Link>
          </div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Founder tools</p>
          <h1
            className="text-white text-2xl sm:text-3xl font-semibold tracking-tight font-heading"
          >
            Member Home Clubs
          </h1>
          <p className="text-gray-400 text-sm mt-2 max-w-2xl">
            Set any member&rsquo;s home club here, current players and alumni alike. Add
            several clubs comma-separated; they all combine on The Course.
          </p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-8">
        {rows.length === 0 ? (
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-8 text-center"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
          >
            <p className="text-sm text-ink-muted">No members found for {TEAM_SLUG}.</p>
          </div>
        ) : (
          <MemberClubsEditor rows={rows} />
        )}
      </div>
    </div>
  )
}
