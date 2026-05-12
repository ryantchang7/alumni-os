'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface PublishedProfile {
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
  publishedAt: string
  publishedByRole: string
  career?: {
    currentRole?: string
    currentCompany?: string
    city?: string
  }
}

function NetworkAlumniInner() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const teamSlug = searchParams.get('teamSlug') ?? 'penn-mens-golf'

  const [profile, setProfile] = useState<PublishedProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/network/profiles/${id}?teamSlug=${teamSlug}`)
      .then(r => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null }
        return r.json()
      })
      .then(data => {
        if (!data) return
        setProfile(data.profile)
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [id, teamSlug])

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <p className="text-sm text-[#8a7f70]">Loading profile...</p>
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-[#0a1628] mb-2">Profile not found</p>
          <p className="text-sm text-[#8a7f70] mb-4">
            This profile may not be published yet or does not exist.
          </p>
          <Link href={`/network/search?teamSlug=${teamSlug}`} className="text-sm text-[#990000] hover:underline">
            &larr; Back to Alumni
          </Link>
        </div>
      </div>
    )
  }

  const rosterLabel =
    profile.rosterYearsLabel !== '—' ? `Penn Golf ${profile.rosterYearsLabel}` : 'Penn Golf'

  return (
    <div>
      <div className="bg-[#0a1628] border-b border-white/10">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-4 text-xs">
            <Link href={`/network/search?teamSlug=${teamSlug}`} className="text-gray-400 hover:text-gray-200 transition-colors">
              &larr; Alumni
            </Link>
          </div>
          <h1 className="text-white text-xl font-semibold">{profile.canonicalName}</h1>
          <p className="text-gray-400 text-sm mt-1">{rosterLabel}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-300 border border-emerald-700/40">
              Verified by Penn Golf
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-6 mb-6"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}>
          <h2 className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wide mb-4">Profile</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-[#8a7f70] mb-0.5">Name</dt>
              <dd className="font-medium text-[#0a1628]">{profile.canonicalName}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#8a7f70] mb-0.5">Penn Golf</dt>
              <dd className="font-medium text-[#0a1628]">{rosterLabel}</dd>
            </div>
            {profile.classLabel && (
              <div>
                <dt className="text-xs text-[#8a7f70] mb-0.5">Class</dt>
                <dd className="font-medium text-[#0a1628]">{profile.classLabel}</dd>
              </div>
            )}
            {profile.hometown && (
              <div>
                <dt className="text-xs text-[#8a7f70] mb-0.5">Hometown</dt>
                <dd className="font-medium text-[#0a1628]">{profile.hometown}</dd>
              </div>
            )}
            {profile.highSchool && (
              <div>
                <dt className="text-xs text-[#8a7f70] mb-0.5">High School</dt>
                <dd className="font-medium text-[#0a1628]">{profile.highSchool}</dd>
              </div>
            )}
            {profile.career && (profile.career.currentRole || profile.career.currentCompany) && (
              <>
                {profile.career.currentRole && (
                  <div>
                    <dt className="text-xs text-[#8a7f70] mb-0.5">Current Role</dt>
                    <dd className="font-medium text-[#0a1628]">{profile.career.currentRole}</dd>
                  </div>
                )}
                {profile.career.currentCompany && (
                  <div>
                    <dt className="text-xs text-[#8a7f70] mb-0.5">Company</dt>
                    <dd className="font-medium text-[#0a1628]">{profile.career.currentCompany}</dd>
                  </div>
                )}
                {profile.career.city && (
                  <div>
                    <dt className="text-xs text-[#8a7f70] mb-0.5">Location</dt>
                    <dd className="font-medium text-[#0a1628]">{profile.career.city}</dd>
                  </div>
                )}
              </>
            )}
          </dl>
        </div>

        <Link
          href={`/network/outreach/${profile.personId}?teamSlug=${teamSlug}`}
          className="inline-block bg-[#0a1628] hover:bg-[#112240] text-white text-sm font-semibold px-5 py-2.5 rounded-md transition-colors"
        >
          Draft outreach &rarr;
        </Link>
      </div>
    </div>
  )
}

export default function NetworkAlumniPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] flex items-center justify-center"><p className="text-sm text-[#8a7f70]">Loading...</p></div>}>
      <NetworkAlumniInner />
    </Suspense>
  )
}
