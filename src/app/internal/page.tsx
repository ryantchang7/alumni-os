import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { isCaptainEmailWithOverrides } from '@/lib/captains-runtime'
import { readStore } from '@/lib/store/local-store'

const TEAM_SLUG = 'penn-mens-golf'

const tools = [
  {
    label: 'Profile Claims',
    description: 'Approve or decline alumni who want to claim their Member Book card.',
    href: '/internal/claims',
  },
  {
    label: 'Add a Member',
    description: 'Drop a new alumnus or current player into the roster by hand.',
    href: '/internal/add-member',
  },
  {
    label: 'Current Roster Editor',
    description: 'Edit the current Penn Golf roster and player profile details.',
    href: '/internal/current-roster',
  },
  {
    label: 'Master List',
    description: 'View every member, roster status, and enrichment state.',
    href: '/internal/master-list',
  },
  {
    label: 'Gatherings',
    description: 'Manage rounds, coffees, drinks, dinners, and events.',
    href: '/internal/gatherings',
  },
  {
    label: 'Studio',
    description: 'Edit text and images across the site — headlines, hero images, page copy.',
    href: '/internal/studio',
  },
  {
    label: 'Roles',
    description: 'Founder-only. Designate PGC Captains, Supporting Members, Founding Members, and Family & Affiliate.',
    href: '/internal/roles',
  },
]

export default async function InternalPage() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect('/login?next=/internal')
  }
  const store = await readStore()
  if (!isCaptainEmailWithOverrides(session.user.email, TEAM_SLUG, store.accounts)) {
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
            Captains only.
          </h1>
          <p className="text-[13px] text-[#3d4a5c]">
            Internal tools are reserved for Penn Golf captains. If that
            should be you, ask the existing captain to add your email.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Captain</p>
          <h1 className="text-white text-2xl font-semibold tracking-tight">Internal tools</h1>
          <p className="text-gray-400 text-sm mt-2">
            Admin surfaces for running the Penn Golf Clubhouse. Not linked from the public nav.
          </p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-8">
        <div className="-mt-5 relative z-10 pb-16">
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tools.map(tool => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="block border border-[rgba(180,168,150,0.35)] rounded-lg p-4 hover:border-[#0a1628] hover:shadow-sm transition-all"
                >
                  <p className="font-semibold text-sm text-[#0a1628] mb-1">{tool.label}</p>
                  <p className="text-xs text-[#8a7f70]">{tool.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
