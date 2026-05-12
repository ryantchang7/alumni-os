'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search, Users } from 'lucide-react'
import { Suspense } from 'react'

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

const springTransition = {
  type: 'spring' as const,
  stiffness: 120,
  damping: 22,
  mass: 0.8,
}

function ProfileCard({ profile }: { profile: PlayerProfile }) {
  const careerLine =
    profile.career?.currentRole && profile.career?.currentCompany
      ? `${profile.career.currentRole} at ${profile.career.currentCompany}`
      : profile.career?.currentRole ?? profile.career?.currentCompany ?? null

  return (
    <Link
      href={`/player/alumni/${profile.personId}`}
      className="block bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-4 hover:shadow-md transition-shadow"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
    >
      <div className="mb-2">
        <span className="font-semibold text-[#0a1628] text-sm leading-snug">
          {profile.canonicalName}
        </span>
      </div>
      <div className="space-y-0.5">
        {(profile.classLabel || profile.rosterYearsLabel !== '—') && (
          <p className="text-xs text-[#8a7f70]">
            {[
              profile.classLabel,
              profile.rosterYearsLabel !== '—' ? `Penn Golf ${profile.rosterYearsLabel}` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
        {profile.hometown && <p className="text-xs text-[#8a7f70]">{profile.hometown}</p>}
        {careerLine && <p className="text-xs text-[#4a5568] pt-0.5">{careerLine}</p>}
      </div>
      <span className="text-xs font-medium text-[#990000] mt-3 block">View profile &rarr;</span>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-20" data-testid="network-empty-state">
      <div className="w-12 h-12 rounded-full bg-[#f0ece5] flex items-center justify-center mx-auto mb-4">
        <Users className="w-5 h-5 text-[#8a7f70]" />
      </div>
      <p className="text-base font-semibold text-[#0a1628] mb-2">No alumni published yet</p>
      <p className="text-sm text-[#8a7f70] max-w-sm mx-auto">
        Profiles are approved by Penn Golf captains or staff before they appear here.
      </p>
    </div>
  )
}

function PlayerDashboardInner() {
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
      <div className="bg-[#0a1628] px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Penn Golf Network</p>
          <h1 className="text-white text-3xl font-semibold tracking-tight">Penn Golf Alumni</h1>
          <p className="text-gray-300 text-base mt-2 max-w-xl">
            Profiles are approved by Penn Golf captains or staff before they appear here.
          </p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-8">
        <div className="-mt-5 relative z-10 mb-10">
          <Link
            href="/player/search"
            className="inline-flex items-center gap-2 bg-white border border-[rgba(180,168,150,0.35)] rounded-lg px-4 py-2.5 text-sm text-[#0a1628] hover:shadow-md transition-shadow"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <Search className="w-4 h-4 text-[#8a7f70]" />
            <span>Search alumni by name, class, or hometown</span>
          </Link>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <p className="text-sm text-[#8a7f70]">Loading alumni...</p>
          </div>
        ) : profiles.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-10 pb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#0a1628] tracking-tight">
                  All Alumni ({profiles.length})
                </h2>
                <Link
                  href="/player/search"
                  className="text-xs text-[#990000] hover:underline font-medium"
                >
                  Search &rarr;
                </Link>
              </div>
              <div
                data-testid="network-alumni-grid"
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {profiles.map((p, i) => (
                  <motion.div
                    key={p.personId}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springTransition, delay: Math.min(i * 0.04, 0.4) }}
                  >
                    <ProfileCard profile={p} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PlayerPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-[#8a7f70]">Loading alumni...</div>
      }
    >
      <PlayerDashboardInner />
    </Suspense>
  )
}
