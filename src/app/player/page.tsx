'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageSquare, Users, Flag, CalendarDays } from 'lucide-react'

interface PlayerProfile {
  personId: string
  canonicalName: string
  firstName?: string
  lastName?: string
  classLabel?: string
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
    description: 'Get career advice, industry insight, or guidance from alumni who have been in your shoes.',
    href: '/player/search',
    icon: MessageSquare,
    cta: 'Find someone to ask',
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

function ProfileCard({ profile, index }: { profile: PlayerProfile; index: number }) {
  const careerLine =
    profile.career?.currentRole && profile.career?.currentCompany
      ? `${profile.career.currentRole} at ${profile.career.currentCompany}`
      : profile.career?.currentRole ?? profile.career?.currentCompany ?? null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: Math.min(index * 0.04, 0.4) }}
    >
      <Link
        href={`/player/alumni/${profile.personId}`}
        className="block bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-4 hover:shadow-md transition-shadow"
        style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
      >
        <p className="font-semibold text-[#0a1628] text-sm leading-snug mb-1">{profile.canonicalName}</p>
        <div className="space-y-0.5">
          {(profile.classLabel || profile.rosterYearsLabel !== '—') && (
            <p className="text-xs text-[#8a7f70]">
              {[profile.classLabel, profile.rosterYearsLabel !== '—' ? `Penn Golf ${profile.rosterYearsLabel}` : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          {profile.hometown && <p className="text-xs text-[#8a7f70]">{profile.hometown}</p>}
          {careerLine && <p className="text-xs text-[#4a5568] pt-0.5">{careerLine}</p>}
        </div>
        <span className="text-xs font-medium text-[#990000] mt-3 block">View profile &rarr;</span>
      </Link>
    </motion.div>
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

        {/* Members section */}
        {loading ? (
          <div className="py-16 text-center">
            <p className="text-sm text-[#8a7f70]">Loading members...</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="py-16 text-center" data-testid="network-empty-state">
            <p className="text-base font-semibold text-[#0a1628] mb-2">No members published yet</p>
            <p className="text-sm text-[#8a7f70] max-w-sm mx-auto">
              Profiles are approved by Penn Golf captains before they appear here.
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.5 }}
            className="pb-16"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#0a1628]">
                Members ({profiles.length})
              </h2>
              <Link href="/player/search" className="text-xs text-[#990000] hover:underline font-medium">
                Browse all &rarr;
              </Link>
            </div>
            <div
              data-testid="network-alumni-grid"
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {profiles.slice(0, 9).map((p, i) => (
                <ProfileCard key={p.personId} profile={p} index={i} />
              ))}
            </div>
            {profiles.length > 9 && (
              <div className="mt-6 text-center">
                <Link
                  href="/player/search"
                  className="text-sm font-semibold text-[#990000] hover:underline"
                >
                  See all {profiles.length} members &rarr;
                </Link>
              </div>
            )}
          </motion.div>
        )}
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
