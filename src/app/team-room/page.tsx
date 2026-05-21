import Link from 'next/link'
import Image from 'next/image'
import type { Person, TeamMembership } from '@/lib/store/types'

interface PlayerEntry {
  person: Person
  membership: TeamMembership
}

const CLASS_ORDER: Record<string, number> = { 'Sr.': 0, 'Jr.': 1, 'So.': 2, 'Fr.': 3 }

const SUPPORT_CARDS = [
  {
    title: 'Host a Summer Round',
    description: 'Open your home course to a player during summer. A round and a conversation go a long way.',
    cta: 'Express Interest',
    href: '/alumni',
  },
  {
    title: 'Join a Career Night',
    description: 'Share your path in a small-group setting with current players preparing for recruiting.',
    cta: 'Join the List',
    href: '/alumni',
  },
  {
    title: 'Meet Players in Your City',
    description: 'Connect with current Penn Golf players when they are in your city for tournaments or internships.',
    cta: 'Let Us Know',
    href: '/alumni',
  },
  {
    title: 'Share Recruiting Advice',
    description: 'Pass along what you know about recruiting, interviews, or networking in your industry.',
    cta: 'Contribute',
    href: '/alumni',
  },
]

const WAYS_TO_GIVE_BACK = [
  'Attend alumni events',
  'Share your career path',
  'Host a round at your club',
  'Connect players with your network',
  'Offer recruiting advice',
  'Join us for alumni weekend',
]

