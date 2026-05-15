'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageSquare, Users, Flag, CalendarDays, MapPin, Calendar } from 'lucide-react'

interface GatheringSnippet {
  id: string
  type: 'round' | 'coffee' | 'drinks' | 'dinner' | 'event'
  title: string
  dateText: string
  city?: string
  state?: string
  venue?: string
  status: 'open' | 'full' | 'closed'
}

const GATHERING_HREF: Record<GatheringSnippet['type'], string> = {
  round: '/the-course',
  coffee: '/19th-hole',
  drinks: '/19th-hole',
  dinner: '/19th-hole',
  event: '/events',
}

function ThisWeekPanel({ teamSlug }: { teamSlug: string }) {
  const [gatherings, setGatherings] = useState<GatheringSnippet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/gatherings?teamSlug=${teamSlug}`)
      .then(r => r.ok ? r.json() : { gatherings: [] })
      .then(d => {
        const all: GatheringSnippet[] = d.gatherings ?? []
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
            href={GATHERING_HREF[g.type]}
            className="block bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-4 hover:shadow-md transition-shadow group"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <p className="text-[10px] font-semibold text-[#0a1628] bg-[#0a1628]/8 px-2 py-0.5 rounded-full inline-block mb-2 capitalize">
              {g.type === 'coffee' || g.type === 'drinks' || g.type === 'dinner' ? '19th Hole' : g.type === 'round' ? 'The Course' : 'Event'}
            </p>
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
  memberRole?: 'current_player' | 'alumni'
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
}

const spring = { type: 'spring' as const, stiffness: 120, damping: 22, mass: 0.8 }

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
    href: '/player/search',
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
    description: 'Upcoming alumni events, outings, and team reunions. Stay in the loop.',
    href: '/events',
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
          <span className="flex-shrink-0 text-[9px] font-semibold text-[#2d6a4f] bg-[#2d6a4f]/10 px-1.5 py-0.5 rounded-full">
            Player
          </span>
        )}
      </div>
      {subline && <p className="text-[10px] text-[#8a7f70]">{subline}</p>}
      {careerLine && <p className="text-[10px] text-[#4a5568] mt-0.5 truncate">{careerLine}</p>}
    </Link>
  )
}

function ClubhouseInner() {
  const searchParams = useSearchParams()
  const teamSlug = searchParams.get('teamSlug') ?? 'penn-mens-golf'

  const [profiles, setProfiles] = useState<PlayerProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/player/profiles?teamSlug=${teamSlug}`)
      .then(r => (r.ok ? r.json() : { profiles: [] }))
      .then(data => {
        setProfiles(data.profiles ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [teamSlug])

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Header */}
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <motion.p
            className="text-xs text-gray-500 uppercase tracking-widest mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Penn Golf · Clubhouse
          </motion.p>
          <motion.h1
            className="text-white text-2xl sm:text-3xl font-semibold tracking-tight"
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
            Your direct line to every Penn Golf alumnus. Ask. Meet. Play. Gather.
          </motion.p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 sm:px-8">
        {/* 4 primary rooms */}
        <div className="-mt-5 relative z-10 mb-12">
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
                      {profiles.length} members · {currentPlayers.length} current players · {alumni.length} alumni
                    </p>
                  </div>
                  <Link
                    href={`/player/search?teamSlug=${teamSlug}`}
                    className="text-xs font-semibold text-[#990000] hover:underline whitespace-nowrap"
                  >
                    Browse all &rarr;
                  </Link>
                </div>

                {/* Current players row */}
                {currentPlayers.length > 0 && (
                  <div className="px-5 py-4 border-b border-[rgba(180,168,150,0.2)]">
                    <p className="text-[10px] font-semibold text-[#8a7f70] uppercase tracking-wider mb-3">
                      Current Players
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {currentPlayers.map(p => (
                        <MiniMemberCard key={p.personId} profile={p} teamSlug={teamSlug} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Alumni row */}
                {alumni.length > 0 && (
                  <div className="px-5 py-4">
                    <p className="text-[10px] font-semibold text-[#8a7f70] uppercase tracking-wider mb-3">
                      Alumni
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {alumni.slice(0, 12).map(p => (
                        <MiniMemberCard key={p.personId} profile={p} teamSlug={teamSlug} />
                      ))}
                      {alumni.length > 12 && (
                        <Link
                          href={`/player/search?teamSlug=${teamSlug}`}
                          className="flex-shrink-0 w-[140px] bg-[#f8f5f0] border border-[rgba(180,168,150,0.4)] rounded-lg p-3 flex flex-col items-center justify-center hover:bg-white transition-colors"
                        >
                          <p className="text-xs font-semibold text-[#0a1628]">+{alumni.length - 12} more</p>
                          <p className="text-[10px] text-[#990000] mt-1">View all alumni &rarr;</p>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })()}

        {/* This Week in the Clubhouse */}
        <ThisWeekPanel teamSlug={teamSlug} />

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

export default function PlayerPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-[#8a7f70]">Loading...</div>}>
      <ClubhouseInner />
    </Suspense>
  )
}
