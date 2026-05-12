'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface AlumniProfileEntry {
  personId: string
  canonicalName: string
  normalizedName: string
  firstName?: string
  lastName?: string
  classLabel?: string
  rosterStartYear?: number
  rosterEndYear?: number
  rosterYearsLabel: string
  hometown?: string
  highSchool?: string
  bioUrls: string[]
  sourceUrls: string[]
  confidence: number
  evidenceCount: number
  seasons: string[]
  status: 'ready' | 'needs-enrichment' | 'needs-review'
  missingFields: string[]
  enrichment?: {
    currentRole?: string
    currentCompany?: string
    city?: string
    verificationStatus: 'unverified' | 'source_backed' | 'manually_verified' | 'needs_review'
  }
}

type Purpose = 'career_advice' | 'golf_round' | 'mentorship' | 'alumni_event'
type Tone = 'casual' | 'polished' | 'concise'

const purposeOptions: { value: Purpose; label: string }[] = [
  { value: 'career_advice', label: 'Career advice' },
  { value: 'golf_round', label: 'Golf round' },
  { value: 'mentorship', label: 'Mentorship' },
  { value: 'alumni_event', label: 'Alumni event' },
]

const toneOptions: { value: Tone; label: string }[] = [
  { value: 'casual', label: 'Casual' },
  { value: 'polished', label: 'Polished' },
  { value: 'concise', label: 'Concise' },
]

function hasVerifiedCareer(profile: AlumniProfileEntry): boolean {
  return (
    !!profile.enrichment &&
    (profile.enrichment.verificationStatus === 'source_backed' ||
      profile.enrichment.verificationStatus === 'manually_verified') &&
    !!(profile.enrichment.currentRole || profile.enrichment.currentCompany)
  )
}

function buildDraft(
  profile: AlumniProfileEntry,
  purpose: Purpose,
  tone: Tone,
): string {
  const firstName = profile.firstName ?? profile.canonicalName.split(' ')[0]
  const rosterYears =
    profile.rosterYearsLabel !== '—'
      ? `Penn Golf ${profile.rosterYearsLabel}`
      : 'Penn Golf'
  const hometownLine =
    profile.hometown
      ? `I noticed you're from ${profile.hometown} — `
      : ''

  const closings: Record<Tone, string> = {
    casual: 'Go Quakers!\n[Your name]',
    polished: 'Thank you for your time.\n[Your name]',
    concise: '[Your name]',
  }

  const closing = closings[tone]
  const verifiedCareer = hasVerifiedCareer(profile)
  const company = profile.enrichment?.currentCompany
  const role = profile.enrichment?.currentRole

  if (purpose === 'career_advice') {
    if (tone === 'casual') {
      return `Hi ${firstName},\n\nI'm a current member of Penn Golf and came across your name in the team's roster history. ${hometownLine}I'd love to grab 15 minutes to hear about your path after Penn if you're open to it. No pressure at all.\n\n${closing}`
    }
    if (tone === 'polished') {
      if (verifiedCareer) {
        return `Hi ${firstName},\n\nI'm a current member of ${rosterYears} at Penn and came across your name in the program's alumni history. I saw you're working in ${company ?? role ?? 'your field'} and I'm actively thinking through career paths — I would genuinely value 15–20 minutes of your time.\n\nNo obligation at all — I'm happy to work around your schedule.\n\n${closing}`
      }
      return `Hi ${firstName},\n\nI'm a current member of ${rosterYears} at Penn and came across your name in the program's alumni history. I'm actively thinking through career paths and would genuinely value 15–20 minutes of your time to hear about your experience after graduation.\n\nNo obligation at all — I'm happy to work around your schedule.\n\n${closing}`
    }
    return `Hi ${firstName},\n\nPenn Golf current player here. ${hometownLine}Would love 15 minutes to hear about your path after Penn whenever works for you.\n\n${closing}`
  }

  if (purpose === 'golf_round') {
    if (tone === 'casual') {
      return `Hey ${firstName},\n\nI'm on Penn Golf right now and your name came up in the team's history. ${hometownLine}Would love to play a round sometime if you're ever in the area — totally no pressure!\n\n${closing}`
    }
    if (tone === 'polished') {
      return `Hi ${firstName},\n\nI'm currently a member of ${rosterYears} and came across your name in the program's alumni records. I'd love to connect over a round of golf if you're ever interested — it would be a great way to stay connected with the Penn Golf community.\n\n${closing}`
    }
    return `Hi ${firstName}, Penn Golf here. ${hometownLine}Up for a round sometime? No rush.\n\n${closing}`
  }

  if (purpose === 'mentorship') {
    if (tone === 'casual') {
      return `Hi ${firstName},\n\nI'm a current Penn golfer and found your name in the team's alumni records. ${hometownLine}I'd love to hear about your path after Penn and any advice you'd share — even 20 minutes would mean a lot. No pressure at all.\n\n${closing}`
    }
    if (tone === 'polished') {
      if (verifiedCareer) {
        return `Hi ${firstName},\n\nI'm currently a member of ${rosterYears} and came across your name in the program's history. I saw you're working in ${company ?? role ?? 'your field'} and I'm navigating some important decisions about my path after graduation — I would be very grateful for even a brief conversation.\n\nNo obligation whatsoever — I appreciate you considering it.\n\n${closing}`
      }
      return `Hi ${firstName},\n\nI'm currently a member of ${rosterYears} and came across your name in the program's history. I'm navigating some important decisions about my path after graduation and would be very grateful for even a brief conversation with you.\n\nNo obligation whatsoever — I appreciate you considering it.\n\n${closing}`
    }
    return `Hi ${firstName}, Penn Golf current player. ${hometownLine}Would love 20 minutes of mentorship advice when you have time.\n\n${closing}`
  }

  if (purpose === 'alumni_event') {
    if (tone === 'casual') {
      return `Hey ${firstName},\n\nI'm on Penn Golf and we're thinking about organizing an alumni gathering. ${hometownLine}Would you be interested in staying connected and potentially joining? Totally no commitment — just gauging interest.\n\n${closing}`
    }
    if (tone === 'polished') {
      return `Hi ${firstName},\n\nI'm a current member of ${rosterYears} and we're exploring an alumni event for the program. Your name came up and we'd love to extend an invitation. There's no commitment required — we're simply reaching out to reconnect with the alumni community.\n\n${closing}`
    }
    return `Hi ${firstName}, Penn Golf alumni event coming up — interested in connecting? No commitment needed.\n\n${closing}`
  }

  return `Hi ${firstName},\n\nI'm a current member of Penn Golf and came across your name in the team's alumni records. I'd love to connect.\n\n${closing}`
}

