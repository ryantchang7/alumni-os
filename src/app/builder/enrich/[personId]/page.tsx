'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface PersonProfile {
  person: {
    id: string
    canonicalName: string
    firstName?: string
    lastName?: string
  }
  membership?: {
    rosterStartYear?: number
    rosterEndYear?: number
    classLabel?: string
    hometown?: string
    highSchool?: string
    confidence: number
    bioUrls: string[]
    sourceUrls: string[]
  }
  missingFields: string[]
  qualityNotes: string[]
  sourceUrls: string[]
  bioUrls: string[]
}

interface EnrichmentData {
  enrichment: PersonEnrichmentForm | null
  sources: EnrichmentSource[]
}

interface PersonEnrichmentForm {
  currentRole?: string
  currentCompany?: string
  industry?: string
  city?: string
  state?: string
  country?: string
  email?: string
  linkedinUrl?: string
  personalWebsiteUrl?: string
  notes?: string
  relationshipStatus?: string
  verificationStatus?: string
  sourceUrls?: string[]
}

interface EnrichmentSource {
  id: string
  url: string
  title?: string
  sourceType: string
  notes?: string
  createdAt: string
}

const SOURCE_TYPES = [
  { value: 'team_roster', label: 'Team Roster' },
  { value: 'company_bio', label: 'Company Bio' },
  { value: 'personal_site', label: 'Personal Site' },
  { value: 'linkedin_public', label: 'LinkedIn Public' },
  { value: 'news_article', label: 'News Article' },
  { value: 'manual_note', label: 'Manual Note' },
  { value: 'other', label: 'Other' },
]

const RELATIONSHIP_STATUSES = [
  { value: 'not_started', label: 'Not started' },
  { value: 'identified', label: 'Identified' },
  { value: 'drafted', label: 'Drafted' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'replied', label: 'Replied' },
  { value: 'met', label: 'Met' },
  { value: 'do_not_contact', label: 'Do not contact' },
]

const VERIFICATION_STATUSES = [
  { value: 'unverified', label: 'Unverified' },
  { value: 'source_backed', label: 'Source backed' },
  { value: 'manually_verified', label: 'Manually verified' },
  { value: 'needs_review', label: 'Needs review' },
]

function rosterYears(m?: { rosterStartYear?: number; rosterEndYear?: number }): string {
  if (!m) return '—'
  if (m.rosterStartYear && m.rosterEndYear) return `${m.rosterStartYear}–${m.rosterEndYear}`
  if (m.rosterStartYear) return String(m.rosterStartYear)
  return '—'
}

function enrichmentStatusLabel(verificationStatus?: string): { label: string; className: string } {
  switch (verificationStatus) {
    case 'manually_verified':
      return { label: 'Verified', className: 'bg-emerald-100 text-emerald-800' }
    case 'source_backed':
      return { label: 'Source backed', className: 'bg-blue-100 text-blue-800' }
    case 'needs_review':
      return { label: 'Needs review', className: 'bg-amber-100 text-amber-800' }
    default:
      return { label: 'Unverified', className: 'bg-gray-100 text-gray-600' }
  }
}

const EMPTY_FORM: PersonEnrichmentForm = {
  currentRole: '',
  currentCompany: '',
  industry: '',
  city: '',
  state: '',
  country: '',
  email: '',
  linkedinUrl: '',
  personalWebsiteUrl: '',
  notes: '',
  relationshipStatus: 'not_started',
  verificationStatus: 'unverified',
}

const EMPTY_SOURCE_FORM = {
  url: '',
  title: '',
  sourceType: 'other',
  notes: '',
}

