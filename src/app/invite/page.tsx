import InviteTeammates from '@/components/InviteTeammates'
import type { TeammateEntry } from '@/components/InviteTeammates'

export const metadata = {
  title: 'Invite Teammates | Penn Golf Clubhouse',
  description: 'Pull your teammates onto the Penn Golf Clubhouse.',
}

export default async function InvitePage() {
  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug('penn-mens-golf')

  const teammates: TeammateEntry[] = []

  if (team) {
    const memberships = store.teamMemberships.filter(
      m =>
        m.teamId === team.id &&
        (m.memberRole === 'current_player' || m.memberRole === 'alumni'),
    )

    // Build a set of personIds that have an account (claimed)
    const claimedPersonIds = new Set(
      store.accounts
        .map(a => a.linkedPersonId)
        .filter((id): id is string => !!id),
    )

    // De-dupe by canonicalName (case-insensitive)
    const seen = new Map<string, TeammateEntry>()
    for (const m of memberships) {
      const person = store.people.find(p => p.id === m.personId)
      if (!person) continue
      const key = person.canonicalName.toLowerCase().trim()
      if (seen.has(key)) continue
      seen.set(key, {
        name: person.canonicalName,
        joined: claimedPersonIds.has(person.id),
      })
    }

    // Sort: not-joined first, then alphabetical within each group
    const all = Array.from(seen.values())
    all.sort((a, b) => {
      if (a.joined !== b.joined) return a.joined ? 1 : -1
      return a.name.localeCompare(b.name)
    })

    teammates.push(...all)
  }

  const notJoinedCount = teammates.filter(t => !t.joined).length

  return (
    <div className="min-h-screen bg-[#fbf9f6]">
      {/* Hero */}
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-12 pb-14">
        <div className="max-w-[860px] mx-auto">
          <p className="eyebrow text-gold mb-4">
            Penn Men&rsquo;s Golf
          </p>
          <h1
            className="text-white text-4xl sm:text-5xl font-medium tracking-tight font-heading"
          >
            Invite the guys
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-xl leading-relaxed mt-5">
            The Clubhouse is better the more of us are on it. Pull in the teammates who
            aren&rsquo;t here yet &mdash; it takes them 30 seconds.
          </p>
          {notJoinedCount > 0 && (
            <p className="text-white/30 text-xs mt-3 font-medium tracking-wide">
              {notJoinedCount} teammate{notJoinedCount === 1 ? '' : 's'} not on yet
            </p>
          )}
        </div>
      </div>

      {/* Gold accent line */}
      <div className="h-[3px] bg-gradient-to-r from-[#c8a84b] via-[#d4b75a] to-[#c8a84b]" />

      {/* Roster + share — cream background */}
      <div className="max-w-[860px] mx-auto px-6 sm:px-8 py-10">
        <InviteTeammates teammates={teammates} />
      </div>
    </div>
  )
}