export default function PlayerOutreachPage() {
  const params = useParams()
  const id = params.id as string

  const [profile, setProfile] = useState<AlumniProfileEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [purpose, setPurpose] = useState<Purpose>('career_advice')
  const [tone, setTone] = useState<Tone>('polished')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch(`/api/alumni/profiles/${id}?teamSlug=penn-mens-golf`)
      .then(r => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null }
        return r.json()
      })
      .then(data => {
        if (!data) return
        // Map the detail response shape to AlumniProfileEntry
        const p: AlumniProfileEntry = {
          personId: data.person.id,
          canonicalName: data.person.canonicalName,
          normalizedName: data.person.canonicalName?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? '',
          firstName: data.person.firstName,
          lastName: data.person.lastName,
          classLabel: data.membership?.classLabel,
          rosterStartYear: data.membership?.rosterStartYear,
          rosterEndYear: data.membership?.rosterEndYear,
          rosterYearsLabel:
            data.membership?.rosterStartYear && data.membership?.rosterEndYear
              ? `${data.membership.rosterStartYear}–${String(data.membership.rosterEndYear).slice(-2)}`
              : data.membership?.rosterStartYear
                ? String(data.membership.rosterStartYear)
                : '—',
          hometown: data.membership?.hometown,
          highSchool: data.membership?.highSchool,
          bioUrls: data.bioUrls ?? [],
          sourceUrls: data.sourceUrls ?? [],
          confidence: data.membership?.confidence ?? 0,
          evidenceCount: data.extractedEntries?.length ?? 0,
          seasons: [],
          status: (data.missingFields?.length ?? 0) > 0 ? 'needs-enrichment' : 'ready',
          missingFields: data.missingFields ?? [],
          enrichment: data.enrichment ? {
            currentRole: data.enrichment.currentRole,
            currentCompany: data.enrichment.currentCompany,
            city: data.enrichment.city,
            verificationStatus: data.enrichment.verificationStatus,
          } : undefined,
        }
        setProfile(p)
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [id])

  const draft = profile ? buildDraft(profile, purpose, tone) : ''

  function handleCopy() {
    if (!draft) return
    navigator.clipboard.writeText(draft).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center">
        <p className="text-sm text-[#8a7f70]">Loading profile...</p>
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-[#0a1628] mb-2">Profile not found</p>
          <Link href="/player/search" className="text-sm text-[#990000] hover:underline">
            &larr; Back to Search
          </Link>
        </div>
      </div>
    )
  }

  const confidencePct = Math.round(profile.confidence * 100)
  const rosterLabel =
    profile.rosterYearsLabel !== '—' ? `Penn Golf ${profile.rosterYearsLabel}` : 'Penn Golf'

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Navy header */}
      <div className="bg-[#0a1628] border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3 mb-3 text-xs">
            <Link href="/player" className="text-gray-400 hover:text-gray-200 transition-colors">
              &larr; Player
            </Link>
            <span className="text-gray-600">/</span>
            <Link href="/player/search" className="text-gray-400 hover:text-gray-200 transition-colors">
              Search
            </Link>
            <span className="text-gray-600">/</span>
            <Link
              href={`/player/alumni/${profile.personId}`}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              {profile.canonicalName}
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-300">Outreach</span>
          </div>
          <h1 className="text-white text-xl font-semibold">
            Draft outreach to {profile.canonicalName}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{rosterLabel}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Amber notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-xs text-amber-800 leading-relaxed">
            {profile.enrichment &&
            (profile.enrichment.verificationStatus === 'source_backed' ||
              profile.enrichment.verificationStatus === 'manually_verified')
              ? 'This draft can reference verified career details. Roster data is always included.'
              : 'This draft uses only verified roster data. Career, company, and LinkedIn details require enrichment.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Draft builder */}
          <div className="lg:col-span-2 space-y-5">
            {/* Controls */}
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-5"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <h3 className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wide mb-4">
                Configure
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#8a7f70] block mb-1.5">Purpose</label>
                  <select
                    value={purpose}
                    onChange={e => setPurpose(e.target.value as Purpose)}
                    className="w-full text-sm border border-[rgba(180,168,150,0.5)] rounded px-3 py-2 text-[#0a1628] focus:outline-none focus:ring-1 focus:ring-[#0a1628] bg-white"
                  >
                    {purposeOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#8a7f70] block mb-1.5">Tone</label>
                  <select
                    value={tone}
                    onChange={e => setTone(e.target.value as Tone)}
                    className="w-full text-sm border border-[rgba(180,168,150,0.5)] rounded px-3 py-2 text-[#0a1628] focus:outline-none focus:ring-1 focus:ring-[#0a1628] bg-white"
                  >
                    {toneOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Draft preview */}
            <div
              data-testid="outreach-draft-preview"
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-5"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wide">
                  Draft
                </h3>
                <button
                  onClick={handleCopy}
                  className="text-xs font-medium bg-[#0a1628] hover:bg-[#112240] text-white px-3 py-1.5 rounded transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="text-sm text-[#0a1628] leading-relaxed whitespace-pre-wrap font-sans">
                {draft}
              </pre>
            </div>

            <Link
              href={`/player/alumni/${profile.personId}`}
              className="inline-flex text-sm text-[#990000] hover:underline font-medium"
            >
              &larr; Back to {profile.firstName ?? profile.canonicalName}&apos;s profile
            </Link>
          </div>

          {/* Facts panel */}
          <div>
            <div
              data-testid="verified-facts-panel"
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-5 sticky top-6"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <h3 className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wide mb-4">
                Verified Facts
              </h3>
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
                {hasVerifiedCareer(profile) && (
                  <>
                    {profile.enrichment?.currentRole && (
                      <div>
                        <dt className="text-xs text-[#8a7f70] mb-0.5">Current Role</dt>
                        <dd className="font-medium text-[#0a1628]">{profile.enrichment.currentRole}</dd>
                      </div>
                    )}
                    {profile.enrichment?.currentCompany && (
                      <div>
                        <dt className="text-xs text-[#8a7f70] mb-0.5">Company</dt>
                        <dd className="font-medium text-[#0a1628]">{profile.enrichment.currentCompany}</dd>
                      </div>
                    )}
                    {profile.enrichment?.city && (
                      <div>
                        <dt className="text-xs text-[#8a7f70] mb-0.5">Location</dt>
                        <dd className="font-medium text-[#0a1628]">{profile.enrichment.city}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-xs text-[#8a7f70] mb-0.5">Verification</dt>
                      <dd>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            profile.enrichment?.verificationStatus === 'manually_verified'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {profile.enrichment?.verificationStatus === 'manually_verified'
                            ? 'Manually verified'
                            : 'Source backed'}
                        </span>
                      </dd>
                    </div>
                  </>
                )}
                <div>
                  <dt className="text-xs text-[#8a7f70] mb-0.5">Confidence</dt>
                  <dd
                    className={`font-medium ${
                      profile.confidence >= 0.8 ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {confidencePct}%
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#8a7f70] mb-0.5">Source URLs</dt>
                  <dd className="font-medium text-[#0a1628]">{profile.sourceUrls.length}</dd>
                </div>
              </dl>

              {profile.missingFields.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[rgba(180,168,150,0.2)]">
                  <p className="text-xs text-amber-700 font-medium mb-1">Missing:</p>
                  <ul className="space-y-0.5">
                    {profile.missingFields.map(f => (
                      <li key={f} className="text-xs text-amber-700">— {f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
