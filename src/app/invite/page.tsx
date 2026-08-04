import InviteTeammates from '@/components/InviteTeammates'
import type { TeammateEntry } from '@/components/InviteTeammates'
import Link from 'next/link'
import { getApprovalState } from '@/lib/access/approval'
import GatedPreview from '@/components/GatedPreview'

export const metadata = {
  title: 'Invite Teammates',
  description: 'Pull the rest of the Penn Golf family onto the Clubhouse.',
}

export default async function InvitePage() {
  // The invite list names every member and shows who hasn't joined yet —
  // that's member information, not a public directory.
  const approval = await getApprovalState()
  if (!approval.approved) {
    return (
      <GatedPreview
        signedIn={approval.signedIn}
        eyebrow="Members only · Invite"
        headline="Invites are for members."
        blurb="Claim your card first — then you can pull the rest of the family in."
      />
    )
  }
  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug('penn-mens-golf')

  const teammates: TeammateEntry[] = []

  if (team) {
    const memberships = store.teamMemberships.filter(
      m =>
        m.teamId === team.id &&
        (m.memberRole === 'current_player' ||
          m.memberRole === 'alumni' ||
          m.memberRole === 'coach'),
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
            Invite the people who should be here
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-xl leading-relaxed mt-5">
            The Clubhouse is better the more of us are on it. Pull in the people
            who aren&rsquo;t here yet &mdash; it takes them 30 seconds.
          </p>
          {notJoinedCount > 0 && (
            <p className="text-white/30 text-xs mt-3 font-medium tracking-wide">
              {notJoinedCount} {notJoinedCount === 1 ? 'person' : 'people'} not on yet
            </p>
          )}
        </div>
      </div>

      {/* Gold accent line */}
      <div className="h-[3px] bg-gradient-to-r from-[#c8a84b] via-[#d4b75a] to-[#c8a84b]" />

      {/* Roster + share — cream background */}
      <div className="max-w-[860px] mx-auto px-6 sm:px-8 py-10">
        <InviteTeammates teammates={teammates} />

        {/* Family and affiliates aren't in the player registry, so the list
            above can never contain them — give that invite its own path. */}
        <div className="mt-8 bg-white border border-[rgba(180,168,150,0.4)] rounded-xl px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[#0a1628] font-medium text-[15px] font-heading">
              Inviting family or an affiliate?
            </p>
            <p className="text-[12.5px] text-ink-muted mt-0.5 leading-relaxed">
              Parents, spouses, and longtime friends of the program join through
              their own door &mdash; send them this link.
            </p>
          </div>
          <Link
            href="/parent-signup"
            className="inline-flex items-center justify-center border border-[#990000]/30 hover:border-[#990000] text-[#990000] text-[12px] font-semibold uppercase tracking-[0.14em] px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
          >
            Family sign-up &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
