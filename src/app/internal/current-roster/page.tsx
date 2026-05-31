import Link from 'next/link'
import { requireFounderOr404 } from '@/lib/auth/founder-page-gate'
import RosterEditorClient from './RosterEditorClient'

const TEAM_SLUG = 'penn-mens-golf'

export default async function CurrentRosterEditorPage() {
  await requireFounderOr404()

  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug(TEAM_SLUG)

  if (!team) {
    return (
      <div className="min-h-screen bg-[#f8f5f0] p-8">
        <p className="text-sm text-red-600">Team not found: {TEAM_SLUG}</p>
      </div>
    )
  }

  const CLASS_ORDER: Record<string, number> = { 'Sr.': 0, 'Jr.': 1, 'So.': 2, 'Fr.': 3 }

  const players = store.teamMemberships
    .filter(m => m.teamId === team.id && m.memberRole === 'current_player')
    .map(membership => {
      const person = store.people.find(p => p.id === membership.personId)
      if (!person) return null
      const enrichment = store.personEnrichments.find(
        e => e.personId === person.id && e.teamId === team.id,
      ) ?? null
      return { person, membership, enrichment }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => {
      const aO = CLASS_ORDER[a.membership.classLabel ?? ''] ?? 99
      const bO = CLASS_ORDER[b.membership.classLabel ?? ''] ?? 99
      if (aO !== bO) return aO - bO
      return a.person.canonicalName.localeCompare(b.person.canonicalName)
    })

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <div className="flex items-center gap-2 mb-4 text-xs">
            <Link href="/internal" className="text-gray-400 hover:text-gray-200 transition-colors">
              &larr; Internal
            </Link>
          </div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Internal · Penn Golf</p>
          <h1 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight">
            Current Roster Editor
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Edit the 2026–27 Penn Golf roster and player profile details.
          </p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <p className="text-sm text-[#8a7f70]">
            <span className="font-semibold text-[#0a1628]">{players.length}</span> current players — save each card individually.
          </p>
          <Link href="/member-book?role=current_player" className="text-xs font-medium text-[#990000] hover:underline">
            View in Member Book &rarr;
          </Link>
        </div>

        {players.length === 0 ? (
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-8 text-center"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
          >
            <p className="text-sm text-[#8a7f70]">No current players found for {TEAM_SLUG}.</p>
          </div>
        ) : (
          <RosterEditorClient players={players} teamSlug={TEAM_SLUG} />
        )}
      </div>
    </div>
  )
}
