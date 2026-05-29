'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { useSession } from 'next-auth/react'
import CityStateInput from '@/components/CityStateInput'
import HometownInput from '@/components/HometownInput'
import PhotoUpload from '@/components/PhotoUpload'
import CourseAutocomplete from '@/components/CourseAutocomplete'
import { US_GOLF_COURSES } from '@/lib/courses/us-golf-courses'
import { INDUSTRY_OPTIONS } from '@/lib/industries'

interface LocationRow {
  city?: string
  state?: string
  label?: string
}

interface SelfProfile {
  personId: string
  canonicalName: string
  bookId?: string | null
  memberRole?: 'current_player' | 'alumni' | 'coach' | 'parent'
  /** Only present for parents/affiliates — the relationship line they
   *  filled in at /parent-signup ("Parent of John Smith C'24"). */
  parentRelationship?: string
  classLabel?: string
  rosterStartYear?: number
  rosterEndYear?: number
  hometown?: string
  highSchool?: string
  currentRole?: string
  currentCompany?: string
  industry?: string
  city?: string
  state?: string
  additionalLocations?: LocationRow[]
  inTown?: {
    city?: string
    state?: string
    startDate?: string
    endDate?: string
    note?: string
  } | null
  alumniBio?: string
  helpTopics?: string[]
  contactPreference?: string
  visibleToPlayers?: boolean
  homeCourse?: string
  noHomeCourse?: boolean
  handicap?: string
  favoriteCourses?: string
  favoritePennGolfMemory?: string
  interests?: string
  email?: string
  phone?: string
  linkedinUrl?: string
  photoUrl?: string
  openToGolfRounds?: boolean
  openToCoffee?: boolean
  openToMentorship?: boolean
  openToWarmIntroductions?: boolean
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

// INDUSTRY_OPTIONS lives in @/lib/industries — shared with the Career
// Room tiles and the Member Book ?industry= filter.

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
  const [state, setState] = useState('')
  const [additionalLocations, setAdditionalLocations] = useState<LocationRow[]>([])
  const [inTownCity, setInTownCity] = useState('')
  const [inTownState, setInTownState] = useState('')
  const [inTownStart, setInTownStart] = useState('')
  const [inTownEnd, setInTownEnd] = useState('')
  const [inTownNote, setInTownNote] = useState('')
  const [alumniBio, setAlumniBio] = useState('')
  const [helpTopics, setHelpTopics] = useState<string[]>([])
  const [contactPref, setContactPref] = useState('team_intro')
  const [visibleToPlayers, setVisibleToPlayers] = useState(true)
  const [homeCourse, setHomeCourse] = useState('')
  const [handicap, setHandicap] = useState('')
  const [favoriteCourses, setFavoriteCourses] = useState('')
  const [favoritePennGolfMemory, setFavoritePennGolfMemory] = useState('')
  /** "I'm not a member at a course" — opt-out for players and parents who
   *  don't have a club affiliation. When true, the home course required
   *  check is suppressed and the field is cleared/disabled. */
  const [noHomeCourse, setNoHomeCourse] = useState(false)
  const [interests, setInterests] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [openToGolfRounds, setOpenToGolfRounds] = useState(false)
  const [openToCoffee, setOpenToCoffee] = useState(false)
  const [openToMentorship, setOpenToMentorship] = useState(false)
  const [openToWarmIntroductions, setOpenToWarmIntroductions] = useState(false)

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
        setState(data.state ?? '')
        setAdditionalLocations(data.additionalLocations ?? [])
        setInTownCity(data.inTown?.city ?? '')
        setInTownState(data.inTown?.state ?? '')
        setInTownStart(data.inTown?.startDate ?? '')
        setInTownEnd(data.inTown?.endDate ?? '')
        setInTownNote(data.inTown?.note ?? '')
        setAlumniBio(data.alumniBio ?? '')
        setHelpTopics(data.helpTopics ?? [])
        setContactPref(data.contactPreference ?? 'team_intro')
        setVisibleToPlayers(data.visibleToPlayers ?? true)
        setHomeCourse(data.homeCourse ?? '')
        setHandicap(data.handicap ?? '')
        setFavoriteCourses(data.favoriteCourses ?? '')
        setFavoritePennGolfMemory(data.favoritePennGolfMemory ?? '')
        setNoHomeCourse(data.noHomeCourse === true)
        setInterests(data.interests ?? '')
        setEmail(data.email ?? '')
        setPhone(data.phone ?? '')
        setLinkedinUrl(data.linkedinUrl ?? '')
        setPhotoUrl(data.photoUrl ?? '')
        setOpenToGolfRounds(!!data.openToGolfRounds)
        setOpenToCoffee(!!data.openToCoffee)
        setOpenToMentorship(!!data.openToMentorship)
        setOpenToWarmIntroductions(!!data.openToWarmIntroductions)
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

