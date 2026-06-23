'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageSquare, Users, Flag, CalendarDays, MapPin, Calendar } from 'lucide-react'
import { PENN_GOLF_TRADITION } from '@/lib/program-history/penn-mens-golf'
import { memberBookEntries } from '@/lib/member-book/data'
import { getPublicMembers } from '@/lib/member-book/helpers'
import ClubhouseActivityFeed from '@/components/ClubhouseActivityFeed'
import OnTheLoopStrip from '@/components/OnTheLoopStrip'
import ClubhouseChecklist from '@/components/ClubhouseChecklist'
import TeamNewsStrip from '@/components/TeamNewsStrip'
import MemberOnlyTease from '@/components/MemberOnlyTease'
import MemberBadges from '@/components/MemberBadges'
import HeroCrest from '@/components/HeroCrest'
import { useSiteContent } from '@/lib/site-content/use-site-content'
import type { TeamNewsItem } from '@/lib/store/types'

const TOTAL_MEMBERS = getPublicMembers(memberBookEntries).length

interface GatheringSnippet {
  id: string
  type: 'round' | 'coffee' | 'drinks' | 'dinner' | 'event'
  title: string
  dateText: string
  city?: string
  state?: string
  venue?: string
  status: 'open' | 'full' | 'closed'
  isExample?: boolean
}

