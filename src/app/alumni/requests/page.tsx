'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

interface AlumniProfile {
  personId: string
  canonicalName: string
  classLabel?: string
}

interface AlumniRequest {
  id: string
  fromName: string
  purposeKey: string
  purposeLabel: string
  message: string
  status: 'requested' | 'seen' | 'responded' | 'closed'
  createdAt: string
}

const STATUS_LABEL: Record<string, string> = {
  requested: 'New',
  seen: 'Seen',
  responded: 'Responded',
  closed: 'Closed',
}

const STATUS_COLOR: Record<string, string> = {
  requested: 'bg-[#990000]/10 text-[#990000]',
  seen: 'bg-amber-100 text-amber-800',
  responded: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-gray-100 text-gray-500',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function AlumniRequestsInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const teamSlug = searchParams.get('teamSlug') ?? 'penn-mens-golf'
  const personId = searchParams.get('personId') ?? ''

  const [profiles, setProfiles] = useState<AlumniProfile[]>([])
  const [requests, setRequests] = useState<AlumniRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (personId) return
    fetch(`/api/player/profiles?teamSlug=${teamSlug}`)
      .then(r => r.json())
      .then(data => setProfiles(data.profiles ?? []))
      .catch(() => setProfiles([]))
  }, [teamSlug, personId])

  useEffect(() => {
    if (!personId) return
    setLoading(true)
    setError(null)
    fetch(`/api/alumni/requests?teamSlug=${teamSlug}&personId=${personId}`)
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load (${r.status})`)
        return r.json()
      })
      .then(data => {
        setRequests(data.requests ?? [])
        setLoading(false)
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to load requests')
        setLoading(false)
      })
  }, [teamSlug, personId])

  async function updateStatus(requestId: string, status: AlumniRequest['status']) {
    setUpdatingId(requestId)
    try {
      const res = await fetch('/api/alumni/requests/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamSlug, personId, requestId, status }),
      })
      if (!res.ok) throw new Error('Update failed')
      setRequests(prev =>
        prev.map(r => (r.id === requestId ? { ...r, status } : r)),
      )
    } catch {
      // silently fail
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-8 pt-10 pb-14">
        <div className="max-w-[860px] mx-auto">
          <Link
            href={`/alumni?teamSlug=${teamSlug}`}
            className="text-xs text-gray-400 hover:text-gray-200 mb-3 inline-block"
          >
            &larr; Alumni Mode
          </Link>
          <h1 className="text-white text-2xl font-semibold tracking-tight mt-1">
            Player requests
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            When players want to connect, their requests appear here.
          </p>
        </div>
      </div>

      <div className="max-w-[860px] mx-auto px-8 pb-16">
        <div className="-mt-5 relative z-10 space-y-4">

          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-5 py-3"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
          >
            <p className="text-xs text-[#8a7f70]">
              Dev mode — in production, alumni will access this through a private login link.
            </p>
          </div>

          {!personId && (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-4">
                Select your profile
              </p>
              {profiles.length === 0 ? (
                <p className="text-sm text-[#8a7f70]">No published alumni found.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {profiles.map(p => (
                    <button
                      key={p.personId}
                      type="button"
                      onClick={() =>
                        router.push(`/alumni/requests?teamSlug=${teamSlug}&personId=${p.personId}`)
                      }
                      className="text-left px-4 py-3 rounded-lg border border-[rgba(180,168,150,0.4)] hover:border-[#0a1628] hover:bg-[#f8f5f0] transition-colors"
                    >
                      <p className="text-sm font-semibold text-[#0a1628]">{p.canonicalName}</p>
                      {p.classLabel && (
                        <p className="text-xs text-[#8a7f70] mt-0.5">{p.classLabel}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {personId && (
            <>
              {loading && (
                <div
                  className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-8 text-center"
                  style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
                >
                  <p className="text-sm text-[#8a7f70]">Loading requests...</p>
                </div>
              )}

              {error && (
                <div
                  className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
                  style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
                >
                  <p className="text-sm text-[#990000]">{error}</p>
                </div>
              )}

              {!loading && !error && requests.length === 0 && (
                <div
                  className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-10 text-center"
                  style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
                >
                  <p className="text-base font-semibold text-[#0a1628] mb-2">No requests yet</p>
                  <p className="text-sm text-[#8a7f70] max-w-sm mx-auto">
                    When players reach out through Player Mode, you will see their requests here.
                  </p>
                </div>
              )}

              {!loading && requests.map(req => (
                <div
                  key={req.id}
                  className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
                  style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#0a1628]">{req.fromName}</p>
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[req.status] ?? 'bg-gray-100 text-gray-500'}`}
                        >
                          {STATUS_LABEL[req.status] ?? req.status}
                        </span>
                        <span className="text-xs text-[#8a7f70]">{req.purposeLabel}</span>
                      </div>
                      <p className="text-xs text-[#8a7f70] mt-0.5">{formatDate(req.createdAt)}</p>
                      <p className="text-sm text-[#2d3748] mt-3 leading-relaxed">{req.message}</p>
                    </div>
                  </div>

                  {req.status !== 'closed' && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[rgba(180,168,150,0.25)]">
                      {req.status === 'requested' && (
                        <button
                          type="button"
                          disabled={updatingId === req.id}
                          onClick={() => updateStatus(req.id, 'seen')}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[rgba(180,168,150,0.5)] hover:border-[#0a1628] text-[#0a1628] transition-colors disabled:opacity-50"
                        >
                          Mark seen
                        </button>
                      )}
                      {(req.status === 'requested' || req.status === 'seen') && (
                        <button
                          type="button"
                          disabled={updatingId === req.id}
                          onClick={() => updateStatus(req.id, 'responded')}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[rgba(180,168,150,0.5)] hover:border-[#0a1628] text-[#0a1628] transition-colors disabled:opacity-50"
                        >
                          Mark responded
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={updatingId === req.id}
                        onClick={() => updateStatus(req.id, 'closed')}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[rgba(180,168,150,0.5)] hover:border-[#8a7f70] text-[#8a7f70] transition-colors disabled:opacity-50"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AlumniRequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f5f0] py-20 text-center">
          <p className="text-sm text-[#8a7f70]">Loading...</p>
        </div>
      }
    >
      <AlumniRequestsInner />
    </Suspense>
  )
}
