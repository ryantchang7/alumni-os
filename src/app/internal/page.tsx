import Link from 'next/link'
import { requireFounderOr404 } from '@/lib/auth/founder-page-gate'

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
    label: 'Member Home Clubs',
    description: "Set any member's home club(s) — current players and alumni.",
    href: '/internal/member-clubs',
  },
  {
    label: 'Gatherings',
    description: 'Manage rounds, coffees, drinks, dinners, and events.',
    href: '/internal/gatherings',
  },
  {
    label: 'Season Tracker',
    description: 'Post qualifying, tournament results, and stats with links. Shows as a timeline in the Team Room.',
    href: '/internal/season',
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
  {
    label: 'Required Fields by Role',
    description: 'What every signup type fills out, and where each field surfaces. Reference doc — pulled from src/lib/role-requirements.ts.',
    href: '/internal/requirements',
  },
  {
    label: 'Launch Kit',
    description: 'Script, storyboard, recording checklist, social copy, and AI B-roll prompts. Everything to record and ship the launch video.',
    href: '/internal/launch-kit',
  },
  {
    label: 'Launch Readiness',
    description: 'Pre-flight checklist before sharing the URL with alumni. Env vars, persistence roundtrip, test email, smoke tests, live counts.',
    href: '/internal/launch-readiness',
  },
]

export default async function InternalPage() {
  await requireFounderOr404()

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Founder</p>
          <h1 className="text-white text-2xl font-semibold tracking-tight">Internal tools</h1>
          <p className="text-gray-400 text-sm mt-2">
            Founder-only admin surfaces for running the Penn Golf Clubhouse. Invisible to everyone else.
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
