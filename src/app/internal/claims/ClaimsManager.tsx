'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ClaimRequest {
  id: string
  memberId: string
  personId?: string
  requesterName: string
  requesterEmail: string
  requesterAccountId?: string
  pennGolfYears?: string
  note?: string
  status: 'pending' | 'approved' | 'declined'
  createdAt: string
  respondedAt?: string
}

const STATUS_STYLES: Record<ClaimRequest['status'], string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-[#2d6a4f]/10 text-[#2d6a4f] border-[#2d6a4f]/25',
  declined: 'bg-[#990000]/8 text-[#990000] border-[#990000]/20',
}

export default function ClaimsManager() {
  const [claims, setClaims] = useState<ClaimRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/profile/claims')
      .then(r => r.ok ? r.json() : { claims: [] })
      .then(d => {
        setClaims(d.claims ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function updateStatus(id: string, status: 'approved' | 'declined') {
    setUpdating(id)
    setError(null)
    try {
      const res = await fetch(`/api/profile/claims/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      setClaims(prev => prev.map(c => c.id === id ? { ...c, ...data.claim } : c))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setUpdating(null)
    }
  }

  const pending = claims.filter(c => c.status === 'pending')
  const resolved = claims.filter(c => c.status !== 'pending')

  if (loading) {
    return <p className="text-sm text-[#8a7f70] py-8 text-center">Loading claims...</p>
  }

  if (claims.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm font-medium text-[#0a1628] mb-1">No profile claim requests yet</p>
        <p className="text-xs text-[#8a7f70]">Requests will appear here when alumni submit them from a profile page.</p>
      </div>
    )
  }

  function ClaimRow({ claim }: { claim: ClaimRequest }) {
    const isPending = claim.status === 'pending'
    const isUpdating = updating === claim.id
    return (
      <div className="border border-[rgba(180,168,150,0.35)] rounded-xl p-5 bg-white" style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-[#0a1628] text-sm">{claim.requesterName}</p>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLES[claim.status]}`}>
                {claim.status}
              </span>
              {claim.requesterAccountId && (
                <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#2d6a4f] bg-[#2d6a4f]/10 border border-[#2d6a4f]/25 px-2 py-0.5 rounded-full">
                  Google verified
                </span>
              )}
            </div>
            <p className="text-xs text-[#8a7f70]">
              <span className="font-mono">{claim.requesterEmail}</span>
            </p>
            {claim.pennGolfYears && (
              <p className="text-xs text-[#4a5568]">Penn Golf years: {claim.pennGolfYears}</p>
            )}
            {claim.note && (
              <p className="text-xs text-[#0a1628] italic mt-1">&ldquo;{claim.note}&rdquo;</p>
            )}
            <div className="flex items-center gap-3 mt-1.5">
              <Link
                href={`/member-book/${encodeURIComponent(claim.memberId)}`}
                target="_blank"
                className="text-xs text-[#990000] hover:underline"
              >
                View Member Book entry &rarr;
              </Link>
              <span className="text-[10px] text-[#8a7f70]">
                {new Date(claim.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          {isPending && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => updateStatus(claim.id, 'approved')}
                disabled={isUpdating}
                className="text-xs font-semibold bg-[#2d6a4f] hover:bg-[#2d6a4f]/90 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                {isUpdating ? '...' : 'Approve'}
              </button>
              <button
                onClick={() => updateStatus(claim.id, 'declined')}
                disabled={isUpdating}
                className="text-xs font-medium text-[#8a7f70] hover:text-[#0a1628] border border-[rgba(180,168,150,0.5)] hover:border-[#0a1628]/30 px-3 py-1.5 rounded-lg transition-colors"
              >
                Decline
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-xs text-[#990000] bg-[#990000]/5 border border-[#990000]/15 rounded-lg px-4 py-2">{error}</p>
      )}

      {pending.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-[#0a1628]">Pending</h2>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              {pending.length}
            </span>
          </div>
          <div className="space-y-3">
            {pending.map(c => <ClaimRow key={c.id} claim={c} />)}
          </div>
        </section>
      )}

      {resolved.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#0a1628] mb-3">Resolved</h2>
          <div className="space-y-3">
            {resolved.map(c => <ClaimRow key={c.id} claim={c} />)}
          </div>
        </section>
      )}
    </div>
  )
}