function ThisWeekPanel({ teamSlug, approved }: { teamSlug: string; approved: boolean }) {
  const [gatherings, setGatherings] = useState<GatheringSnippet[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/gatherings?teamSlug=${teamSlug}`)
      .then(r => r.ok ? r.json() : { gatherings: [] })
      .then(d => {
        const all: GatheringSnippet[] = d.gatherings ?? []
        setTotalCount(all.length)
        // Pick one of each type class: round, social (coffee/drinks/dinner), event
        const round = all.find(g => g.type === 'round')
        const social = all.find(g => g.type === 'coffee' || g.type === 'drinks' || g.type === 'dinner')
        const event = all.find(g => g.type === 'event')
        setGatherings([round, social, event].filter((g): g is GatheringSnippet => !!g))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [teamSlug])

  if (loading || gatherings.length === 0) return null

  if (!approved) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.55 }}
        className="pb-8"
        data-testid="this-week-panel"
      >
        <MemberOnlyTease
          icon={CalendarDays}
          title="This Week in the Clubhouse"
          count={totalCount}
          countLabel={totalCount === 1 ? 'gathering this week' : 'gatherings this week'}
          valueProp="Members see what's on, who's hosting, and can RSVP."
        />
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.55 }}
      className="pb-8"
      data-testid="this-week-panel"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-[#0a1628]">This Week in the Clubhouse</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {gatherings.map(g => (
          <Link
            key={g.id}
            href={`/gatherings/${g.id}`}
            className="block bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-4 hover:shadow-md transition-shadow group"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              <span className="text-[10px] font-semibold text-[#0a1628] bg-[#0a1628]/8 px-2 py-0.5 rounded-full inline-block capitalize">
                {g.type === 'coffee' || g.type === 'drinks' || g.type === 'dinner' ? '19th Hole' : g.type === 'round' ? 'The Course' : 'Event'}
              </span>
              {g.isExample && (
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a7f70] bg-[#faf7f2] border border-[rgba(180,168,150,0.6)] px-2 py-0.5 rounded-full"
                  title="Sample gathering — host a real one to replace it."
                >
                  Example
                </span>
              )}
            </div>
            <p className="font-semibold text-[#0a1628] text-sm leading-snug mb-1.5">{g.title}</p>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-[#4a5568]">
                <Calendar className="w-3 h-3 text-[#8a7f70]" />
                <span>{g.dateText}</span>
              </div>
              {(g.city || g.venue) && (
                <div className="flex items-center gap-1.5 text-xs text-[#8a7f70]">
                  <MapPin className="w-3 h-3" />
                  <span>{g.venue ?? `${g.city}${g.state ? `, ${g.state}` : ''}`}</span>
                </div>
              )}
            </div>
            <span className="text-xs font-medium text-[#990000] group-hover:underline mt-3 block">
              See details &rarr;
            </span>
          </Link>
        ))}
      </div>
    </motion.div>
  )
}

interface PlayerProfile {
  personId: string
  canonicalName: string
  firstName?: string
  lastName?: string
  memberRole?: 'current_player' | 'alumni' | 'parent'
  classLabel?: string
  classYearEstimate?: string
  rosterStartYear?: number
  rosterEndYear?: number
  rosterYearsLabel: string
  hometown?: string
  highSchool?: string
  publishedAt?: string
  career?: {
    currentRole?: string
    currentCompany?: string
    city?: string
  }
  alumniBio?: string
  helpTopics?: string[]
  contactPreference?: string
  badges?: import('@/lib/badges').BadgeId[]
}

const spring = { type: 'spring' as const, stiffness: 120, damping: 22, mass: 0.8 }

function TraditionSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.45 }}
      className="mb-8"
      data-testid="tradition-section"
    >
      <div
        className="rounded-2xl overflow-hidden border border-[rgba(180,168,150,0.28)]"
        style={{ boxShadow: '0 2px 8px rgba(10,22,40,0.08), 0 16px 40px rgba(10,22,40,0.06)' }}
      >
        {/* Trophy cabinet header — deep navy */}
        <div className="bg-[#0a1628] px-6 sm:px-8 pt-6 pb-5 relative overflow-hidden">
          {/* Subtle horizontal line texture */}
          <div
            className="absolute inset-0 opacity-[0.035] pointer-events-none"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, white, white 1px, transparent 1px, transparent 22px)' }}
          />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/35 mb-2.5">Penn Men&apos;s Golf</p>
            <h2
              className="text-xl sm:text-2xl font-medium text-white leading-tight mb-2"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {PENN_GOLF_TRADITION.title}
            </h2>
            <p className="text-[11px] text-white/45 max-w-lg leading-relaxed">{PENN_GOLF_TRADITION.subtitle}</p>
          </div>
        </div>
        {/* Penn red ribbon */}
        <div className="h-[3px] bg-gradient-to-r from-[#990000] via-[#bb0000] to-[#990000]" />
        {/* Plaque grid on parchment — NUMBER FIRST */}
        <div className="bg-[#faf7f2] grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-[rgba(180,168,150,0.3)]">
          {PENN_GOLF_TRADITION.achievements.map((a) => (
            <div key={a.label} className="px-5 sm:px-6 py-6 sm:py-7 hover:-translate-y-px hover:bg-white transition-all duration-150 cursor-default">
              <p
                className={`text-[3rem] sm:text-[3.5rem] font-light leading-none mb-1 ${a.featured ? 'text-[#990000]' : 'text-[#0a1628]'}`}
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                {a.value}
              </p>
              <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-[#8a7f70] mb-2 leading-tight">{a.label}</p>
              <p className="text-[11px] font-medium text-[#3d4a5c] mb-1.5 leading-snug">{a.detail}</p>
              <p className="text-[10px] text-[#8a7f70] leading-relaxed">{a.description}</p>
            </div>
          ))}
        </div>
        <div className="bg-[#faf7f2] px-5 sm:px-6 py-3 border-t border-[rgba(180,168,150,0.3)] flex items-center justify-end">
          <Link
            href="/hall-of-fame"
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#990000] hover:underline"
          >
            Visit the Hall of Fame &rarr;
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

const rooms = [
  {
    id: 'ask',
    label: 'Ask',
    description: 'Get career advice, industry insight, or guidance from members who have been in your shoes.',
    href: '/ask',
    icon: MessageSquare,
    cta: 'Ask for help',
  },
  {
    id: 'meet',
    label: 'Meet',
    description: 'Browse the full member book. Filter by city, industry, class year, or what they\'re open to.',
    href: '/member-book',
    icon: Users,
    cta: 'Browse members',
  },
  {
    id: 'play',
    label: 'Play',
    description: 'Find alumni who are open to a round. Connect over golf wherever they are.',
    href: '/the-course',
    icon: Flag,
    cta: 'Find a playing partner',
  },
  {
    id: 'gather',
    label: 'Gather',
    description: 'Coffee, dinners, and signature Penn Golf events. Stay in the loop.',
    href: '/19th-hole',
    icon: CalendarDays,
    cta: 'See what\'s coming up',
  },
]

function MiniMemberCard({ profile, teamSlug }: { profile: PlayerProfile; teamSlug: string }) {
  const isCurrentPlayer = profile.memberRole === 'current_player'
  const subline = isCurrentPlayer
    ? (profile.classYearEstimate?.split(' / ')[0] ?? profile.classLabel ?? null)
    : profile.rosterYearsLabel !== '—'
      ? `Penn Golf ${profile.rosterYearsLabel}`
      : null
  const careerLine = profile.career?.currentRole && profile.career?.currentCompany
    ? `${profile.career.currentRole} · ${profile.career.currentCompany}`
    : profile.career?.currentRole ?? profile.career?.currentCompany ?? null

  return (
    <Link
      href={`/player/alumni/${profile.personId}?teamSlug=${teamSlug}`}
      className="block bg-[#f8f5f0] border border-[rgba(180,168,150,0.4)] rounded-lg p-3 hover:bg-white hover:shadow-sm transition-all group flex-shrink-0 w-[200px]"
    >
      <div className="flex items-start justify-between gap-1 mb-1">
        <p className="font-semibold text-[#0a1628] text-xs leading-snug truncate">{profile.canonicalName}</p>
        {isCurrentPlayer && (
          <span className="flex-shrink-0 text-[11px] font-semibold text-[#2d6a4f] bg-[#2d6a4f]/10 px-1.5 py-0.5 rounded-full">
            Player
          </span>
        )}
      </div>
      {profile.badges && profile.badges.length > 0 && (
        <div className="mb-1">
          <MemberBadges badges={profile.badges} size="sm" iconOnly />
        </div>
      )}
      {subline && <p className="text-[10px] text-[#8a7f70]">{subline}</p>}
      {careerLine && <p className="text-[10px] text-[#4a5568] mt-0.5 truncate">{careerLine}</p>}
    </Link>
  )
}

function WelcomeBanner({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative bg-white border border-[#c8a84b]/45 rounded-xl px-5 py-4 mb-6"
      style={{
        boxShadow:
          '0 1px 3px rgba(10,22,40,0.06), 0 8px 20px rgba(200,168,75,0.10)',
      }}
    >
      <span
        aria-hidden
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-sm bg-[#c8a84b]"
      />
      <p
        className="text-[#0a1628] text-[15px] leading-snug pl-2"
        style={{ fontFamily: 'var(--font-playfair)' }}
      >
        Welcome home, {name}.{' '}
        <span className="text-[#3d4a5c] italic">
          Here&rsquo;s what&rsquo;s new at the clubhouse.
        </span>
      </p>
    </motion.div>
  )
}

interface OnboardingStatus {
  linked: boolean
  hasCity?: boolean
  hasAvailability?: boolean
  hasFirstPost?: boolean
}

function ClubhouseInner() {
  const searchParams = useSearchParams()
  const teamSlug = searchParams.get('teamSlug') ?? 'penn-mens-golf'
  const welcomeName = searchParams.get('welcome')

  const welcomeLine = useSiteContent(
    'player.welcome-line',
    'A private clubhouse for Penn Golf players, alumni, families, and friends to stay close, help the next generation, and keep playing together.',
  )
  const crestImage = useSiteContent('player.crest-image', '')

  const [profiles, setProfiles] = useState<PlayerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [newsItems, setNewsItems] = useState<TeamNewsItem[]>([])
  const [onboarding, setOnboarding] = useState<OnboardingStatus | null>(null)
  const [billingStatus, setBillingStatus] = useState<{
    signedIn: boolean
    subscribed: boolean
    configured: boolean
  } | null>(null)

  useEffect(() => {
    fetch(`/api/player/profiles?teamSlug=${teamSlug}`)
      .then(r => (r.ok ? r.json() : { profiles: [] }))
      .then(data => {
        setProfiles(data.profiles ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))

    fetch(`/api/team/news?teamSlug=${teamSlug}&limit=4`)
      .then(r => (r.ok ? r.json() : { items: [] }))
      .then(data => setNewsItems(data.items ?? []))
      .catch(() => {})

    fetch('/api/account/onboarding-status')
      .then(r => (r.ok ? r.json() : { linked: false }))
      .then((data: OnboardingStatus) => setOnboarding(data))
      .catch(() => setOnboarding({ linked: false }))

    fetch('/api/billing/status')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!d) return
        setBillingStatus({
          signedIn: !!d.signedIn,
          subscribed: !!d.subscribed,
          configured: !!d.configured,
        })
      })
      .catch(() => {})
  }, [teamSlug])

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Header */}
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto flex items-center gap-5 sm:gap-7">
          <HeroCrest src={crestImage} alt="Penn Golf crest" />
          <div className="min-w-0 flex-1">
            <motion.p
              className="text-xs text-gray-500 uppercase tracking-widest mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Penn Golf · Clubhouse
            </motion.p>
            <motion.h1
              className="text-white text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, ...spring }}
            >
              Welcome to the Penn Golf Clubhouse.
            </motion.h1>
            <motion.p
              className="text-gray-400 text-sm sm:text-base mt-2 max-w-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              {welcomeLine}
            </motion.p>
          </div>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 sm:px-8">
        {welcomeName && (
          <div className="-mt-5 relative z-10">
            <WelcomeBanner name={welcomeName} />
          </div>
        )}

        {/* First-week locker checklist — only when signed in + linked */}
        {onboarding?.linked && (
          <div className={`${welcomeName ? 'mt-4' : '-mt-5'} relative z-10 mb-6`}>
            <ClubhouseChecklist
              hasCity={!!onboarding.hasCity}
              hasAvailability={!!onboarding.hasAvailability}
              hasFirstPost={!!onboarding.hasFirstPost}
            />
          </div>
        )}

        {/* Support nudge — approved members who haven't subscribed yet. */}
        {onboarding?.linked &&
          billingStatus?.configured &&
          !billingStatus.subscribed && (
            <div
              className="mb-8 bg-gradient-to-r from-[#0a1628] to-[#1a2d4a] text-white rounded-2xl px-6 py-5 sm:px-7 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#c8a84b]/25"
              style={{
                boxShadow: '0 4px 14px rgba(10,22,40,0.15), 0 18px 40px rgba(10,22,40,0.08)',
              }}
            >
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b] mb-1.5">
                  Back the program
                </p>
                <p
                  className="text-white text-base sm:text-lg font-medium leading-snug"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  Membership keeps the Clubhouse running and 70% goes to Penn Men&rsquo;s Golf.
                </p>
                <p className="text-[12.5px] text-white/65 mt-1">
                  Founding Members get a place on the Founders Wall.
                </p>
              </div>
              <Link
                href="/support"
                className="bg-[#c8a84b] hover:bg-[#d4b75a] text-[#0a1628] text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
              >
                See membership &rarr;
              </Link>
            </div>
          )}

        {/* From the box — Penn Athletics news */}
        {newsItems.length > 0 && (
          <div className="mb-10">
            <TeamNewsStrip items={newsItems} />
          </div>
        )}

        {/* 4 primary rooms */}
        <div className={`${welcomeName || onboarding?.linked || newsItems.length > 0 ? 'mt-2' : '-mt-5'} relative z-10 mb-12`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {rooms.map((room, i) => {
              const Icon = room.icon
              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: 0.15 + i * 0.07 }}
                >
                  <Link
                    href={room.href}
                    className="block bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5 h-full hover:shadow-md transition-shadow group"
                    style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#f0ece5] flex items-center justify-center mb-3">
                      <Icon className="w-4 h-4 text-[#0a1628]" />
                    </div>
                    <p className="font-semibold text-[#0a1628] text-base mb-1.5">{room.label}</p>
                    <p className="text-xs text-[#6b7280] leading-relaxed mb-4">{room.description}</p>
                    <span className="text-xs font-semibold text-[#990000] group-hover:underline">
                      {room.cta} &rarr;
                    </span>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* This Week in the Clubhouse — moved up so what's HAPPENING this
            week sits near the top of the page, not at the bottom. */}
        <ThisWeekPanel teamSlug={teamSlug} approved={!!onboarding?.linked} />

        {/* On the Loop — Penn Golf passing through. Tease for non-members. */}
        <OnTheLoopStrip approved={!!onboarding?.linked} />

        {/* Clubhouse Activity Feed. Tease for non-members. */}
        <ClubhouseActivityFeed approved={!!onboarding?.linked} />

        {/* Member Book preview panel */}
        {!loading && profiles.length > 0 && (() => {
          const currentPlayers = profiles.filter(p => p.memberRole === 'current_player')
          const alumni = profiles.filter(p => p.memberRole !== 'current_player')
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.5 }}
              className="pb-10"
              data-testid="network-alumni-grid"
            >
              <div
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
              >
                {/* Header */}
                <div className="px-5 pt-5 pb-4 border-b border-[rgba(180,168,150,0.3)] flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-[#0a1628]">Member Book</h2>
                    <p className="text-xs text-[#8a7f70] mt-0.5">
                      {TOTAL_MEMBERS} members across generations
                      {currentPlayers.length > 0 && (
                        <> · {currentPlayers.length} in the Clubhouse this season</>
                      )}
                    </p>
                  </div>
                  <Link
                    href="/member-book"
                    className="text-xs font-semibold text-[#990000] hover:underline whitespace-nowrap"
                  >
                    Open the Member Book &rarr;
                  </Link>
                </div>

                {/* Current players row */}
                {currentPlayers.length > 0 && (
                  <div className="px-5 py-4 border-b border-[rgba(180,168,150,0.2)]">
                    <p className="text-[10px] font-semibold text-[#8a7f70] uppercase tracking-wider mb-3">
                      Current Players
                    </p>
                    <div className="relative">
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {currentPlayers.map(p => (
                          <MiniMemberCard key={p.personId} profile={p} teamSlug={teamSlug} />
                        ))}
                      </div>
                      {/* Right-edge fade hints more cards scroll into view. */}
                      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent" />
                    </div>
                  </div>
                )}

                {/* Alumni row */}
                {alumni.length > 0 && (
                  <div className="px-5 py-4">
                    <p className="text-[10px] font-semibold text-[#8a7f70] uppercase tracking-wider mb-3">
                      Alumni
                    </p>
                    <div className="relative">
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {alumni.slice(0, 12).map(p => (
                          <MiniMemberCard key={p.personId} profile={p} teamSlug={teamSlug} />
                        ))}
                        {alumni.length > 12 && (
                          <Link
                            href="/member-book"
                            className="flex-shrink-0 w-[140px] bg-[#f8f5f0] border border-[rgba(180,168,150,0.4)] rounded-lg p-3 flex flex-col items-center justify-center hover:bg-white transition-colors"
                          >
                            <p className="text-xs font-semibold text-[#0a1628]">All {TOTAL_MEMBERS} members</p>
                            <p className="text-[10px] text-[#990000] mt-1">Open Member Book &rarr;</p>
                          </Link>
                        )}
                      </div>
                      {/* Right-edge fade hints more cards scroll into view. */}
                      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent" />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })()}

        {/* Penn Golf Tradition — moved to bottom; it's "always there"
            content (history), not timely. */}
        <TraditionSection />

        {/* Your Requests */}
        <div className="pb-8">
          <div className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-5 py-4 flex items-center justify-between"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}>
            <div>
              <p className="text-sm font-semibold text-[#0a1628]">Your Requests</p>
              <p className="text-xs text-[#8a7f70] mt-0.5">See the status of requests you&rsquo;ve sent.</p>
            </div>
            <Link href="/player/requests" className="text-xs font-semibold text-[#990000] hover:underline whitespace-nowrap">
              View &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function ClubhouseSkeleton() {
  return (
    <div className="min-h-screen bg-[#f8f5f0] animate-pulse">
      {/* Header skeleton */}
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-white/10 flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-3 w-24 bg-white/10 rounded" />
            <div className="h-8 w-3/4 bg-white/15 rounded" />
            <div className="h-4 w-1/2 bg-white/10 rounded" />
          </div>
        </div>
      </div>
      {/* Room cards skeleton */}
      <div className="max-w-[1320px] mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5 h-40" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PlayerPage() {
  return (
    <Suspense fallback={<ClubhouseSkeleton />}>
      <ClubhouseInner />
    </Suspense>
  )
}
