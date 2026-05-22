'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { useSession } from 'next-auth/react'

interface SelfProfile {
  personId: string
  canonicalName: string
  bookId?: string | null
  classLabel?: string
  rosterStartYear?: number
  rosterEndYear?: number
  hometown?: string
  highSchool?: string
  currentRole?: string
  currentCompany?: string
  industry?: string
  city?: string
  alumniBio?: string
  helpTopics?: string[]
  contactPreference?: string
  visibleToPlayers?: boolean
  homeCourse?: string
  favoriteCourses?: string
  favoritePennGolfMemory?: string
  interests?: string
  email?: string
  phone?: string
  linkedinUrl?: string
}

const HELP_TOPIC_OPTIONS = [
  'Career advice',
  'Coffee chats',
  'Mentorship',
  'Golf connections',
  'Recruiting advice',
  'Resume review',
  'Graduate school',
  'General networking',
]

// Differentiated, single-line categories. Multi-select.
const INDUSTRY_OPTIONS = [
  'Finance',
  'Tech',
  'Real Estate',
  'Law',
  'Consulting',
  'Healthcare / Biotech',
  'Energy',
  'Consumer / Retail',
  'Media / Entertainment',
  'Sports',
  'Government / Policy',
  'Education / Academia',
  'Nonprofit',
  'Entrepreneurship',
  'Student',
  'Other',
]

const CONTACT_PREF_LABELS: Record<string, string> = {
  team_intro: 'Have the captain make an introduction',
  email_ok: 'Email is fine',
  linkedin_ok: 'LinkedIn message is fine',
  not_available: 'Not available right now',
}

