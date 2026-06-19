import NineteenthHoleClient from './NineteenthHoleClient'
import NineteenthHoleHero from './NineteenthHoleHero'
import type { GatheringData } from '@/components/gatherings/GatheringCard'
import { getApprovalState } from '@/lib/access/approval'
import GatedPreview from '@/components/GatedPreview'
import OpenRequestStrip from '@/components/OpenRequestStrip'
import { auth } from '@/auth'
import { prioritizeForViewer, resolveViewerLocation } from '@/lib/prioritize'
import type { OpenRequest } from '@/lib/store/types'

export default async function NineteenthHolePage() {
  const approval = await getApprovalState()
  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug('penn-mens-golf')

  type AlumniEntry = {
    personId: string
    canonicalName: string
    memberRole: 'current_player' | 'alumni' | 'coach' | 'parent'
    city?: string
    state?: string
    classLabel?: string
    currentRole?: string
    currentCompany?: string
    parentRelationship?: string
    handicap?: string
    openToCoffee?: boolean
    photoUrl?: string | null
  }

  let openToCoffee: AlumniEntry[] = []
  let cityGroups: { city: string; count: number; coffeeCount: number }[] = []
  let socialGatherings: GatheringData[] = []
  const interestedByGathering = new Map<string, number>()
  // Surfaced to the client so it can show a subtle "You're listed here
  // too — edit your profile to change" chip when the viewer has opted
  // into Open to Coffee themselves.
  let viewerOptedToCoffee = false
  let viewerPersonId: string | undefined
  // Open Requests with social intents (drinks/coffee/dinner) — filtered
  // to exclude the viewer's own posts.
  let openSocialRequests: OpenRequest[] = []

  if (team) {
    for (const r of store.clubhouseGatheringRequests) {
      if (r.teamId !== team.id) continue
      if (r.status === 'declined' || r.status === 'closed') continue
      interestedByGathering.set(
        r.gatheringId,
        (interestedByGathering.get(r.gatheringId) ?? 0) + 1,
      )
    }

    // Any role can opt into "Open to Coffee" — players, alumni, coach,
    // and family/affiliates. The client groups them by role with
    // separate subheads so the list reads cleanly.
    const memberships = store.teamMemberships.filter(
      m =>
        m.teamId === team.id &&
        (m.memberRole === 'alumni' ||
          m.memberRole === 'current_player' ||
          m.memberRole === 'coach' ||
          m.memberRole === 'parent') &&
        m.publishedToNetwork === true,
    )
    const enrichMap = new Map(
      store.personEnrichments.filter(e => e.teamId === team.id).map(e => [e.personId, e]),
    )
    const accountImg = new Map(
      store.accounts
        .filter(a => a.teamId === team.id && a.linkedPersonId && a.image)
        .map(a => [a.linkedPersonId as string, a.image as string]),
    )

    type VisibleEntry = AlumniEntry & { updatedAt?: string }
    const visible: VisibleEntry[] = memberships
      .map((m): VisibleEntry | null => {
        const person = store.people.find(p => p.id === m.personId)
        const enrichment = enrichMap.get(m.personId)
        if (!person) return null
        if (enrichment?.visibleToPlayers === false) return null
        return {
          personId: person.id,
          canonicalName: person.canonicalName,
          memberRole: m.memberRole as 'current_player' | 'alumni' | 'coach' | 'parent',
          city: enrichment?.city,
          state: enrichment?.state,
          classLabel: m.classLabel,
          currentRole: enrichment?.currentRole,
          currentCompany: enrichment?.currentCompany,
          parentRelationship: m.parentRelationship,
          handicap: enrichment?.handicap,
          openToCoffee: enrichment?.openToCoffee,
          photoUrl: enrichment?.photoUrl ?? accountImg.get(person.id) ?? null,
          updatedAt: enrichment?.updatedAt,
        }
      })
      .filter((x): x is VisibleEntry => x !== null)

    // Prioritize the list for the viewer: same-city first, then
    // same-state, then recently active. Also hides the viewer from
    // their own "Open to Coffee" group (they don't need to see
    // themselves in there).
    const session = await auth()
    const viewer = resolveViewerLocation(session, store, team.id)
    openToCoffee = prioritizeForViewer(
      visible.filter(a => a.openToCoffee),
      viewer,
    )

    // Did the viewer themselves opt into "Open to Coffee"? Used to render
    // the small reassurance chip on top of the list.
    viewerPersonId = viewer.personId
    if (viewer.personId) {
      const myEnrichment = store.personEnrichments.find(
        e => e.teamId === team.id && e.personId === viewer.personId,
      )
      viewerOptedToCoffee = myEnrichment?.openToCoffee === true
    }

    const cityMap = new Map<string, { count: number; coffeeCount: number }>()
    for (const entry of visible) {
      const city = entry.city?.trim()
      if (!city) continue
      const cur = cityMap.get(city) ?? { count: 0, coffeeCount: 0 }
      cur.count++
      if (entry.openToCoffee) cur.coffeeCount++
      cityMap.set(city, cur)
    }
    cityGroups = Array.from(cityMap.entries())
      .filter(([, s]) => s.count >= 2)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([city, s]) => ({ city, ...s }))

    const { isExampleGathering, isHiddenGathering } = await import('@/lib/seed-data/example-gatherings')
    socialGatherings = store.clubhouseGatherings
      .filter(
        g =>
          g.teamId === team.id &&
          (g.type === 'coffee' || g.type === 'drinks' || g.type === 'dinner' || g.type === 'event') &&
          g.status !== 'closed' &&
          !isHiddenGathering(g.id),
      )
      .map(g => ({ ...g, isExample: isExampleGathering(g.id, g.isExample) })) as GatheringData[]

    // Open Requests with social intents — visiting members looking for
    // drinks / coffee / dinner.
    const { getOpenRequestsForTeam } = await import('@/lib/store/local-store')
    const allSocialRequests = await getOpenRequestsForTeam(team.id, [
      'drinks',
      'coffee',
      'dinner',
    ])
    openSocialRequests = viewerPersonId
      ? allSocialRequests.filter(r => r.fromPersonId !== viewerPersonId)
      : allSocialRequests
  }

  if (!approval.approved) {
    return (
      <div className="min-h-screen bg-[#f8f5f0]">
        <NineteenthHoleHero />
        <GatedPreview
          signedIn={approval.signedIn}
          eyebrow="Members only · 19th Hole"
          headline="The wall opens to the Penn Golf family."
          blurb="The 19th Hole is where Penn Golf alumni drop drinks, dinners, and watch-party invites. Claim your card to see what's on the wall and add your own."
          stats={[
            { label: 'On the wall', value: socialGatherings.length },
            { label: 'Cities', value: cityGroups.length },
            { label: 'Open to coffee', value: openToCoffee.length },
          ]}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <NineteenthHoleHero />

      <NineteenthHoleClient
        gatherings={socialGatherings}
        openToCoffee={openToCoffee}
        cityGroups={cityGroups}
        interestedCounts={Object.fromEntries(interestedByGathering)}
        viewerOptedToCoffee={viewerOptedToCoffee}
        viewerPersonId={viewerPersonId}
        openRequests={openSocialRequests}
      />
    </div>
  )
}
