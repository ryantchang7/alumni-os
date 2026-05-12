import Link from 'next/link'
import { Database, Users, Eye, Lock } from 'lucide-react'

const modeCards = [
  {
    icon: Database,
    title: 'Builder',
    description: 'Create a team graph from a public athletics website.',
    cta: 'Start Builder →',
    href: '/builder',
  },
  {
    icon: Users,
    title: 'Player Mode',
    description: 'Find alumni for career, golf, mentorship, city moves, and warm intros.',
    cta: 'Open Player Mode →',
    href: '/player',
  },
  {
    icon: Eye,
    title: 'Review Queue',
    description: 'Verify roster entries and graph quality before anything becomes visible.',
    cta: 'Open Review Queue →',
    href: '/builder/quality?teamSlug=penn-mens-golf',
  },
  {
    icon: Lock,
    title: 'Alumni / Coach Preview',
    description: 'Preview how alumni and coaches will eventually stay connected, manage preferences, and support the team.',
    cta: null,
    href: null,
  },
]

export default function AppPage() {
  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Navy header */}
      <div className="bg-[#0a1628] py-16 px-8">
        <div className="max-w-[1320px] mx-auto">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">
            Alumni OS · Demo
          </p>
          <h1
            className="text-white font-semibold tracking-tight leading-tight"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
          >
            Build and activate a team alumni network.
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mt-4 leading-relaxed">
            Start with a team website. Alumni OS discovers public roster history, prepares candidates for review, and creates a private relationship graph for players, alumni, coaches, and team events.
          </p>
        </div>
      </div>

      {/* Mode cards */}
      <div className="max-w-[1320px] mx-auto px-8 mt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {modeCards.map(card => {
            const Icon = card.icon
            return (
              <div
                key={card.title}
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-7"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
              >
                <div className="w-10 h-10 rounded-lg bg-[#0a1628] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-[#0a1628] mt-4 tracking-tight">{card.title}</h2>
                <p className="text-sm text-[#8a7f70] mt-1.5 leading-relaxed">{card.description}</p>
                <div className="mt-5">
                  {card.href ? (
                    <Link
                      href={card.href}
                      className="text-sm font-medium text-[#990000] hover:underline"
                    >
                      {card.cta}
                    </Link>
                  ) : (
                    <span className="text-sm text-[#8a7f70]">Coming Soon</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer links */}
      <div className="max-w-[1320px] mx-auto px-8 mt-16 pb-12 border-t border-[rgba(180,168,150,0.35)] pt-8">
        <p className="text-sm text-[#8a7f70]">
          Existing Penn Golf demo:{' '}
          <Link href="/teams/penn-mens-golf" className="text-[#990000] hover:underline font-medium">
            Penn Golf Dashboard
          </Link>
          {' · '}
          <Link href="/teams/penn-mens-golf/scraper" className="text-[#990000] hover:underline font-medium">
            Scraper Center
          </Link>
          {' · '}
          <Link href="/teams/penn-mens-golf/agent" className="text-[#990000] hover:underline font-medium">
            Agent Run
          </Link>
        </p>
      </div>
    </div>
  )
}