function AlumniProfileInner() {
  const params = useParams()
  const searchParams = useSearchParams()
  const personId = params.id as string
  const teamSlug = searchParams.get('teamSlug') ?? 'penn-mens-golf'
  const { data: session, status: sessionStatus } = useSession()
  const isOwner =
    sessionStatus === 'authenticated' && session?.linkedPersonId === personId
  const sessionReady = sessionStatus !== 'loading'

  const [profile, setProfile] = useState<SelfProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [hometown, setHometown] = useState('')
  const [currentRole, setCurrentRole] = useState('')
  const [currentCompany, setCurrentCompany] = useState('')
  const [industry, setIndustry] = useState('')
  const [city, setCity] = useState('')
  const [alumniBio, setAlumniBio] = useState('')
  const [helpTopics, setHelpTopics] = useState<string[]>([])
  const [contactPref, setContactPref] = useState('team_intro')
  const [visibleToPlayers, setVisibleToPlayers] = useState(true)
  const [homeCourse, setHomeCourse] = useState('')
  const [favoriteCourses, setFavoriteCourses] = useState('')
  const [favoritePennGolfMemory, setFavoritePennGolfMemory] = useState('')
  const [interests, setInterests] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')

  const justClaimed = searchParams.get('claimed') === '1'

  useEffect(() => {
    fetch(`/api/alumni/self-profile?teamSlug=${teamSlug}&personId=${personId}`)
      .then(r => {
        if (!r.ok) throw new Error(`Not found (${r.status})`)
        return r.json()
      })
      .then((data: SelfProfile) => {
        setProfile(data)
        setHometown(data.hometown ?? '')
        setCurrentRole(data.currentRole ?? '')
        setCurrentCompany(data.currentCompany ?? '')
        setIndustry(data.industry ?? '')
        setCity(data.city ?? '')
        setAlumniBio(data.alumniBio ?? '')
        setHelpTopics(data.helpTopics ?? [])
        setContactPref(data.contactPreference ?? 'team_intro')
        setVisibleToPlayers(data.visibleToPlayers ?? true)
        setHomeCourse(data.homeCourse ?? '')
        setFavoriteCourses(data.favoriteCourses ?? '')
        setFavoritePennGolfMemory(data.favoritePennGolfMemory ?? '')
        setInterests(data.interests ?? '')
        setEmail(data.email ?? '')
        setPhone(data.phone ?? '')
        setLinkedinUrl(data.linkedinUrl ?? '')
        setLoading(false)
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to load profile')
        setLoading(false)
      })
  }, [personId, teamSlug])

  function toggleTopic(topic: string) {
    setHelpTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic],
    )
  }

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/alumni/self-profile?teamSlug=${teamSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId,
          hometown,
          currentRole,
          currentCompany,
          industry,
          city,
          alumniBio,
          helpTopics,
          contactPreference: contactPref,
          visibleToPlayers,
          homeCourse,
          favoriteCourses,
          favoritePennGolfMemory,
          interests,
          email,
          phone,
          linkedinUrl,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaved(true)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f5f0] py-20 text-center">
        <p className="text-sm text-[#8a7f70]">Loading profile...</p>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-[#f8f5f0] py-20 text-center">
        <p className="text-base font-semibold text-[#990000] mb-2">Profile not found</p>
        <p className="text-sm text-[#8a7f70] mb-6">{error}</p>
        <Link href="/alumni" className="text-sm font-medium text-[#990000] hover:underline">
          Back to Your Profile
        </Link>
      </div>
    )
  }

  if (!profile) return null

  const rosterYearsLabel =
    profile.rosterStartYear !== undefined && profile.rosterEndYear !== undefined
      ? `${profile.rosterStartYear}–${profile.rosterEndYear}`
      : profile.rosterStartYear !== undefined
        ? String(profile.rosterStartYear)
        : null

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-8 pt-10 pb-14">
        <div className="max-w-[860px] mx-auto">
          <Link
            href={`/alumni?teamSlug=${teamSlug}`}
            className="text-xs text-gray-400 hover:text-gray-200 mb-3 inline-block"
          >
            &larr; Your Profile
          </Link>
          <h1 className="text-white text-2xl font-semibold tracking-tight mt-1">
            {profile.canonicalName}
          </h1>
          {(rosterYearsLabel || profile.classLabel) && (
            <p className="text-gray-400 text-sm mt-1">
              {[profile.classLabel, rosterYearsLabel ? `Penn Golf ${rosterYearsLabel}` : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-[860px] mx-auto px-8 pb-16">
        <div className="-mt-5 relative z-10 space-y-4">
          {justClaimed && (
            <div
              className="bg-white border border-[#2d6a4f]/30 rounded-xl p-5"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <p className="text-sm font-semibold text-[#0a1628]">Profile claimed.</p>
              <p className="text-xs text-[#8a7f70] mt-1">
                Add your details below so other Penn Golf members can find you.
              </p>
            </div>
          )}

          {sessionReady && !isOwner && (
            <div
              className="bg-white border border-[rgba(180,168,150,0.5)] rounded-xl p-5"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <p className="text-sm font-semibold text-[#0a1628]">View-only</p>
              <p className="text-xs text-[#8a7f70] mt-1">
                {sessionStatus === 'authenticated'
                  ? 'You can only edit your own profile. Manage yours from your account.'
                  : 'Sign in to claim and edit this profile.'}
              </p>
              <Link
                href={sessionStatus === 'authenticated' ? '/account/profile' : '/login?next=/account/setup'}
                className="inline-block mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#990000] hover:underline"
              >
                {sessionStatus === 'authenticated' ? 'Go to your profile →' : 'Sign in →'}
              </Link>
            </div>
          )}

          {/* Read-only roster truth */}
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-3">
              From the Penn Golf record
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              {profile.highSchool && (
                <div>
                  <p className="text-xs text-[#8a7f70]">High school</p>
                  <p className="text-sm text-[#0a1628]">{profile.highSchool}</p>
                </div>
              )}
              {rosterYearsLabel && (
                <div>
                  <p className="text-xs text-[#8a7f70]">Penn Golf years</p>
                  <p className="text-sm text-[#0a1628]">{rosterYearsLabel}</p>
                </div>
              )}
            </div>
          </div>

          {/* Editable career info */}
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-1">
              Your current info
            </p>
            <p className="text-xs text-[#8a7f70] mb-4">
              Updates flow to your Member Book card and the Member Map.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">
                  Hometown
                </label>
                <input
                  type="text"
                  value={hometown}
                  onChange={e => setHometown(e.target.value)}
                  placeholder="e.g. Greenwich, CT"
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#4a5568] mb-1">
                    Current role
                  </label>
                  <input
                    type="text"
                    value={currentRole}
                    onChange={e => setCurrentRole(e.target.value)}
                    placeholder="Current role or title"
                    className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4a5568] mb-1">Company</label>
                  <input
                    type="text"
                    value={currentCompany}
                    onChange={e => setCurrentCompany(e.target.value)}
                    placeholder="Company name"
                    className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">Industries</label>
                <p className="text-[11px] text-[#8a7f70] mb-2">Pick any that apply.</p>
                <div className="flex flex-wrap gap-1.5">
                  {INDUSTRY_OPTIONS.map((opt) => {
                    const selected = industry
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                    const active = selected.includes(opt)
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          const next = active
                            ? selected.filter((s) => s !== opt)
                            : [...selected, opt]
                          setIndustry(next.join(', '))
                        }}
                        className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                          active
                            ? 'bg-[#0a1628] text-white border-[#0a1628]'
                            : 'bg-white text-[#0a1628] border-[rgba(180,168,150,0.5)] hover:border-[#0a1628]'
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">
                  City (where you live now)
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="e.g. New York"
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">
                  Short bio (optional)
                </label>
                <textarea
                  value={alumniBio}
                  onChange={e => setAlumniBio(e.target.value)}
                  placeholder="A sentence or two about what you are up to now."
                  rows={3}
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">
                  Other interests
                </label>
                <input
                  type="text"
                  value={interests}
                  onChange={e => setInterests(e.target.value)}
                  placeholder="e.g. Fly fishing · Skiing · Coffee · Distressed credit"
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                />
              </div>
            </div>
          </div>

          {/* Golf */}
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-1">
              Golf
            </p>
            <p className="text-xs text-[#8a7f70] mb-4">
              Used on The Course and to surface you to alumni wanting to play near you.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">
                  Home course
                </label>
                <input
                  type="text"
                  value={homeCourse}
                  onChange={e => setHomeCourse(e.target.value)}
                  placeholder="e.g. Winged Foot Golf Club"
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">
                  Favorite courses (comma-separated)
                </label>
                <input
                  type="text"
                  value={favoriteCourses}
                  onChange={e => setFavoriteCourses(e.target.value)}
                  placeholder="e.g. Pine Valley, Bandon Dunes, Cypress Point"
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">
                  Favorite Penn Golf memory (optional)
                </label>
                <textarea
                  value={favoritePennGolfMemory}
                  onChange={e => setFavoritePennGolfMemory(e.target.value)}
                  placeholder="A round, a tournament, a Sunday singles match…"
                  rows={3}
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-1">
              Contact
            </p>
            <p className="text-xs text-[#8a7f70] mb-4">
              Visible to other signed-in Penn Golf members. Leave blank to keep
              everything routed through the in-app request flow.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">
                  Public email (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@firm.com"
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 555-555-5555"
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">
                  LinkedIn URL (optional)
                </label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={e => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourname"
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                />
              </div>
            </div>
          </div>

          {/* How I can help */}
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-1">
              How I can help
            </p>
            <p className="text-xs text-[#8a7f70] mb-4">
              Players see which topics you are open to. Pick all that apply.
            </p>
            <div className="flex flex-wrap gap-2">
              {HELP_TOPIC_OPTIONS.map(topic => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                    helpTopics.includes(topic)
                      ? 'bg-[#0a1628] text-white border-[#0a1628]'
                      : 'bg-white text-[#0a1628] border-[rgba(180,168,150,0.5)] hover:border-[#0a1628]'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Contact preference */}
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-4">
              How to reach me
            </p>
            <div className="space-y-2">
              {Object.entries(CONTACT_PREF_LABELS).map(([value, label]) => (
                <label key={value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="contactPref"
                    value={value}
                    checked={contactPref === value}
                    onChange={() => setContactPref(value)}
                    className="accent-[#0a1628]"
                  />
                  <span className="text-sm text-[#0a1628]">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={visibleToPlayers}
                onChange={e => setVisibleToPlayers(e.target.checked)}
                className="mt-0.5 accent-[#0a1628]"
              />
              <div>
                <p className="text-sm font-medium text-[#0a1628]">Visible to players</p>
                <p className="text-xs text-[#8a7f70] mt-0.5">
                  Uncheck to hide your profile from the player-facing network at any time.
                </p>
              </div>
            </label>
          </div>

          {/* Save button */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !isOwner}
              title={!isOwner && sessionReady ? 'You can only edit your own profile' : undefined}
              className="text-sm font-semibold bg-[#0a1628] hover:bg-[#112240] text-white px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            {saved && (
              <span className="text-sm text-emerald-700 font-medium">Changes saved.</span>
            )}
            {saved && profile.bookId && (
              <Link
                href={`/member-book/${encodeURIComponent(profile.bookId)}`}
                className="text-xs font-semibold uppercase tracking-[0.14em] text-[#990000] hover:underline"
              >
                View your Member Book card &rarr;
              </Link>
            )}
            {error && !saving && (
              <span className="text-sm text-[#990000]">{error}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AlumniProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-[#8a7f70]">Loading profile...</div>
      }
    >
      <AlumniProfileInner />
    </Suspense>
  )
}
