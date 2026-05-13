'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

interface PlayerProfile {
  personId: string
  canonicalName: string
  firstName?: string
  classLabel?: string
  rosterStartYear?: number
  rosterEndYear?: number
  rosterYearsLabel: string
  hometown?: string
  highSchool?: string
  career?: {
    currentRole?: string
    currentCompany?: string
    city?: string
  }
  helpTopics?: string[]
  contactPreference?: string
}

type Purpose = 'career_advice' | 'coffee_chat' | 'mentorship' | 'golf_connection'
type Tone = 'casual' | 'polished' | 'concise'

const PURPOSE_OPTIONS: { value: Purpose; label: string }[] = [
  { value: 'career_advice', label: 'Career advice' },
  { value: 'coffee_chat', label: 'Coffee chat' },
  { value: 'mentorship', label: 'Mentorship' },
  { value: 'golf_connection', label: 'Golf connection' },
]

const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: 'casual', label: 'Casual' },
  { value: 'polished', label: 'Polished' },
  { value: 'concise', label: 'Concise' },
]

const CLOSING: Record<Tone, string> = {
  casual: 'Go Quakers!\n[Your name]',
  polished: 'Thank you for your time.\n[Your name]',
  concise: '[Your name]',
}

function buildDraft(profile: PlayerProfile, purpose: Purpose, tone: Tone): string {
  const first = profile.firstName ?? profile.canonicalName.split(' ')[0]
  const rosterLabel =
    profile.rosterYearsLabel !== '—' ? `Penn Golf ${profile.rosterYearsLabel}` : 'Penn Golf'
  const hometown = profile.hometown ? `I noticed you're from ${profile.hometown} — ` : ''
  const company = profile.career?.currentCompany
  const role = profile.career?.currentRole
  const hasCareer = !!(profile.career && (role || company))
  const closing = CLOSING[tone]

  if (purpose === 'career_advice') {
    if (tone === 'casual') {
      return `Hi ${first},\n\nI'm a current member of Penn Golf and came across your name in the team's alumni records. ${hometown}I'd love to grab 15 minutes to hear about your path after Penn if you're open to it.\n\n${closing}`
    }
    if (tone === 'polished') {
      if (hasCareer) {
        return `Hi ${first},\n\nI'm a current member of ${rosterLabel} at Penn and came across your name in the program's alumni history. I saw you're working at ${company ?? role ?? 'your firm'} and I'm actively thinking through career paths — I would genuinely value 15–20 minutes of your time.\n\nNo obligation — I'm happy to work around your schedule.\n\n${closing}`
      }
      return `Hi ${first},\n\nI'm a current member of ${rosterLabel} at Penn and came across your name in the program's alumni history. I'm actively thinking through career paths and would genuinely value 15–20 minutes of your time.\n\nNo obligation — I'm happy to work around your schedule.\n\n${closing}`
    }
    return `Hi ${first},\n\nPenn Golf current player here. ${hometown}Would love 15 minutes to hear about your path after Penn.\n\n${closing}`
  }

  if (purpose === 'coffee_chat') {
    if (tone === 'casual') {
      return `Hey ${first},\n\nI'm on Penn Golf and your name came up in our alumni records. ${hometown}Would love to grab a quick coffee or call sometime — totally no pressure!\n\n${closing}`
    }
    if (tone === 'polished') {
      return `Hi ${first},\n\nI'm a current member of ${rosterLabel} and came across your name in the program's alumni history. I'd love to find 20–30 minutes to connect and hear about your experience after graduation.\n\nNo commitment required — I'm happy to work around your schedule.\n\n${closing}`
    }
    return `Hi ${first}, Penn Golf here. ${hometown}Up for a quick coffee or call sometime?\n\n${closing}`
  }

  if (purpose === 'mentorship') {
    if (tone === 'casual') {
      return `Hi ${first},\n\nI'm a current Penn golfer and came across your name in the team's alumni records. ${hometown}I'd love to hear about your path after Penn — even 20 minutes would mean a lot.\n\n${closing}`
    }
    if (tone === 'polished') {
      if (hasCareer) {
        return `Hi ${first},\n\nI'm currently a member of ${rosterLabel} and came across your name in the program's alumni history. I saw you're at ${company ?? role ?? 'your firm'} and I'm navigating some important decisions — I would be very grateful for even a brief conversation.\n\nNo obligation — I appreciate you considering it.\n\n${closing}`
      }
      return `Hi ${first},\n\nI'm currently a member of ${rosterLabel} and came across your name in the program's history. I'm navigating some important decisions and would be very grateful for even a brief conversation.\n\nNo obligation — I appreciate you considering it.\n\n${closing}`
    }
    return `Hi ${first}, Penn Golf current player. ${hometown}Would love 20 minutes of mentorship advice when you have time.\n\n${closing}`
  }

  if (purpose === 'golf_connection') {
    if (tone === 'casual') {
      return `Hey ${first},\n\nI'm on Penn Golf and your name came up in the team's alumni records. ${hometown}Would love to play a round or just stay connected — totally no pressure!\n\n${closing}`
    }
    if (tone === 'polished') {
      return `Hi ${first},\n\nI'm currently a member of ${rosterLabel} and came across your name in the program's alumni history. I'd love to connect with you as a fellow Penn golfer — whether that's a round, a quick chat, or just staying in touch.\n\n${closing}`
    }
    return `Hi ${first}, Penn Golf here. ${hometown}Would love to connect — even just to stay in touch.\n\n${closing}`
  }

  return `Hi ${first},\n\nI'm a current member of Penn Golf and came across your name in the team's alumni records. I'd love to connect.\n\n${closing}`
}

