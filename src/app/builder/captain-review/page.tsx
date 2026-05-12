'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface AlumniProfile {
  personId: string
  canonicalName: string
  classLabel?: string
  rosterStartYear?: number
  rosterEndYear?: number
  rosterYearsLabel: string
  hometown?: string
  confidence: number
  enrichmentStatus?: string
  publishedToNetwork?: boolean
}

interface ProfilesResponse {
  profiles: AlumniProfile[]
}

function CaptainReviewInner() {
  const searchParams = useSearchParams()
  const teamSlug = searchParams.get('teamSlug') ?? 'penn-mens-golf'

  const [profiles, setProfiles] = useState<AlumniProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [publishedSet, setPublishedSet] = useState<Set<string>>(new Set())
  const [publishError, setPublishError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/alumni/profiles?teamSlug=${teamSlug}`)
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load profiles (${r.status})`)
        return r.json()
      })
      .then((data: ProfilesResponse) => {
        setProfiles(data.profiles ?? [])
        const alreadyPublished = new Set(
          (data.profiles ?? [])
            .filter((p: AlumniProfile) => p.publishedToNetwork)
            .map((p: AlumniProfile) => p.personId),
        )
        setPublishedSet(alreadyPublished)
        setLoading(false)
      })
      .catch(err => {
        setFetchError(err instanceof Error ? err.message : 'Failed to load profiles')
        setLoading(false)
      })
  }, [teamSlug])

  async function handlePublish(personId: string) {
    setPublishing(personId)
    setPublishError(null)
    try {
      const res = await fetch('/api/network/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamSlug, personId, role: 'captain' }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setPublishError((body as { error?: string }).error ?? `Failed (${res.status})`)
      } else {
        setPublishedSet(prev => new Set([...prev, personId]))
      }
    } catch {
      setPublishError('Network error')
    } finally {
      setPublishing(null)
    }
  }

  async function handleUnpublish(personId: string) {
    setPublishing(personId)
    setPublishError(null)
    try {
      const res = await fetch('/api/network/unpublish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamSlug, personId, role: 'captain' }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setPublishError((body as { error?: string }).error ?? `Failed (${res.status})`)
      } else {
        setPublishedSet(prev => {
          const next = new Set(prev)
          next.delete(personId)
          return next
        })
      }
    } catch {
      setPublishError('Network error')
    } finally {
      setPublishing(null)
    }
  }

  const publishedCount = publishedSet.size
  const totalCount = profiles.length

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <div className="flex items-center gap-3 mb-3 text-xs">
            <Link href={`/builder/agent?teamSlug=${teamSlug}`} className="text-gray-400 hover:text-gray-200 transition-colors">
              &larr; AI Builder
            </Link>
          </div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Captain Review</p>
          <h1 data-testid="captain-review-title" className="text-white text-2xl font-semibold tracking-tight">
            Approve profiles for the Player Network
          </h1>
          <p className="text-gray-400 text-sm mt-2 max-w-xl">
            Review alumni in the graph and publish verified profiles to the Penn Golf Network.
            Players can only see published profiles.
          </p>
          {totalCount > 0 && (
            <p className="text-gray-300 text-sm mt-3">
              <span className="font-semibold text-white">{publishedCount}</span> of {totalCount} profiles published to network
            </p>
          )}
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-8 py-8">
        {publishError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">{publishError}</p>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center">
            <p className="text-sm text-[#8a7f70]">Loading graph people...</p>
          </div>
        ) : fetchError ? (
          <div className="py-20 text-center">
            <p className="text-base font-semibold text-[#990000] mb-2">Failed to load people</p>
            <p className="text-sm text-[#8a7f70]">{fetchError}</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-base font-semibold text-[#0a1628] mb-2">No people in the graph yet</p>
            <p className="text-sm text-[#8a7f70] mb-6">
              Use the AI Builder to extract and add people to the graph first.
            </p>
            <Link
              href={`/builder/agent?teamSlug=${teamSlug}`}
              className="text-sm font-medium bg-[#0a1628] text-white px-4 py-2 rounded hover:bg-[#112240] transition-colors"
            >
              Open AI Builder
            </Link>
          </div>
        ) : (
          <div data-testid="captain-review-list" className="space-y-3">
            {profiles.map(profile => {
              const isPublished = publishedSet.has(profile.personId)
              const isLoading = publishing === profile.personId
              return (
                <div
                  key={profile.personId}
                  data-testid={`captain-review-row-${profile.personId}`}
                  className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-4 flex items-center justify-between gap-4"
                  style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-[#0a1628] text-sm">{profile.canonicalName}</span>
                      {isPublished && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          Published
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#8a7f70]">
                      {profile.rosterYearsLabel !== '—' && (
                        <span>Penn Golf {profile.rosterYearsLabel}</span>
                      )}
                      {profile.classLabel && <span>{profile.classLabel}</span>}
                      {profile.hometown && <span>{profile.hometown}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isPublished ? (
                      <button
                        data-testid={`unpublish-btn-${profile.personId}`}
                        onClick={() => handleUnpublish(profile.personId)}
                        disabled={isLoading}
                        className="text-xs font-medium px-3 py-1.5 rounded border border-[rgba(180,168,150,0.5)] text-[#8a7f70] hover:text-[#0a1628] hover:border-[#0a1628]/30 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Saving...' : 'Unpublish'}
                      </button>
                    ) : (
                      <button
                        data-testid={`publish-btn-${profile.personId}`}
                        onClick={() => handlePublish(profile.personId)}
                        disabled={isLoading}
                        className="text-xs font-medium px-3 py-1.5 rounded bg-[#0a1628] text-white hover:bg-[#112240] transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Publishing...' : 'Publish to Network'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {profiles.length > 0 && publishedCount > 0 && (
          <div className="mt-8 pt-6 border-t border-[rgba(180,168,150,0.3)]">
            <Link
              href={`/network/search?teamSlug=${teamSlug}`}
              data-testid="view-network-link"
              className="inline-block text-sm font-medium bg-[#990000] hover:bg-[#b30000] text-white px-5 py-2.5 rounded-md transition-colors"
            >
              View Player Network &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CaptainReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center"><p className="text-sm text-[#8a7f70]">Loading...</p></div>}>
      <CaptainReviewInner />
    </Suspense>
  )
}