  // Required fields for a useful profile. Validated before save and
  // visualized with red asterisks in the labels. Parents get a slimmer
  // set — no hometown / no home course / golf-history fields are hidden
  // for them, so requiring them would lock saves forever.
  const isCurrentPlayer = profile?.memberRole === 'current_player'
  const isParent = profile?.memberRole === 'parent'
  const requiredMissing = (): string[] => {
    const missing: string[] = []
    if (!isParent && !hometown.trim()) missing.push('Hometown')
    if (!city.trim() || !state.trim()) missing.push('Where you live now')
    if (!currentRole.trim()) missing.push('Current role')
    if (!currentCompany.trim()) missing.push('Company')
    if (!industry.trim()) missing.push('Industries')
    if (!isParent && !noHomeCourse && !homeCourse.trim()) missing.push('Home course')
    // Handicap is required for players + alumni + coach. Skip for
    // parents/affiliates — they may not golf.
    if (!isParent && !handicap.trim()) missing.push('Handicap')
    // At least one contact method so other members can reach you.
    if (!email.trim() && !phone.trim() && !linkedinUrl.trim()) {
      missing.push('A contact method (email, phone, or LinkedIn)')
    }
    return missing
  }

  async function handleSave() {
    if (!profile) return
    const missing = requiredMissing()
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.join(', ')}.`)
      return
    }
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
          state,
          additionalLocations: additionalLocations.filter((l) => l.city || l.state),
          inTown:
            inTownCity || inTownState || inTownStart || inTownEnd || inTownNote
              ? {
                  city: inTownCity || undefined,
                  state: inTownState || undefined,
                  startDate: inTownStart || undefined,
                  endDate: inTownEnd || undefined,
                  note: inTownNote || undefined,
                }
              : null,
          alumniBio,
          helpTopics,
          contactPreference: contactPref,
          visibleToPlayers,
          homeCourse,
          noHomeCourse,
          handicap,
          favoriteCourses,
          favoritePennGolfMemory,
          interests,
          email,
          phone,
          linkedinUrl,
          photoUrl,
          openToGolfRounds,
          openToCoffee,
          openToMentorship,
          openToWarmIntroductions,
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
            href="/account/profile"
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

          {/* Read-only roster truth (players + alumni only — parents
              and coaches have no Penn Golf record to display). */}
          {!isParent && (
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
          )}

          {/* Family & Affiliate banner — shown in place of the roster
              record so parents see something meaningful here. */}
          {isParent && profile.parentRelationship && (
            <div
              className="bg-[#990000]/8 border border-[#990000]/25 rounded-xl p-6"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.04)' }}
            >
              <p className="text-xs font-semibold text-[#990000] uppercase tracking-wider mb-2">
                Family &amp; Affiliate
              </p>
              <p className="text-sm text-[#0a1628]">
                {profile.parentRelationship}
              </p>
            </div>
          )}

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
              {!isParent && (
                <div>
                  <label className="block text-xs font-medium text-[#4a5568] mb-1">
                    Hometown <span className="text-[#990000]">*</span>
                  </label>
                  <HometownInput
                    value={hometown}
                    onChange={setHometown}
                    placeholder="e.g. Greenwich, CT"
                    required
                  />
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#4a5568] mb-1">
                    Current role <span className="text-[#990000]">*</span>
                  </label>
                  <input
                    type="text"
                    value={currentRole}
                    onChange={e => setCurrentRole(e.target.value)}
                    placeholder="Current role or title"
                    required
                    className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4a5568] mb-1">
                    Company <span className="text-[#990000]">*</span>
                  </label>
                  <input
                    type="text"
                    value={currentCompany}
                    onChange={e => setCurrentCompany(e.target.value)}
                    placeholder="Company name"
                    required
                    className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">
                  Industries <span className="text-[#990000]">*</span>
                </label>
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
                  Where you live now <span className="text-[#990000]">*</span>
                </label>
                <CityStateInput
                  city={city}
                  state={state}
                  onChange={({ city: c, state: s }) => {
                    setCity(c)
                    setState(s)
                  }}
                />

                {additionalLocations.map((loc, idx) => (
                  <div key={idx} className="mt-2 grid grid-cols-[1fr_1fr_28px] gap-2 items-center">
                    <CityStateInput
                      city={loc.city ?? ''}
                      state={loc.state ?? ''}
                      cityPlaceholder="City"
                      onChange={({ city: c, state: s }) => {
                        const copy = [...additionalLocations]
                        copy[idx] = { ...copy[idx], city: c, state: s }
                        setAdditionalLocations(copy)
                      }}
                    />
                    <input
                      type="text"
                      value={loc.label ?? ''}
                      onChange={(e) => {
                        const copy = [...additionalLocations]
                        copy[idx] = { ...copy[idx], label: e.target.value }
                        setAdditionalLocations(copy)
                      }}
                      placeholder="winters / summers / weekends"
                      className="border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setAdditionalLocations(additionalLocations.filter((_, i) => i !== idx))
                      }
                      aria-label="Remove location"
                      className="w-7 h-7 rounded-full text-[#8a7f70] hover:bg-[#faf7f2] hover:text-[#990000] text-base leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {additionalLocations.length < 3 && (
                  <button
                    type="button"
                    onClick={() =>
                      setAdditionalLocations([
                        ...additionalLocations,
                        { city: '', state: '', label: '' },
                      ])
                    }
                    className="mt-2 text-[12px] text-[#990000] hover:underline font-medium"
                  >
                    + Add another location
                  </button>
                )}
                <p className="text-[11px] text-[#8a7f70] mt-1.5 leading-snug">
                  For "winters in FL," "summers on Cape Cod," etc. Up to 3 extra locations
                  — each appears on the Member Map.
                </p>
              </div>

              {/* On the Loop — current trip / passing through. Open to
                  everyone (players, alumni, coach, family) — the surface
                  only renders when you actually fill in a trip window. */}
              <div className="border-t border-[rgba(180,168,150,0.35)] pt-5 mt-1">
                <div className="flex items-baseline justify-between mb-1">
                  <label className="block text-xs font-medium text-[#4a5568]">
                    On the loop <span className="text-[#8a7f70] font-normal italic">— passing through somewhere?</span>
                  </label>
                  {(inTownCity || inTownState || inTownStart || inTownEnd || inTownNote) && (
                    <button
                      type="button"
                      onClick={() => {
                        setInTownCity('')
                        setInTownState('')
                        setInTownStart('')
                        setInTownEnd('')
                        setInTownNote('')
                      }}
                      className="text-[11px] text-[#990000] hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <CityStateInput
                  city={inTownCity}
                  state={inTownState}
                  onChange={({ city: c, state: s }) => {
                    setInTownCity(c)
                    setInTownState(s)
                  }}
                />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input
                    type="date"
                    value={inTownStart}
                    onChange={(e) => setInTownStart(e.target.value)}
                    className="border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                  />
                  <input
                    type="date"
                    value={inTownEnd}
                    onChange={(e) => setInTownEnd(e.target.value)}
                    className="border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                  />
                </div>
                <input
                  type="text"
                  value={inTownNote}
                  onChange={(e) => setInTownNote(e.target.value)}
                  placeholder="e.g. open to a round at Winged Foot · drinks Friday night"
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] mt-2 focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                />
                <p className="text-[11px] text-[#8a7f70] mt-1.5 leading-snug">
                  Surfaces on the Clubhouse for any Penn Golf alum in that city. Auto-clears after the end date.
                </p>
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

          {/* Golf — open to everyone. Parents/affiliates may not have a
              Penn Golf playing history, but they're welcome to add a
              home course and favorites. The "Favorite Penn Golf memory"
              field is the only player-specific bit — hide it for them. */}
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-1">
              Golf
            </p>
            <p className="text-xs text-[#8a7f70] mb-4">
              {isParent
                ? 'Optional — share a home course or favorites if you have them.'
                : 'Used on The Course and to surface you to alumni wanting to play near you.'}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">
                  Home course
                  {!isParent && !noHomeCourse && (
                    <span className="text-[#990000]"> *</span>
                  )}
                </label>
                <CourseAutocomplete
                  value={homeCourse}
                  onChange={setHomeCourse}
                  placeholder="e.g. Winged Foot Golf Club"
                  disabled={noHomeCourse}
                  required={!isParent && !noHomeCourse}
                />
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noHomeCourse}
                    onChange={e => {
                      setNoHomeCourse(e.target.checked)
                      if (e.target.checked) setHomeCourse('')
                    }}
                    className="w-3.5 h-3.5 accent-[#0a1628] cursor-pointer"
                  />
                  <span className="text-[11.5px] text-[#3d4a5c]">
                    I&rsquo;m not a member at a course
                  </span>
                </label>
              </div>
              {/* Handicap — required for non-parents. Chip presets for
                  "Scratch" and "Beginner / Learning", plus a free-form
                  input for an actual index ("12.4"). The presets just
                  set the input value; nothing fancy needed. */}
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">
                  Handicap
                  {!isParent && <span className="text-[#990000]"> *</span>}
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(['Scratch', 'Beginner / Learning'] as const).map(preset => {
                    const active = handicap.trim() === preset
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setHandicap(preset)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                          active
                            ? 'bg-[#0a1628] text-white border-[#0a1628]'
                            : 'bg-white text-[#0a1628] border-[rgba(180,168,150,0.5)] hover:border-[#0a1628]'
                        }`}
                      >
                        {preset}
                      </button>
                    )
                  })}
                </div>
                <input
                  type="text"
                  value={handicap}
                  onChange={e => setHandicap(e.target.value.slice(0, 32))}
                  placeholder="Enter your index (e.g. 12.4) or pick above"
                  required={!isParent}
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
                  placeholder="Type to autocomplete; comma to add another"
                  list="penn-golf-courses-datalist"
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                />
                <datalist id="penn-golf-courses-datalist">
                  {US_GOLF_COURSES.slice(0, 60).map((c) => (
                    <option key={`${c.name}-${c.state}`} value={c.name}>
                      {c.state}
                    </option>
                  ))}
                </datalist>
              </div>
              {!isParent && (
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
              )}
            </div>
          </div>

          {/* Photo */}
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-1">
              Photo
            </p>
            <p className="text-xs text-[#8a7f70] mb-4">
              Shown on your Member Book card. Upload from your camera roll or paste a URL.
            </p>
            <PhotoUpload value={photoUrl} onChange={setPhotoUrl} label="Profile photo" />
            {!photoUrl && session?.user?.image && (
              <button
                type="button"
                onClick={() => setPhotoUrl(session.user!.image!)}
                className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#990000] hover:underline"
              >
                Use my Google photo &rarr;
              </button>
            )}
            {photoUrl && (
              <button
                type="button"
                onClick={() => setPhotoUrl('')}
                className="mt-2 ml-3 text-[11px] text-[#8a7f70] hover:text-[#0a1628]"
              >
                Clear
              </button>
            )}
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
              Visible to other approved Penn Golf members.{' '}
              <span className="text-[#990000] font-semibold">At least one</span>{' '}
              is required so people can actually reach you.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">
                  Public email
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
                  Phone
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
                  LinkedIn URL
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

          {/* What I'm open to — visible to every approved member. Drives the
              "Open to a Round" / "Open to Coffee" lists across the site. */}
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-1">
              What I&rsquo;m open to
            </p>
            <p className="text-xs text-[#8a7f70] mb-4">
              These ticks decide whether you show up on The Course (hosting / joining a round), in 19th Hole &ldquo;Open to Coffee,&rdquo; and on mentorship + intro lists.
            </p>
            <div className="space-y-2.5">
              {[
                { label: 'Open to hosting or joining a round', value: openToGolfRounds, set: setOpenToGolfRounds },
                { label: 'Open to coffee', value: openToCoffee, set: setOpenToCoffee },
                { label: 'Open to mentorship', value: openToMentorship, set: setOpenToMentorship },
                { label: 'Open to warm introductions', value: openToWarmIntroductions, set: setOpenToWarmIntroductions },
              ].map(({ label, value, set }) => (
                <label key={label} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={e => set(e.target.checked)}
                    className="mt-0.5 accent-[#0a1628]"
                  />
                  <span className="text-sm text-[#0a1628]">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* How I can help — alumni-only. Current players don't offer
              mentorship/intros to alumni; alumni offer it to them. */}
          {!isCurrentPlayer && (
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
          )}

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

          {/* Save row + next-step affordances. After a successful save
              we surface a small bar of follow-up actions so the member
              has somewhere obvious to go ("see what I just saved" /
              "browse the Member Book" / "back to the Clubhouse") rather
              than staring at the editor wondering what's next. */}
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
            {error && !saving && (
              <span className="text-sm text-[#990000]">{error}</span>
            )}
          </div>

          {saved && (
            <div
              className="mt-5 bg-[#2d6a4f]/8 border border-[#2d6a4f]/25 rounded-xl px-5 py-4"
              role="status"
            >
              <p className="text-[13px] font-semibold text-[#2d6a4f] mb-3">
                Changes saved.
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href={
                    profile.bookId
                      ? `/member-book/${encodeURIComponent(profile.bookId)}`
                      : `/player/alumni/${encodeURIComponent(profile.personId)}`
                  }
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] bg-[#0a1628] hover:bg-[#112240] text-white px-4 py-2 rounded-lg transition-colors"
                >
                  View your card &rarr;
                </Link>
                <Link
                  href="/member-book"
                  className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0a1628] border border-[#0a1628]/25 hover:bg-[#0a1628] hover:text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Member Book
                </Link>
                <Link
                  href="/player"
                  className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#3d4a5c] hover:text-[#0a1628]"
                >
                  Back to the Clubhouse
                </Link>
              </div>
            </div>
          )}
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
