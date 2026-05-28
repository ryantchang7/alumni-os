import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { FOUNDER_EMAILS } from '@/lib/badges'
import RolesClient, { type RolesAccountRow } from './RolesClient'

const TEAM_SLUG = 'penn-mens-golf'

export default async function RolesPage() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect('/login?next=/internal/roles')
  }
  const email = session.user.email.toLowerCase().trim()
  if (!FOUNDER_EMAILS.has(email)) {
    return (
      <div className="min-h-[calc(100dvh-60px)] bg-[#f8f5f0] flex items-center justify-center px-6">
        <div className="max-w-md text-center bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl p-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a7f70] mb-3">
            Restricted
          </p>
          <h1
            className="text-[#0a1628] text-2xl font-medium mb-2"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Founder only.
          </h1>
          <p className="text-[13px] text-[#3d4a5c]">
            Role designation is reserved for the program founder.
          </p>
        </div>
      </div>
    )
  }

  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) {
    return <div className="p-8 text-sm text-red-600">Team not found</div>
  }

  const personName = new Map(store.people.map(p => [p.id, p.canonicalName]))
  const rows: RolesAccountRow[] = store.accounts
    .filter(a => a.teamId === team.id)
    .map((a): RolesAccountRow => {
      const subActive =
        a.subscription?.status === 'active' || a.subscription?.status === 'trialing'
      let stripeTier: RolesAccountRow['stripeTier'] = null
      if (subActive) {
        if (a.subscription?.priceId === process.env.STRIPE_FOUNDING_PRICE_ID) {
          stripeTier = 'founding'
        } else if (a.subscription?.priceId === process.env.STRIPE_PARENT_PRICE_ID) {
          stripeTier = 'parent'
        } else {
          stripeTier = 'member'
        }
      }
      return {
        id: a.id,
        email: a.email,
        name: a.name ?? null,
        linkedName: a.linkedPersonId
          ? personName.get(a.linkedPersonId) ?? null
          : null,
        manualCaptain: a.manualCaptain === true,
        manualBadges: a.manualBadges ?? [],
        stripeTier,
      }
    })
    .sort((a, b) => {
      const an = (a.linkedName ?? a.name ?? a.email).toLowerCase()
      const bn = (b.linkedName ?? b.name ?? b.email).toLowerCase()
      return an.localeCompare(bn)
    })

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">
            Founder
          </p>
          <h1 className="text-white text-2xl font-semibold tracking-tight">
            Roles
          </h1>
          <p className="text-gray-400 text-sm mt-2 max-w-2xl">
            Grant Captain access or hand someone the Supporting Member,
            Founding Member, or Family &amp; Affiliate badge — without
            needing a Stripe checkout. Stacks on top of any paid sub.
          </p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-8">
        <div className="-mt-5 relative z-10 pb-16">
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
            style={{
              boxShadow:
                '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)',
            }}
          >
            <RolesClient initialAccounts={rows} />
          </div>
        </div>
      </div>
    </div>
  )
}
