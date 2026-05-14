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
  contextKey?: string
  contextLabel?: string
  additionalContext?: string
  message: string
  status: 'requested' | 'seen' | 'responded' | 'closed'
  createdAt: string
}

const PURPOSE_LABELS: Record<string, string> = {
  career_advice: 'Career advice',
  coffee_chat: 'Coffee chat',
  mentorship: 'Mentorship',
  warm_introduction: 'Warm introduction',
  internship_guidance: 'Internship guidance',
  interview_prep: 'Interview prep',
  golf_round: 'Golf round',
  city_advice: 'City advice',
  drinks_informal: 'Drinks / informal meet',
  general_intro: 'General intro',
  golf_connection: 'Golf connection',
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

function RequestCard({
  req,
  updatingId,
  onUpdate,
}: {
  req: AlumniRequest
  updatingId: string | null
  onUpdate: (id: string, status: AlumniRequest['status']) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const purposeDisplay =
    PURPOSE_LABELS[req.purposeKey] ?? req.purposeLabel ?? req.purposeKey

  return (
    <div
      className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="text-sm font-semibold text-[#0a1628]">{req.fromName}</p>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[req.status] ?? 'bg-gray-100 text-gray-500'}`}
            >
              {STATUS_LABEL[req.status] ?? req.status}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs font-medium text-[#4a5568] bg-[#f5f2ee] border border-[rgba(180,168,150,0.4)] px-2 py-0.5 rounded-full">
              {purposeDisplay}
            </span>
            {req.contextLabel && (
              <span className="text-xs font-medium text-[#4a5568] bg-[#f5f2ee] border border-[rgba(180,168,150,0.4)] px-2 py-0.5 rounded-full">
                {req.contextLabel}
              </span>
            )}
            <span className="text-xs text-[#8a7f70]">{formatDate(req.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Additional context note */}
      {req.additionalContext && (
        <div className="mt-3 px-3 py-2.5 bg-[#f8f5f0] border border-[rgba(180,168,150,0.35)] rounded-lg">
          <p className="text-xs text-[#8a7f70] font-medium mb-0.5 uppercase tracking-wide">Additional context</p>
          <p className="text-xs text-[#2d3748] leading-relaxed">{req.additionalContext}</p>
        </div>
      )}

      {/* Message with expand/collapse */}
      <div className="mt-3">
        <p
          className={`text-sm text-[#2d3748] leading-relaxed whitespace-pre-wrap ${!expanded ? 'line-clamp-3' : ''}`}
        >
          {req.message}
        </p>
        {req.message && req.message.length > 200 && (
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="text-xs text-[#990000] hover:underline mt-1"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Action buttons */}
      {req.status !== 'closed' && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[rgba(180,168,150,0.25)] flex-wrap">
          {req.status === 'requested' && (
            <button
              type="button"
              disabled={updatingId === req.id}
              onClick={() => onUpdate(req.id, 'seen')}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[rgba(180,168,150,0.5)] hover:border-[#0a1628] text-[#0a1628] transition-colors disabled:opacity-50"
            >
              Mark as seen
            </button>
          )}
          {(req.status === 'requested' || req.status === 'seen') && (
            <button
              type="button"
              disabled={updatingId === req.id}
              onClick={() => onUpdate(req.id, 'responded')}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[rgba(180,168,150,0.5)] hover:border-[#0a1628] text-[#0a1628] transition-colors disabled:opacity-50"
            >
              Mark as responded
            </button>
          )}
          <button
            type="button"
            disabled={updatingId === req.id}
            onClick={() => onUpdate(req.id, 'closed')}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[rgba(180,168,150,0.5)] hover:border-[#8a7f70] text-[#8a7f70] transition-colors disabled:opacity-50"
          >
            Close
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              className="text-xs text-[#8a7f70] hover:text-[#0a1628] transition-colors"
            >
              Suggest another alum
            </button>
            <button
              type="button"
              className="text-xs text-[#8a7f70] hover:text-[#0a1628] transition-colors"
            >
              Pass on this one
            </button>
          </div>
        </div>
      )}
    </div>
  )
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
      // silently fail — toast notifications coming soon
    } finally {
      setUpdatingId(null)
    }
  }

  const selectedProfile = profiles.find(p => p.personId === personId)

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
            Your Clubhouse Inbox
          </h1>
          {selectedProfile ? (
            <p className="text-gray-400 text-sm mt-2">
              {selectedProfile.canonicalName}
              {selectedProfile.classLabel ? ` · ${selectedProfile.classLabel}` : ''}
            </p>
          ) : (
            <p className="text-gray-400 text-sm mt-2">
              Select your profile to view requests from current players.
            </p>
          )}
        </div>
      </div>

      <div className="max-w-[860px] mx-auto px-8 pb-16">
        <div className="-mt-5 relative z-10 space-y-4">

          {/* Profile selector */}
          {!personId && (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-4">
                Select your profile to view your inbox
              </p>
              {profiles.length === 0 ? (
                <p className="text-sm text-[#8a7f70]">No published alumni profiles found.</p>
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

          {/* Switch profile link */}
          {personId && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => router.push(`/alumni/requests?teamSlug=${teamSlug}`)}
                className="text-xs text-[#8a7f70] hover:text-[#0a1628] transition-colors"
              >
                Switch profile
              </button>
            </div>
          )}

          {/* Requests list */}
          {personId && (
            <>
              {loading && (
                <div
                  className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-8 text-center"
                  style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
                >
                  <p className="text-sm text-[#8a7f70]">Loading requests…</p>
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
                  <p className="text-base font-semibold text-[#0a1628] mb-2">Your inbox is clear.</p>
                  <p className="text-sm text-[#8a7f70] max-w-sm mx-auto">
                    Requests from current players will appear here once they send them.
                  </p>
                </div>
              )}

              {!loading &&
                requests.map(req => (
                  <RequestCard
                    key={req.id}
                    req={req}
                    updatingId={updatingId}
                    onUpdate={updateStatus}
                  />
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
          <p className="text-sm text-[#8a7f70]">Loading…</p>
        </div>
      }
    >
      <AlumniRequestsInner />
    </Suspense>
  )
}
