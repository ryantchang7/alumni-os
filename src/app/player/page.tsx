'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, animate } from 'framer-motion'
import { settle, revealViewport } from '@/lib/motion'
import { MessageSquare, Users, Flag, CalendarDays, MapPin, Calendar, BookOpen } from 'lucide-react'
import { PENN_GOLF_TRADITION } from '@/lib/program-history/penn-mens-golf'
import { memberBookEntries } from '@/lib/member-book/data'
import { getPublicMembers } from '@/lib/member-book/helpers'
import ClubhouseActivityFeed from '@/components/ClubhouseActivityFeed'
import OnTheLoopStrip from '@/components/OnTheLoopStrip'
import YourEraSection from '@/components/YourEraSection'
import ClubhouseChecklist from '@/components/ClubhouseChecklist'
import TeamNewsStrip from '@/components/TeamNewsStrip'
import MemberOnlyTease from '@/components/MemberOnlyTease'
import AlumniCard from '@/components/alumni/AlumniCard'
import { useSiteContent } from '@/lib/site-content/use-site-content'
import type { AlumniSpotlight, TeamNewsItem } from '@/lib/store/types'
import ScotlandTourBanner from '@/components/ScotlandTourBanner'
import NextEventChip from '@/components/NextEventChip'
import { deriveClassLabel } from '@/lib/class-year'
import { BOOK_PROOF } from '@/lib/proof'
import { APPROVAL_PROMISE } from '@/lib/access/promise'

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
        whileInView={{ opacity: 1, y: 0 }}
        viewport={revealViewport}
        transition={settle}
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
      whileInView={{ opacity: 1, y: 0 }}
      viewport={revealViewport}
      transition={settle}
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
                  className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted bg-[#fdfcf9] border border-[rgba(180,168,150,0.6)] px-2 py-0.5 rounded-full"
                  title="Sample gathering — host a real one to replace it."
                >
                  Example
                </span>
              )}
            </div>
            <p className="font-semibold text-[#0a1628] text-sm leading-snug mb-1.5">{g.title}</p>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-[#3a4657]">
                <Calendar className="w-3 h-3 text-ink-muted" />
                <span>{g.dateText}</span>
              </div>
              {(g.city || g.venue) && (
                <div className="flex items-center gap-1.5 text-xs text-ink-muted">
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

function SpotlightCard({ spotlight }: { spotlight: AlumniSpotlight }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={revealViewport}
      transition={settle}
      className="pb-8"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-[#0a1628]">This Week&rsquo;s Spotlight</h2>
        <Link
          href="/spotlight"
          className="text-xs font-semibold text-[#990000] hover:underline whitespace-nowrap"
        >
          All spotlights &rarr;
        </Link>
      </div>
      <Link
        href="/spotlight"
        className="group block bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5 hover:shadow-md transition-shadow"
        style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex-shrink-0 w-12 h-12 rounded-full bg-[#0a1628] flex items-center justify-center text-white text-lg font-semibold font-heading"
            aria-hidden="true"
          >
            {spotlight.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <p
                className="font-semibold text-[#0a1628] text-sm leading-tight font-heading"
              >
                {spotlight.name}
              </p>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c8a84b] bg-[#c8a84b]/10 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                Spotlight
              </span>
            </div>
            {spotlight.headline && (
              <p className="text-xs text-[#c8a84b] mt-0.5 leading-snug">{spotlight.headline}</p>
            )}
            <p className="text-xs text-[#3a4657] mt-1.5 leading-relaxed line-clamp-2">{spotlight.blurb}</p>
            <span className="text-xs font-semibold text-[#990000] group-hover:underline mt-2 inline-block">
              Read the spotlight &rarr;
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// The one sanctioned count-up in the app — trophy-cabinet stats only.
// Fires once, ignores prefers-reduced-motion by jumping straight to the
// target (MotionConfig's reducedMotion="user" only covers motion.*
// components, not this imperative animate() call).
function CountUpValue({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const target = parseInt(value, 10)
  const [display, setDisplay] = useState(Number.isNaN(target) ? value : '0')

  useEffect(() => {
    if (Number.isNaN(target) || !ref.current) return
    const el = ref.current
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setDisplay(String(target))
      return
    }
    let fired = false
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || fired) return
        fired = true
        animate(0, target, {
          duration: 0.85,
          ease: [0.22, 1, 0.36, 1],
          onUpdate: (v) => setDisplay(String(Math.round(v))),
        })
        io.disconnect()
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [target])

  return (
    <p ref={ref} className={className}>
      {display}
    </p>
  )
}

function TraditionSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={revealViewport}
      transition={settle}
      className="mb-8"
      data-testid="tradition-section"
    >
      <div
        className="rounded-2xl overflow-hidden border border-[rgba(180,168,150,0.28)]"
        style={{ boxShadow: '0 2px 8px rgba(10,22,40,0.08), 0 16px 40px rgba(10,22,40,0.06)' }}
      >
        {/* Trophy cabinet header — deep navy */}
        <div className="bg-[#0a1628] px-6 sm:px-8 pt-6 pb-5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.035] pointer-events-none texture-engraved" />
          <div className="relative">
            <p className="eyebrow text-gold mb-2.5">Penn Men&apos;s Golf</p>
            <h2
              className="text-xl sm:text-2xl font-medium text-white leading-tight mb-2 font-heading"
            >
              {PENN_GOLF_TRADITION.title}
            </h2>
            <p className="text-[11px] text-white/70 max-w-lg leading-relaxed">{PENN_GOLF_TRADITION.subtitle}</p>
          </div>
        </div>
        {/* Penn red ribbon */}
        <div className="h-[3px] bg-gradient-to-r from-[#990000] via-[#bb0000] to-[#990000]" />
        {/* Plaque grid on parchment — NUMBER FIRST */}
        <div className="bg-[#fdfcf9] grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-[rgba(180,168,150,0.3)]">
          {PENN_GOLF_TRADITION.achievements.map((a) => (
            <div key={a.label} className="px-5 sm:px-6 py-6 sm:py-7 hover:-translate-y-px hover:bg-white transition-all duration-150 cursor-default">
              <CountUpValue
                value={a.value}
                className={`font-heading text-[3rem] sm:text-[3.5rem] font-light leading-none mb-1 ${a.featured ? 'text-[#990000]' : 'text-[#0a1628]'}`}
              />
              <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-ink-muted mb-2 leading-tight">{a.label}</p>
              <p className="text-[11px] font-medium text-[#3d4a5c] mb-1.5 leading-snug">{a.detail}</p>
              <p className="text-[10px] text-ink-muted leading-relaxed">{a.description}</p>
            </div>
          ))}
        </div>
        <div className="bg-[#fdfcf9] px-5 sm:px-6 py-3 border-t border-[rgba(180,168,150,0.3)] flex items-center justify-end">
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
    ? (deriveClassLabel(profile.classYearEstimate) ?? profile.classLabel ?? null)
    : profile.rosterYearsLabel !== '—'
      ? `Penn Golf ${profile.rosterYearsLabel}`
      : null
  const careerLine = profile.career?.currentRole && profile.career?.currentCompany
    ? `${profile.career.currentRole} · ${profile.career.currentCompany}`
    : profile.career?.currentRole ?? profile.career?.currentCompany ?? null

  return (
    <AlumniCard
      variant="mini"
      href={`/player/alumni/${profile.personId}?teamSlug=${teamSlug}`}
      name={profile.canonicalName}
      subline={subline}
      careerLine={careerLine}
      isCurrentPlayer={isCurrentPlayer}
      badges={profile.badges}
    />
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
        className="text-[#0a1628] text-[15px] leading-snug pl-2 font-heading"
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
  signedIn?: boolean
  pendingClaim?: boolean
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

  const [profiles, setProfiles] = useState<PlayerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [newsItems, setNewsItems] = useState<TeamNewsItem[]>([])
  const [onboarding, setOnboarding] = useState<OnboardingStatus | null>(null)
  const [billingStatus, setBillingStatus] = useState<{
    signedIn: boolean
    subscribed: boolean
    configured: boolean
  } | null>(null)
  const [currentSpotlight, setCurrentSpotlight] = useState<AlumniSpotlight | null>(null)
  const [membersOn, setMembersOn] = useState<number | null>(null)

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

    fetch('/api/spotlights')
      .then(r => (r.ok ? r.json() : { spotlight: null }))
      .then(d => setCurrentSpotlight(d.spotlight ?? null))
      .catch(() => {})

    fetch('/api/clubhouse/activity')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.totals?.membersClaimed != null) {
          setMembersOn(d.totals.membersClaimed as number)
        }
      })
      .catch(() => {})
  }, [teamSlug])

  return (
    <div className="min-h-screen bg-[#fbf9f6]">
      {/* Header — the foyer. The clubhouse hero photo carries the visual
          weight; a navy gradient keeps the headline legible over it. */}
      <div className="relative overflow-hidden px-6 sm:px-8 pt-16 pb-16 sm:pt-24 sm:pb-20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/clubhouse-hero.jpg"
          alt="The Penn Golf clubhouse at golden hour, Philadelphia skyline behind the 18th green"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(100deg, rgba(6,14,26,0.94) 0%, rgba(10,22,40,0.82) 42%, rgba(10,22,40,0.45) 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(6,14,26,0.7), transparent 55%)' }}
        />
        <div className="max-w-[1320px] mx-auto relative">
          <motion.p
            className="eyebrow text-gold mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            Penn Golf · Clubhouse · Est. 1899
          </motion.p>
          <motion.h1
            className="font-heading text-white text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight leading-tight max-w-2xl"
            style={{ textShadow: '0 2px 20px rgba(6,14,26,0.5)' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, ...settle }}
          >
            Welcome to the Penn Golf Clubhouse.
          </motion.h1>
          <motion.span
            className="block h-px bg-gold mt-4 w-16 origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.18, ...settle }}
          />
          <motion.p
            className="text-white/70 text-sm sm:text-base mt-3 max-w-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.14, duration: 0.3 }}
          >
            {welcomeLine}
          </motion.p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 sm:px-8">
        {welcomeName && (
          <div className="-mt-5 relative z-10">
            <WelcomeBanner name={welcomeName} />
          </div>
        )}

        {/* Signed OUT: an unconditional way in. Data-independent by design —
            every tease below hides itself when the store is empty. */}
        {onboarding && !onboarding.linked && onboarding.signedIn === false && (
          <div className="-mt-5 relative z-10 mb-6 bg-[#0a1628] text-white rounded-2xl px-6 py-6 border border-[#c8a84b]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c8a84b] mb-1.5">
                {BOOK_PROOF.members} in the book · {BOOK_PROOF.earliestYear}–{BOOK_PROOF.latestYear} · {BOOK_PROOF.generations} generations
              </p>
              <p className="text-white text-lg sm:text-xl font-medium font-heading leading-snug">
                Your name is already here.
              </p>
              <p className="text-white/70 text-[13px] mt-1 max-w-xl leading-relaxed">
                Find your card and claim it to see the rest of the Clubhouse. {APPROVAL_PROMISE}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 flex-shrink-0">
              <Link
                href="/account/setup"
                className="inline-flex items-center justify-center bg-[#c8a84b] hover:bg-[#b8973b] text-[#0a1628] text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-3 rounded-lg transition-colors whitespace-nowrap"
              >
                Claim your card
              </Link>
              <Link
                href="/launch"
                className="inline-flex items-center justify-center border border-white/30 hover:border-white/60 text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-3 rounded-lg transition-colors whitespace-nowrap"
              >
                Watch the film
              </Link>
            </div>
          </div>
        )}

        {/* Signed in but not yet approved: one clear line about where they
            stand, instead of a wall of locked panels. */}
        {onboarding && !onboarding.linked && onboarding.signedIn && (
          <div className="-mt-5 relative z-10 mb-6 bg-[#0a1628] text-white rounded-2xl px-6 py-5 border border-[#c8a84b]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {onboarding.pendingClaim ? (
              <>
                <div>
                  <p className="text-sm font-semibold text-[#c8a84b] uppercase tracking-[0.14em]">
                    Claim pending
                  </p>
                  <p className="text-sm text-white/80 mt-1">
                    Every claim is reviewed by hand — usually within a day.
                    You&rsquo;ll get an email the moment you&rsquo;re in.
                  </p>
                </div>
                <Link
                  href="/member-book"
                  className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c8a84b] hover:underline"
                >
                  Browse the Member Book &rarr;
                </Link>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm font-semibold text-[#c8a84b] uppercase tracking-[0.14em]">
                    One step left
                  </p>
                  <p className="text-sm text-white/80 mt-1">
                    Find your name and claim your card — the captain approves every
                    member by hand.
                  </p>
                </div>
                <Link
                  href="/account/setup"
                  className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c8a84b] hover:underline"
                >
                  Claim your card &rarr;
                </Link>
              </>
            )}
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
                  className="text-white text-base sm:text-lg font-medium leading-snug font-heading"
                >
                  Membership keeps the Clubhouse running and 70% goes to Penn Men&rsquo;s Golf.
                </p>
                <p className="text-[12.5px] text-white/75 mt-1">
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

        {/* Activation panel — shown to linked members; points them at
            the three highest-value next steps and signals the network is alive. */}
        {onboarding?.linked && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={revealViewport}
            transition={settle}
            className="mb-8"
          >
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <div className="px-5 pt-5 pb-4 border-b border-[rgba(180,168,150,0.25)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#2d6a4f] mb-1">
                  You&rsquo;re in
                </p>
                <p
                  className="text-[#0a1628] text-base font-medium leading-snug font-heading"
                >
                  Three places to start.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[rgba(180,168,150,0.25)]">
                <Link
                  href="/member-book"
                  className="group px-5 py-4 flex items-start gap-3 hover:bg-[#fbf9f6] transition-colors"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0a1628]/8 flex items-center justify-center mt-0.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#0a1628]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#0a1628] leading-snug mb-0.5">Your class</p>
                    <p className="text-[11.5px] text-ink-muted leading-snug">Find teammates from your years in the Member Book.</p>
                    <span className="text-[10.5px] font-semibold text-[#990000] group-hover:underline mt-1.5 inline-block">Browse &rarr;</span>
                  </div>
                </Link>
                <Link
                  href="/member-map"
                  className="group px-5 py-4 flex items-start gap-3 hover:bg-[#fbf9f6] transition-colors"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0a1628]/8 flex items-center justify-center mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0a1628]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#0a1628] leading-snug mb-0.5">Who&rsquo;s near you</p>
                    <p className="text-[11.5px] text-ink-muted leading-snug">See where Penn Golf members are living and playing now.</p>
                    <span className="text-[10.5px] font-semibold text-[#990000] group-hover:underline mt-1.5 inline-block">Open the map &rarr;</span>
                  </div>
                </Link>
                <Link
                  href="/meet-the-team"
                  className="group px-5 py-4 flex items-start gap-3 hover:bg-[#fbf9f6] transition-colors"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0a1628]/8 flex items-center justify-center mt-0.5">
                    <Users className="w-3.5 h-3.5 text-[#0a1628]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#0a1628] leading-snug mb-0.5">The current team</p>
                    <p className="text-[11.5px] text-ink-muted leading-snug">The guys playing now. They know who you are.</p>
                    <span className="text-[10.5px] font-semibold text-[#990000] group-hover:underline mt-1.5 inline-block">Meet the team &rarr;</span>
                  </div>
                </Link>
              </div>
              {membersOn != null && (
                <div className="px-5 py-3 border-t border-[rgba(180,168,150,0.25)] flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-[11.5px] text-ink-muted">
                    <span className="font-semibold text-[#0a1628]">{membersOn}</span>
                    {' '}
                    {membersOn === 1 ? 'alum' : 'alumni'} in the Clubhouse
                    {membersOn < 50 && (
                      <> &mdash; help us reach the first 50</>
                    )}
                  </p>
                  {membersOn < 50 && (
                    <Link
                      href="/invite"
                      className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#2d6a4f] hover:underline whitespace-nowrap"
                    >
                      Invite teammates &rarr;
                    </Link>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Scotland Tour — October 2026 */}
        <div className="mb-10 space-y-3">
          <NextEventChip />
          <ScotlandTourBanner variant="featured" />
        </div>

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
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={revealViewport}
                  transition={{ ...settle, delay: i * 0.05 }}
                >
                  {/* "Locker door" — double keyline (border + inset ring),
                      brass roundel, 0.3s lift on hover. No bounce. */}
                  <Link
                    href={room.href}
                    className="relative block bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5 h-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
                    style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
                  >
                    <span className="pointer-events-none absolute inset-1 rounded-lg border border-[rgba(180,168,150,0.22)] group-hover:border-gold/35 transition-colors duration-300" />
                    <div className="relative w-9 h-9 rounded-full flex items-center justify-center mb-3 bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/40">
                      <Icon className="w-4 h-4 text-gold-ink" />
                    </div>
                    <p className="relative font-semibold text-[#0a1628] text-base mb-1.5">{room.label}</p>
                    <p className="relative text-xs text-[#48505e] leading-relaxed mb-4">{room.description}</p>
                    <span className="relative text-xs font-semibold text-[#990000] group-hover:underline">
                      {room.cta} &rarr;
                    </span>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Alumni Spotlight compact card — only when one exists */}
        {currentSpotlight && <SpotlightCard spotlight={currentSpotlight} />}

        {/* This Week in the Clubhouse — moved up so what's HAPPENING this
            week sits near the top of the page, not at the bottom. */}
        <ThisWeekPanel teamSlug={teamSlug} approved={!!onboarding?.linked} />

        {/* On the Loop — Penn Golf passing through. Tease for non-members. */}
        <OnTheLoopStrip approved={!!onboarding?.linked} />

        {/* Your Era — the guys whose roster years overlapped yours.
            Members only; hidden entirely when there's no overlap data. */}
        <YourEraSection approved={!!onboarding?.linked} />

        {/* Clubhouse Activity Feed. Tease for non-members. */}
        <ClubhouseActivityFeed approved={!!onboarding?.linked} />

        {/* Member Book preview panel */}
        {!loading && profiles.length > 0 && (() => {
          const currentPlayers = profiles.filter(p => p.memberRole === 'current_player')
          const alumni = profiles.filter(p => p.memberRole !== 'current_player')
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={revealViewport}
              transition={settle}
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
                    <p className="text-xs text-ink-muted mt-0.5">
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
                    <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-3">
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
                    <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-3">
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
                            className="flex-shrink-0 w-[140px] bg-[#fbf9f6] border border-[rgba(180,168,150,0.4)] rounded-lg p-3 flex flex-col items-center justify-center hover:bg-white transition-colors"
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

        {/* Your Requests — members only; anonymous visitors have none to see */}
        <div className="pb-10" hidden={!onboarding?.linked}>
          <div className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-5 py-4 flex items-center justify-between"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}>
            <div>
              <p className="text-sm font-semibold text-[#0a1628]">Your Requests</p>
              <p className="text-xs text-ink-muted mt-0.5">See the status of requests you&rsquo;ve sent.</p>
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
    <div className="min-h-screen bg-[#fbf9f6] animate-pulse">
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
