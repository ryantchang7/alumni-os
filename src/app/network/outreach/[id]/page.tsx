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
  career?: {
    currentRole?: string
    currentCompany?: string
    city?: string
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

function buildDraft(profile: PublishedProfile, purpose: Purpose, tone: Tone): string {
  const firstName = profile.firstName ?? profile.canonicalName.split(' ')[0]
  const rosterLabel =
    profile.rosterYearsLabel !== '—'
      ? `Penn Golf ${profile.rosterYearsLabel}`
      : 'Penn Golf'
  const hometownLine = profile.hometown ? `I noticed you're from ${profile.hometown} — ` : ''
  const hasCareer = !!(profile.career?.currentRole || profile.career?.currentCompany)
  const company = profile.career?.currentCompany
  const role = profile.career?.currentRole

  const closings: Record<Tone, string> = {
    casual: 'Go Quakers!\n[Your name]',
    polished: 'Thank you for your time.\n[Your name]',
    concise: '[Your name]',
  }
  const closing = closings[tone]

  if (purpose === 'career_advice') {
    if (tone === 'casual') {
      return `Hi ${firstName},\n\nI'm a current member of Penn Golf and came across your name in the team's alumni records. ${hometownLine}I'd love to grab 15 minutes to hear about your path after Penn if you're open to it. No pressure at all.\n\n${closing}`
    }
    if (tone === 'polished') {
      if (hasCareer) {
        return `Hi ${firstName},\n\nI'm a current member of ${rosterLabel} at Penn and came across your name in the program's alumni history. I saw you're working in ${company ?? role ?? 'your field'} and I'm actively thinking through career paths — I would genuinely value 15–20 minutes of your time.\n\nNo obligation at all — I'm happy to work around your schedule.\n\n${closing}`
      }
      return `Hi ${firstName},\n\nI'm a current member of ${rosterLabel} at Penn and came across your name in the program's alumni history. I'm actively thinking through career paths and would genuinely value 15–20 minutes of your time.\n\nNo obligation at all.\n\n${closing}`
    }
    return `Hi ${firstName},\n\nPenn Golf current player here. ${hometownLine}Would love 15 minutes to hear about your path after Penn.\n\n${closing}`
  }

  if (purpose === 'golf_round') {
    if (tone === 'casual') {
      return `Hey ${firstName},\n\nI'm on Penn Golf right now and your name came up in the team's alumni records. ${hometownLine}Would love to play a round sometime if you're ever in the area!\n\n${closing}`
    }
    if (tone === 'polished') {
      return `Hi ${firstName},\n\nI'm currently a member of ${rosterLabel} and came across your name in the program's alumni records. I'd love to connect over a round of golf if you're ever interested.\n\n${closing}`
    }
    return `Hi ${firstName}, Penn Golf here. ${hometownLine}Up for a round sometime?\n\n${closing}`
  }

  if (purpose === 'mentorship') {
    if (tone === 'casual') {
      return `Hi ${firstName},\n\nI'm a current Penn golfer and found your name in the team's alumni records. ${hometownLine}I'd love to hear about your path after Penn — even 20 minutes would mean a lot.\n\n${closing}`
    }
    if (tone === 'polished') {
      if (hasCareer) {
        return `Hi ${firstName},\n\nI'm currently a member of ${rosterLabel} and came across your name in the program's history. I saw you're working in ${company ?? role ?? 'your field'} and I'm navigating some important decisions about my path after graduation — I would be very grateful for even a brief conversation.\n\n${closing}`
      }
      return `Hi ${firstName},\n\nI'm currently a member of ${rosterLabel} and came across your name in the program's history. I'm navigating some important decisions about my path after graduation and would be very grateful for even a brief conversation.\n\n${closing}`
    }
    return `Hi ${firstName}, Penn Golf current player. ${hometownLine}Would love 20 minutes of advice.\n\n${closing}`
  }

  if (purpose === 'alumni_event') {
    if (tone === 'casual') {
      return `Hey ${firstName},\n\nI'm on Penn Golf and we're thinking about organizing an alumni gathering. ${hometownLine}Would you be interested?\n\n${closing}`
    }
    if (tone === 'polished') {
      return `Hi ${firstName},\n\nI'm a current member of ${rosterLabel} and we're exploring an alumni event for the program. Your name came up and we'd love to extend an invitation.\n\n${closing}`
    }
    return `Hi ${firstName}, Penn Golf alumni event coming up — interested?\n\n${closing}`
  }

  return `Hi ${firstName},\n\nI'm a current member of Penn Golf and came across your name in the team's alumni records. I'd love to connect.\n\n${closing}`
}

function NetworkOutreachInner() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const teamSlug = searchParams.get('teamSlug') ?? 'penn-mens-golf'

  const [profile, setProfile] = useState<PublishedProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [purpose, setPurpose] = useState<Purpose>('career_advice')
  const [tone, setTone] = useState<Tone>('polished')
  const [copied, setCopied] = useState(false)

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
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3 mb-3 text-xs">
            <Link href={`/network/alumni/${id}?teamSlug=${teamSlug}`} className="text-gray-400 hover:text-gray-200 transition-colors">
              &larr; {profile.canonicalName}
            </Link>
          </div>
          <h1 className="text-white text-xl font-semibold">
            Draft outreach to {profile.canonicalName}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{rosterLabel}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-5"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <h3 className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wide mb-4">Configure</h3>
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

            <div
              data-testid="network-outreach-draft"
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-5"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wide">Draft</h3>
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
              href={`/network/alumni/${profile.personId}?teamSlug=${teamSlug}`}
              className="inline-flex text-sm text-[#990000] hover:underline font-medium"
            >
              &larr; Back to {profile.firstName ?? profile.canonicalName}&apos;s profile
            </Link>
          </div>

          <div>
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-5 sticky top-6"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <h3 className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wide mb-4">Profile</h3>
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
                  </>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NetworkOutreachPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] flex items-center justify-center"><p className="text-sm text-[#8a7f70]">Loading...</p></div>}>
      <NetworkOutreachInner />
    </Suspense>
  )
}