export default async function TeamRoomPage() {
  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug('penn-mens-golf')

  let currentPlayers: PlayerEntry[] = []
  let recentAlumni: PlayerEntry[] = []

  if (team) {
    currentPlayers = store.teamMemberships
      .filter(m => m.teamId === team.id && m.memberRole === 'current_player')
      .map(m => {
        const person = store.people.find(p => p.id === m.personId)
        return person ? { membership: m, person } : null
      })
      .filter((x): x is PlayerEntry => x !== null)
      .sort((a, b) => {
        const aOrder = CLASS_ORDER[a.membership.classLabel ?? ''] ?? 99
        const bOrder = CLASS_ORDER[b.membership.classLabel ?? ''] ?? 99
        if (aOrder !== bOrder) return aOrder - bOrder
        return a.person.canonicalName.localeCompare(b.person.canonicalName)
      })

    recentAlumni = store.teamMemberships
      .filter(m => m.teamId === team.id && m.memberRole === 'alumni' && m.publishedToNetwork === true)
      .map(m => {
        const person = store.people.find(p => p.id === m.personId)
        return person ? { membership: m, person } : null
      })
      .filter((x): x is PlayerEntry => x !== null)
      .sort((a, b) => (b.membership.rosterEndYear ?? 0) - (a.membership.rosterEndYear ?? 0))
      .slice(0, 6)
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-12 pb-14 overflow-hidden">
        <div className="max-w-[1320px] mx-auto flex items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35 mb-4">
              Penn Men&rsquo;s Golf
            </p>
            <h1
              className="text-white text-3xl sm:text-4xl font-medium tracking-tight"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Team Room
            </h1>
            <span className="block w-12 h-[2px] bg-[#990000] mt-5 mb-5" />
            <p className="text-white/55 text-sm sm:text-base max-w-xl leading-relaxed">
              Current roster, program tradition, and the alumni who carry Penn Golf forward.
            </p>
          </div>
          {/* Mascot — Penn spirit accent, right side of hero */}
          <div className="hidden sm:flex flex-shrink-0 items-end self-end pb-0">
            <Image
              src="/quaker-golfer.png"
              alt="Penn Quaker golfer"
              width={130}
              height={170}
              className="object-contain drop-shadow-lg"
              data-testid="team-room-mascot"
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-10 space-y-14">

        {/* 2026-27 Roster */}
        <section>
          <h2 className="text-base font-semibold text-[#0a1628] mb-1">2026-27 Roster</h2>
          <p className="text-sm text-[#8a7f70] mb-6">Current players on the Penn Men&apos;s Golf team.</p>
          {currentPlayers.length === 0 ? (
            <p className="text-sm text-[#8a7f70]">Roster will appear here once players are added to the Clubhouse.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentPlayers.map(({ person, membership }) => {
                const classShort = membership.classYearEstimate?.split(' / ')[0]
                return (
                  <Link
                    key={person.id}
                    href={`/player/alumni/${person.id}`}
                    className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-4 hover:border-[#0a1628]/30 transition-colors block"
                    style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-[#0a1628] text-sm">{person.canonicalName}</p>
                      {classShort && (
                        <span className="text-[10px] font-medium text-[#2d6a4f] bg-[#2d6a4f]/10 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                          {classShort}
                        </span>
                      )}
                    </div>
                    {membership.hometown && (
                      <p className="text-xs text-[#8a7f70] mt-1">{membership.hometown}</p>
                    )}
                    {membership.highSchool && (
                      <p className="text-xs text-[#8a7f70]">{membership.highSchool}</p>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Captain's Note */}
        <section>
          <h2 className="text-base font-semibold text-[#0a1628] mb-1">Captain&apos;s Note</h2>
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-[#8a7f70] bg-[#f8f5f0] px-2 py-0.5 rounded-full border border-[rgba(180,168,150,0.35)]">
                Coming soon
              </span>
            </div>
            <p className="text-sm text-[#8a7f70] leading-relaxed">
              A note from this year&apos;s captain will appear here each season.
            </p>
          </div>
        </section>

        {/* Recent Alumni */}
        {recentAlumni.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-[#0a1628] mb-1">Recent Alumni</h2>
            <p className="text-sm text-[#8a7f70] mb-6">Just finished their Penn Golf careers.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentAlumni.map(({ person, membership }) => (
                <Link
                  key={person.id}
                  href={`/player/alumni/${person.id}`}
                  className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-4 hover:border-[#0a1628]/30 transition-colors block"
                  style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-[#0a1628] text-sm">{person.canonicalName}</p>
                    {membership.rosterEndYear && (
                      <span className="text-[10px] font-medium text-[#8a7f70] bg-[#f8f5f0] px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 border border-[rgba(180,168,150,0.35)]">
                        &apos;{String(membership.rosterEndYear).slice(2)}
                      </span>
                    )}
                  </div>
                  {membership.hometown && (
                    <p className="text-xs text-[#8a7f70] mt-1">{membership.hometown}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Support the Program */}
        <section>
          <h2 className="text-base font-semibold text-[#0a1628] mb-1">Support the Program</h2>
          <p className="text-sm text-[#8a7f70] mb-6">Ways alumni can make a real difference for current players.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SUPPORT_CARDS.map(card => (
              <div
                key={card.title}
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
              >
                <p className="font-semibold text-[#0a1628] text-sm mb-1">{card.title}</p>
                <p className="text-xs text-[#4a5568] mb-4 leading-relaxed">{card.description}</p>
                <Link
                  href={card.href}
                  className="text-xs font-semibold text-[#990000] hover:underline"
                >
                  {card.cta} &rarr;
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Ways to Give Back */}
        <section>
          <h2 className="text-base font-semibold text-[#0a1628] mb-1">Ways to Give Back</h2>
          <p className="text-sm text-[#8a7f70] mb-6">Small things that add up over a season.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
            {WAYS_TO_GIVE_BACK.map(item => (
              <div key={item} className="flex items-center gap-2.5 py-2 border-b border-[rgba(180,168,150,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f] flex-shrink-0" />
                <p className="text-sm text-[#4a5568]">{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          <div>
            <p className="font-semibold text-[#0a1628] text-sm">Browse the Member Book</p>
            <p className="text-xs text-[#8a7f70] mt-0.5">Every Penn Men&rsquo;s Golf member, across generations.</p>
          </div>
          <Link
            href="/member-book"
            className="text-sm font-semibold text-[#990000] hover:underline whitespace-nowrap"
          >
            Open the Member Book &rarr;
          </Link>
        </div>

      </div>
    </div>
  )
}