function OutreachPageInner() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const teamSlug = searchParams.get('teamSlug') ?? 'penn-mens-golf'

  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFoundState, setNotFoundState] = useState(false)
  const [purpose, setPurpose] = useState<Purpose>('career_advice')
  const [tone, setTone] = useState<Tone>('polished')
  const [copied, setCopied] = useState(false)

  // Request form state
  const [fromName, setFromName] = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [messageEdited, setMessageEdited] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/player/profiles/${id}?teamSlug=${teamSlug}`)
      .then(r => {
        if (!r.ok) { setNotFoundState(true); setLoading(false); return null }
        return r.json()
      })
      .then(data => {
        if (!data) return
        setProfile(data.profile)
        setLoading(false)
      })
      .catch(() => { setNotFoundState(true); setLoading(false) })
  }, [id, teamSlug])

  const generatedDraft = profile ? buildDraft(profile, purpose, tone) : ''
  const displayDraft = messageEdited ? customMessage : generatedDraft

  // Sync generated draft to custom message box when not manually edited
  useEffect(() => {
    if (!messageEdited) setCustomMessage(generatedDraft)
  }, [generatedDraft, messageEdited])

  function handleCopy() {
    if (!displayDraft) return
    navigator.clipboard.writeText(displayDraft).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleSendRequest() {
    if (!profile || !fromName.trim()) return
    setSubmitting(true)
    setRequestError(null)
    try {
      const res = await fetch('/api/player/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamSlug,
          alumniPersonId: profile.personId,
          fromName: fromName.trim(),
          fromEmail: fromEmail.trim() || undefined,
          purpose,
          message: displayDraft,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Failed to send request')
      }
      setRequestSent(true)
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : 'Failed to send request')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center">
        <p className="text-sm text-[#8a7f70]">Loading profile…</p>
      </div>
    )
  }

  if (notFoundState || !profile) {
    return (
      <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-[#0a1628] mb-2">Profile not found</p>
          <Link href="/player/search" className="text-sm text-[#990000] hover:underline">
            &larr; Back to search
          </Link>
        </div>
      </div>
    )
  }

  const first = profile.firstName ?? profile.canonicalName.split(' ')[0]
  const rosterLabel =
    profile.rosterYearsLabel !== '—' ? `Penn Golf ${profile.rosterYearsLabel}` : 'Penn Golf'

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] border-b border-white/10">
        <div className="max-w-[900px] mx-auto px-6 py-5">
          <div className="flex items-center gap-3 mb-3 text-xs">
            <Link href="/player" className="text-gray-400 hover:text-gray-200 transition-colors">
              &larr; Player Mode
            </Link>
            <span className="text-gray-600">/</span>
            <Link href={`/player/alumni/${profile.personId}`} className="text-gray-400 hover:text-gray-200 transition-colors">
              {profile.canonicalName}
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-300">Ask for help</span>
          </div>
          <h1 className="text-white text-xl font-semibold">Ask {first} for help</h1>
          <p className="text-gray-400 text-sm mt-1">{rosterLabel}</p>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: draft + request form */}
          <div className="lg:col-span-2 space-y-5">
            {/* Draft builder */}
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <h3 className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wide mb-4">
                Message
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-medium text-[#8a7f70] block mb-1.5">Purpose</label>
                  <select
                    value={purpose}
                    onChange={e => { setPurpose(e.target.value as Purpose); setMessageEdited(false) }}
                    className="w-full text-sm border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-[#0a1628] focus:outline-none focus:ring-1 focus:ring-[#0a1628] bg-white"
                  >
                    {PURPOSE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#8a7f70] block mb-1.5">Tone</label>
                  <select
                    value={tone}
                    onChange={e => { setTone(e.target.value as Tone); setMessageEdited(false) }}
                    className="w-full text-sm border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-[#0a1628] focus:outline-none focus:ring-1 focus:ring-[#0a1628] bg-white"
                  >
                    {TONE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-[#8a7f70]">Draft — edit as needed</label>
                  <button
                    onClick={handleCopy}
                    className="text-xs font-medium bg-[#f5f2ee] hover:bg-[#e8e3da] text-[#0a1628] px-3 py-1.5 rounded transition-colors border border-[rgba(180,168,150,0.5)]"
                  >
                    {copied ? 'Copied!' : 'Copy message'}
                  </button>
                </div>
                <textarea
                  data-testid="outreach-draft-preview"
                  value={displayDraft}
                  onChange={e => { setCustomMessage(e.target.value); setMessageEdited(true) }}
                  rows={12}
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2.5 text-sm text-[#0a1628] focus:outline-none focus:ring-1 focus:ring-[#0a1628] bg-white font-sans leading-relaxed resize-none"
                />
                {messageEdited && (
                  <button
                    onClick={() => { setCustomMessage(generatedDraft); setMessageEdited(false) }}
                    className="text-xs text-[#8a7f70] hover:text-[#0a1628] mt-1"
                  >
                    Reset to generated draft
                  </button>
                )}
              </div>
            </div>

            {/* Request form */}
            {!requestSent ? (
              <div
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
              >
                <h3 className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wide mb-4">
                  Send request
                </h3>
                <p className="text-xs text-[#8a7f70] mb-4 bg-[#faf8f5] border border-[rgba(180,168,150,0.35)] rounded-lg px-3 py-2.5 leading-relaxed">
                  This saves the request to {first}&apos;s inbox. Email delivery will be added soon.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#4a5568] mb-1">
                      Your name <span className="text-[#990000]">*</span>
                    </label>
                    <input
                      type="text"
                      value={fromName}
                      onChange={e => setFromName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-1 focus:ring-[#0a1628]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4a5568] mb-1">
                      Your email <span className="text-[#8a7f70]">(optional)</span>
                    </label>
                    <input
                      type="email"
                      value={fromEmail}
                      onChange={e => setFromEmail(e.target.value)}
                      placeholder="For the alum to reply to"
                      className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-1 focus:ring-[#0a1628]"
                    />
                  </div>
                  {requestError && (
                    <p className="text-xs text-[#990000]">{requestError}</p>
                  )}
                  <button
                    onClick={handleSendRequest}
                    disabled={!fromName.trim() || submitting}
                    className="w-full text-sm font-semibold bg-[#990000] hover:bg-[#b30000] text-white py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Sending…' : `Send request to ${first}`}
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="bg-emerald-50 border border-emerald-200 rounded-xl p-5"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
              >
                <p className="text-sm font-semibold text-emerald-800 mb-1">Request saved.</p>
                <p className="text-xs text-emerald-700">
                  Your request has been saved to {first}&apos;s inbox. You can also copy and send the message directly.
                </p>
              </div>
            )}

            <Link
              href={`/player/alumni/${profile.personId}`}
              className="inline-flex text-sm text-[#990000] hover:underline font-medium"
            >
              &larr; Back to {first}&apos;s profile
            </Link>
          </div>

          {/* Right: facts panel */}
          <div>
            <div
              data-testid="verified-facts-panel"
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5 sticky top-6"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <h3 className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wide mb-4">
                About {first}
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
                {profile.career?.currentRole && (
                  <div>
                    <dt className="text-xs text-[#8a7f70] mb-0.5">Role</dt>
                    <dd className="font-medium text-[#0a1628]">{profile.career.currentRole}</dd>
                  </div>
                )}
                {profile.career?.currentCompany && (
                  <div>
                    <dt className="text-xs text-[#8a7f70] mb-0.5">Company</dt>
                    <dd className="font-medium text-[#0a1628]">{profile.career.currentCompany}</dd>
                  </div>
                )}
                {profile.career && (
                  <div>
                    <dt className="text-xs text-[#8a7f70] mb-0.5">Career info</dt>
                    <dd>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                        Team verified
                      </span>
                    </dd>
                  </div>
                )}
              </dl>

              {profile.helpTopics && profile.helpTopics.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[rgba(180,168,150,0.2)]">
                  <p className="text-xs text-[#8a7f70] mb-2">Open to helping with</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.helpTopics.map(t => (
                      <span key={t} className="text-xs bg-[#f5f2ee] border border-[rgba(180,168,150,0.5)] text-[#0a1628] px-2 py-1 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PlayerOutreachPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center"><p className="text-sm text-[#8a7f70]">Loading…</p></div>}>
      <OutreachPageInner />
    </Suspense>
  )
}
