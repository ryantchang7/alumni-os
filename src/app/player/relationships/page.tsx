'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface AlumniProfileEntry {
  personId: string
  canonicalName: string
  confidence: number
  status: 'ready' | 'needs-enrichment' | 'needs-review'
  enrichment?: {
    relationshipStatus?: string
    verificationStatus: string
  }
  enrichmentStatus?: 'none' | 'partial' | 'source_backed' | 'verified'
}

export default function RelationshipsPage() {
  const [profiles, setProfiles] = useState<AlumniProfileEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/alumni/profiles?teamSlug=penn-mens-golf')
      .then(r => r.ok ? r.json() : { profiles: [] })
      .then(data => {
        setProfiles(data.profiles ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const contacted = profiles.filter(p =>
    p.enrichment?.relationshipStatus &&
    ['contacted', 'replied', 'met'].includes(p.enrichment.relationshipStatus)
  ).length

  const enrichedCount = profiles.filter(
    p => p.enrichmentStatus !== 'none' && p.enrichmentStatus !== undefined
  ).length

  const contactedProfiles = profiles.filter(p =>
    p.enrichment?.relationshipStatus &&
    ['contacted', 'replied', 'met'].includes(p.enrichment.relationshipStatus)
  )

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Navy header */}
      <div className="bg-[#0a1628] px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Player Mode</p>
          <h1 className="text-white text-3xl font-semibold tracking-tight">Relationships</h1>
          <p className="text-gray-300 text-base mt-2 max-w-xl">
            Track your connections with Penn Golf alumni.
          </p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-8">
        {loading ? (
          <div className="py-20 text-center">
            <p className="text-sm text-[#8a7f70]">Loading alumni data...</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="-mt-5 relative z-10">
            <div className="text-center py-20">
              <p className="text-lg font-semibold text-[#0a1628] mb-2">No alumni data yet</p>
              <p className="text-sm text-[#8a7f70] mb-6 max-w-sm mx-auto">
                Extract and promote roster entries to start building the alumni graph.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/builder/workspace?teamSlug=penn-mens-golf"
                  className="text-sm font-medium bg-[#0a1628] text-white px-4 py-2 rounded hover:bg-[#112240] transition-colors"
                >
                  Go to Workspace
                </Link>
                <Link
                  href="/builder/debug-roster?teamSlug=penn-mens-golf"
                  className="text-sm font-medium border border-[rgba(180,168,150,0.5)] text-[#0a1628] px-4 py-2 rounded hover:bg-[#f0ece5] transition-colors"
                >
                  Debug Roster
                </Link>
                <Link
                  href="/builder/promote?teamSlug=penn-mens-golf"
                  className="text-sm font-medium border border-[rgba(180,168,150,0.5)] text-[#0a1628] px-4 py-2 rounded hover:bg-[#f0ece5] transition-colors"
                >
                  Promote Entries
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="-mt-5 relative z-10 space-y-6 pb-16">
            {/* Info box */}
            <div className="bg-[#112240] border border-white/[0.08] rounded-lg p-4">
              <p className="text-gray-300 text-sm">
                Relationship tracking uses the enrichment layer. Add career and contact details in Builder
                Enrichment, then mark your outreach status per alumni.
              </p>
              <Link
                href="/builder/enrich?teamSlug=penn-mens-golf"
                className="text-xs font-medium text-blue-400 hover:underline mt-2 block"
              >
                Enrich profiles in Builder &rarr;
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-5 text-center"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
              >
                <p className="text-2xl font-bold text-[#0a1628]">{profiles.length}</p>
                <p className="text-xs text-[#8a7f70] mt-1">total alumni</p>
              </div>
              <div
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-5 text-center"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
              >
                <p className="text-2xl font-bold text-emerald-600">{enrichedCount}</p>
                <p className="text-xs text-[#8a7f70] mt-1">enriched profiles</p>
              </div>
              <div
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-5 text-center"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
              >
                <p className="text-2xl font-bold text-blue-600">{contacted}</p>
                <p className="text-xs text-[#8a7f70] mt-1">contacted / replied / met</p>
              </div>
            </div>

            {/* Contacted list */}
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-5"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <h3 className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wide mb-4">
                Outreach Activity
              </h3>
              {contactedProfiles.length === 0 ? (
                <div>
                  <p className="text-sm text-[#8a7f70] mb-3">
                    No outreach started yet. Use the search page to find alumni and draft outreach.
                  </p>
                  <Link
                    href="/player/search"
                    className="text-sm font-medium text-[#990000] hover:underline"
                  >
                    Search alumni &rarr;
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {contactedProfiles.map(p => {
                    const status = p.enrichment?.relationshipStatus ?? ''
                    const badgeClass =
                      status === 'met'
                        ? 'bg-emerald-100 text-emerald-700'
                        : status === 'replied'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                    return (
                      <li key={p.personId} className="flex items-center justify-between gap-3">
                        <Link
                          href={`/player/alumni/${p.personId}`}
                          className="text-sm font-medium text-[#0a1628] hover:text-[#990000] transition-colors"
                        >
                          {p.canonicalName}
                        </Link>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${badgeClass}`}>
                          {status.replace(/_/g, ' ')}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Quick links */}
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-5"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <h3 className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wide mb-4">
                Quick Links
              </h3>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/player"
                  className="text-sm font-medium bg-[#0a1628] text-white px-4 py-2 rounded hover:bg-[#112240] transition-colors"
                >
                  View Alumni &rarr;
                </Link>
                <Link
                  href="/player/search"
                  className="text-sm font-medium border border-[rgba(180,168,150,0.5)] text-[#0a1628] px-4 py-2 rounded hover:bg-[#f0ece5] transition-colors"
                >
                  Search &rarr;
                </Link>
                <Link
                  href="/builder/workspace?teamSlug=penn-mens-golf"
                  className="text-sm font-medium border border-[rgba(180,168,150,0.5)] text-[#0a1628] px-4 py-2 rounded hover:bg-[#f0ece5] transition-colors"
                >
                  Build Graph &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