function EnrichPersonInner() {
  const params = useParams()
  const searchParams = useSearchParams()
  const personId = params.personId as string
  const teamSlug = searchParams.get('teamSlug')

  const [profile, setProfile] = useState<PersonProfile | null>(null)
  const [form, setForm] = useState<PersonEnrichmentForm>(EMPTY_FORM)
  const [sources, setSources] = useState<EnrichmentSource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [sourceForm, setSourceForm] = useState(EMPTY_SOURCE_FORM)
  const [addingSource, setAddingSource] = useState(false)
  const [sourceError, setSourceError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!teamSlug || !personId) return
    setLoading(true)
    setError(null)
    try {
      const [profileRes, enrichmentRes] = await Promise.all([
        fetch(`/api/alumni/profiles/${personId}?teamSlug=${encodeURIComponent(teamSlug)}`),
        fetch(`/api/alumni/enrichment?teamSlug=${encodeURIComponent(teamSlug)}&personId=${encodeURIComponent(personId)}`),
      ])

      const [profileData, enrichmentData]: [PersonProfile, EnrichmentData] = await Promise.all([
        profileRes.json(),
        enrichmentRes.json(),
      ])

      if (!profileRes.ok) {
        setError((profileData as { error?: string }).error ?? `Profile fetch failed: ${profileRes.status}`)
        return
      }

      setProfile(profileData)
      setSources(enrichmentData.sources ?? [])

      if (enrichmentData.enrichment) {
        const e = enrichmentData.enrichment
        setForm({
          currentRole: e.currentRole ?? '',
          currentCompany: e.currentCompany ?? '',
          industry: e.industry ?? '',
          city: e.city ?? '',
          state: e.state ?? '',
          country: e.country ?? '',
          email: e.email ?? '',
          linkedinUrl: e.linkedinUrl ?? '',
          personalWebsiteUrl: e.personalWebsiteUrl ?? '',
          notes: e.notes ?? '',
          relationshipStatus: e.relationshipStatus ?? 'not_started',
          verificationStatus: e.verificationStatus ?? 'unverified',
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }, [personId, teamSlug])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!teamSlug || !personId) return
    setSaving(true)
    setSaveError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/alumni/enrichment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamSlug, personId, enrichment: form }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSaveError(data.error ?? `Save failed: ${res.status}`)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddSource(e: React.FormEvent) {
    e.preventDefault()
    if (!teamSlug || !personId || !sourceForm.url.trim()) return
    setAddingSource(true)
    setSourceError(null)
    try {
      const res = await fetch('/api/alumni/enrichment/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamSlug, personId, ...sourceForm }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSourceError(data.error ?? `Add failed: ${res.status}`)
      } else {
        setSources(prev => [...prev, data.source])
        setSourceForm(EMPTY_SOURCE_FORM)
      }
    } catch (err) {
      setSourceError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setAddingSource(false)
    }
  }

  async function handleDeleteSource(sourceId: string) {
    if (!teamSlug) return
    try {
      const res = await fetch(
        `/api/alumni/enrichment/sources?sourceId=${encodeURIComponent(sourceId)}&teamSlug=${encodeURIComponent(teamSlug)}`,
        { method: 'DELETE' },
      )
      if (res.ok) {
        setSources(prev => prev.filter(s => s.id !== sourceId))
      }
    } catch {
      // ignore
    }
  }

  if (!teamSlug || !personId) {
    return (
      <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center text-[#8a7f70] text-sm p-8">
        Missing teamSlug or personId.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center text-[#8a7f70] text-sm">
        <span className="w-5 h-5 border-2 border-[#8a7f70]/30 border-t-[#8a7f70] rounded-full animate-spin mr-3" />
        Loading profile…
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-5 text-red-700 text-sm max-w-lg">
          {error}
        </div>
      </div>
    )
  }

  const name = profile?.person.canonicalName ?? 'Unknown'
  const membership = profile?.membership
  const statusInfo = enrichmentStatusLabel(form.verificationStatus)

  return (
    <div className="min-h-screen bg-[#f8f5f0] flex flex-col">
      {/* Navy header */}
      <div className="bg-[#0a1628] py-10 px-8">
        <div className="max-w-[1320px] mx-auto">
          <Link href="/builder" className="text-xs text-gray-400 hover:text-white transition-colors mb-1 block">
            ← Builder
          </Link>
          <Link
            href={`/builder/enrich?teamSlug=${teamSlug}`}
            className="text-xs text-gray-300 hover:text-white transition-colors mb-3 block"
          >
            ← Enrich Profiles
          </Link>
          <h1 className="text-white text-2xl font-semibold tracking-tight">{name}</h1>
          <p className="text-gray-400 text-sm mt-1">Career &amp; Contact Enrichment</p>
        </div>
      </div>

      <div className="flex-1 max-w-[1320px] mx-auto w-full px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left col */}
          <div className="lg:col-span-2 space-y-6">
            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
              Only save facts you have verified or manually entered. Unknown fields should remain blank.
            </div>

            {/* Roster facts card */}
            <div data-testid="roster-truth-panel" className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-5" style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.04)' }}>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-[#0a1628] font-semibold text-sm">Roster facts — source of truth</h2>
                <span className="text-xs text-[#8a7f70] bg-[#f0ece5] px-2 py-0.5 rounded">Read only</span>
              </div>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs text-[#8a7f70] uppercase tracking-wide">Name</dt>
                  <dd className="text-[#0d1f3c] font-medium mt-0.5">{name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#8a7f70] uppercase tracking-wide">Penn Golf years</dt>
                  <dd className="text-[#0d1f3c] mt-0.5">{rosterYears(membership)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#8a7f70] uppercase tracking-wide">Class</dt>
                  <dd className="text-[#0d1f3c] mt-0.5">{membership?.classLabel ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#8a7f70] uppercase tracking-wide">Hometown</dt>
                  <dd className="text-[#0d1f3c] mt-0.5">{membership?.hometown ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#8a7f70] uppercase tracking-wide">High School</dt>
                  <dd className="text-[#0d1f3c] mt-0.5">{membership?.highSchool ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#8a7f70] uppercase tracking-wide">Confidence</dt>
                  <dd className="text-[#0d1f3c] mt-0.5">
                    {membership ? `${Math.round(membership.confidence * 100)}%` : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#8a7f70] uppercase tracking-wide">Bio URLs</dt>
                  <dd className="text-[#0d1f3c] mt-0.5">{membership?.bioUrls.length ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#8a7f70] uppercase tracking-wide">Source URLs</dt>
                  <dd className="text-[#0d1f3c] mt-0.5">{membership?.sourceUrls.length ?? 0}</dd>
                </div>
              </dl>
            </div>

            {/* Enrichment form */}
            <form
              data-testid="enrich-edit-form"
              onSubmit={handleSave}
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-5 space-y-5"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.04)' }}
            >
              <h2 className="text-[#0a1628] font-semibold text-sm">Career &amp; Contact Enrichment</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#8a7f70] mb-1">Current Role</label>
                  <input
                    type="text"
                    value={form.currentRole ?? ''}
                    onChange={e => setForm(f => ({ ...f, currentRole: e.target.value }))}
                    className="w-full border border-[rgba(180,168,150,0.5)] rounded-md px-3 py-2 text-sm text-[#0d1f3c] focus:outline-none focus:ring-1 focus:ring-[#0a1628] bg-white"
                    placeholder="e.g. Software Engineer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8a7f70] mb-1">Current Company</label>
                  <input
                    type="text"
                    value={form.currentCompany ?? ''}
                    onChange={e => setForm(f => ({ ...f, currentCompany: e.target.value }))}
                    className="w-full border border-[rgba(180,168,150,0.5)] rounded-md px-3 py-2 text-sm text-[#0d1f3c] focus:outline-none focus:ring-1 focus:ring-[#0a1628] bg-white"
                    placeholder="e.g. Google"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8a7f70] mb-1">Industry</label>
                <input
                  type="text"
                  value={form.industry ?? ''}
                  onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-md px-3 py-2 text-sm text-[#0d1f3c] focus:outline-none focus:ring-1 focus:ring-[#0a1628] bg-white"
                  placeholder="e.g. Technology"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#8a7f70] mb-1">City</label>
                  <input
                    type="text"
                    value={form.city ?? ''}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full border border-[rgba(180,168,150,0.5)] rounded-md px-3 py-2 text-sm text-[#0d1f3c] focus:outline-none focus:ring-1 focus:ring-[#0a1628] bg-white"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8a7f70] mb-1">State</label>
                  <input
                    type="text"
                    value={form.state ?? ''}
                    onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                    className="w-full border border-[rgba(180,168,150,0.5)] rounded-md px-3 py-2 text-sm text-[#0d1f3c] focus:outline-none focus:ring-1 focus:ring-[#0a1628] bg-white"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8a7f70] mb-1">Country</label>
                  <input
                    type="text"
                    value={form.country ?? ''}
                    onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                    className="w-full border border-[rgba(180,168,150,0.5)] rounded-md px-3 py-2 text-sm text-[#0d1f3c] focus:outline-none focus:ring-1 focus:ring-[#0a1628] bg-white"
                    placeholder="Country"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#8a7f70] mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email ?? ''}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-[rgba(180,168,150,0.5)] rounded-md px-3 py-2 text-sm text-[#0d1f3c] focus:outline-none focus:ring-1 focus:ring-[#0a1628] bg-white"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8a7f70] mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={form.linkedinUrl ?? ''}
                    onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))}
                    className="w-full border border-[rgba(180,168,150,0.5)] rounded-md px-3 py-2 text-sm text-[#0d1f3c] focus:outline-none focus:ring-1 focus:ring-[#0a1628] bg-white"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8a7f70] mb-1">Personal Website URL</label>
                <input
                  type="url"
                  value={form.personalWebsiteUrl ?? ''}
                  onChange={e => setForm(f => ({ ...f, personalWebsiteUrl: e.target.value }))}
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-md px-3 py-2 text-sm text-[#0d1f3c] focus:outline-none focus:ring-1 focus:ring-[#0a1628] bg-white"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8a7f70] mb-1">Notes</label>
                <textarea
                  value={form.notes ?? ''}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-md px-3 py-2 text-sm text-[#0d1f3c] focus:outline-none focus:ring-1 focus:ring-[#0a1628] bg-white resize-none"
                  placeholder="Any additional context…"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#8a7f70] mb-1">Relationship Status</label>
                  <select
                    value={form.relationshipStatus ?? 'not_started'}
                    onChange={e => setForm(f => ({ ...f, relationshipStatus: e.target.value }))}
                    className="w-full border border-[rgba(180,168,150,0.5)] rounded-md px-3 py-2 text-sm text-[#0d1f3c] focus:outline-none focus:ring-1 focus:ring-[#0a1628] bg-white"
                  >
                    {RELATIONSHIP_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8a7f70] mb-1">Verification Status</label>
                  <select
                    value={form.verificationStatus ?? 'unverified'}
                    onChange={e => setForm(f => ({ ...f, verificationStatus: e.target.value }))}
                    className="w-full border border-[rgba(180,168,150,0.5)] rounded-md px-3 py-2 text-sm text-[#0d1f3c] focus:outline-none focus:ring-1 focus:ring-[#0a1628] bg-white"
                  >
                    {VERIFICATION_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
                  {saveError}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  data-testid="enrichment-save-button"
                  type="submit"
                  disabled={saving}
                  className="bg-[#990000] hover:bg-[#b30000] text-white text-sm font-semibold px-5 py-2 rounded-md transition-colors disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Enrichment'}
                </button>
                {saved && (
                  <span className="text-emerald-600 text-sm font-medium">Saved!</span>
                )}
              </div>
            </form>

            {/* Sources card */}
            <div className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-5 space-y-4" style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.04)' }}>
              <h2 className="text-[#0a1628] font-semibold text-sm">Supporting Sources</h2>

              {sources.length === 0 ? (
                <p className="text-sm text-[#8a7f70]">No sources added yet.</p>
              ) : (
                <ul className="space-y-3">
                  {sources.map(src => (
                    <li key={src.id} className="flex items-start justify-between gap-3 border border-[rgba(180,168,150,0.25)] rounded-md p-3">
                      <div className="min-w-0 flex-1">
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#990000] hover:underline truncate block"
                        >
                          {src.title ?? src.url}
                        </a>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-[#8a7f70] bg-[#f0ece5] px-2 py-0.5 rounded">
                            {SOURCE_TYPES.find(t => t.value === src.sourceType)?.label ?? src.sourceType}
                          </span>
                          {src.notes && (
                            <span className="text-xs text-[#8a7f70]">{src.notes}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSource(src.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium whitespace-nowrap shrink-0"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Add source form */}
              <form data-testid="enrichment-source-form" onSubmit={handleAddSource} className="border border-[rgba(180,168,150,0.35)] rounded-md p-4 space-y-3 bg-[#faf8f5]">
                <p className="text-xs font-medium text-[#8a7f70] uppercase tracking-wide">Add a source</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="url"
                      required
                      value={sourceForm.url}
                      onChange={e => setSourceForm(f => ({ ...f, url: e.target.value }))}
                      placeholder="URL *"
                      className="w-full border border-[rgba(180,168,150,0.5)] rounded-md px-3 py-2 text-sm text-[#0d1f3c] focus:outline-none focus:ring-1 focus:ring-[#0a1628] bg-white"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={sourceForm.title}
                      onChange={e => setSourceForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Title (optional)"
                      className="w-full border border-[rgba(180,168,150,0.5)] rounded-md px-3 py-2 text-sm text-[#0d1f3c] focus:outline-none focus:ring-1 focus:ring-[#0a1628] bg-white"
                    />
                  </div>
                  <div>
                    <select
                      value={sourceForm.sourceType}
                      onChange={e => setSourceForm(f => ({ ...f, sourceType: e.target.value }))}
                      className="w-full border border-[rgba(180,168,150,0.5)] rounded-md px-3 py-2 text-sm text-[#0d1f3c] focus:outline-none focus:ring-1 focus:ring-[#0a1628] bg-white"
                    >
                      {SOURCE_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={sourceForm.notes}
                      onChange={e => setSourceForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Notes (optional)"
                      className="w-full border border-[rgba(180,168,150,0.5)] rounded-md px-3 py-2 text-sm text-[#0d1f3c] focus:outline-none focus:ring-1 focus:ring-[#0a1628] bg-white"
                    />
                  </div>
                </div>
                {sourceError && (
                  <p className="text-red-600 text-xs">{sourceError}</p>
                )}
                <button
                  data-testid="enrichment-source-add-button"
                  type="submit"
                  disabled={addingSource}
                  className="bg-[#0a1628] hover:bg-[#0d1f3c] text-white text-sm font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-60"
                >
                  {addingSource ? 'Adding…' : 'Add Source'}
                </button>
              </form>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* Profile summary */}
              <div className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-5 space-y-3" style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.04)' }}>
                <h3 className="text-[#0a1628] font-semibold text-sm">Profile summary</h3>
                <div>
                  <p className="text-[#0d1f3c] font-semibold text-base">{name}</p>
                  <p className="text-[#8a7f70] text-xs mt-0.5">Penn Golf {rosterYears(membership)}</p>
                </div>
                {membership && (
                  <p className="text-[#8a7f70] text-xs">
                    Confidence: {Math.round(membership.confidence * 100)}%
                  </p>
                )}
                <span className={`inline-block rounded-full text-xs font-medium px-2 py-0.5 ${statusInfo.className}`}>
                  {statusInfo.label}
                </span>
              </div>

              {/* Quick links */}
              <div className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-5 space-y-2" style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.04)' }}>
                <h3 className="text-[#0a1628] font-semibold text-sm mb-3">Quick links</h3>
                <Link
                  href={`/builder/enrich?teamSlug=${teamSlug}`}
                  className="block text-sm text-[#8a7f70] hover:text-[#0a1628] transition-colors"
                >
                  ← Back to Enrich List
                </Link>
                <Link
                  href={`/player/alumni/${personId}`}
                  className="block text-sm text-[#8a7f70] hover:text-[#0a1628] transition-colors"
                >
                  View Player Profile →
                </Link>
                <Link
                  href={`/player/outreach/${personId}`}
                  className="block text-sm text-[#8a7f70] hover:text-[#0a1628] transition-colors"
                >
                  Draft Outreach →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EnrichPersonPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center text-[#8a7f70] text-sm">
          Loading…
        </div>
      }
    >
      <EnrichPersonInner />
    </Suspense>
  )
}
