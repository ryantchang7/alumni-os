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

type Purpose =
  | 'career_advice'
  | 'coffee_chat'
  | 'mentorship'
  | 'warm_introduction'
  | 'internship_guidance'
  | 'interview_prep'
  | 'golf_round'
  | 'city_advice'
  | 'drinks_informal'
  | 'general_intro'

type Context =
  | 'exploring_field'
  | 'applying_to_role'
  | 'in_their_city'
  | 'learn_about_path'
  | 'referred_by_teammate'
  | 'want_to_play'

const PURPOSE_OPTIONS: { value: Purpose; label: string }[] = [
  { value: 'career_advice', label: 'Career advice' },
  { value: 'coffee_chat', label: 'Coffee chat' },
  { value: 'mentorship', label: 'Mentorship' },
  { value: 'warm_introduction', label: 'Warm introduction' },
  { value: 'internship_guidance', label: 'Internship guidance' },
  { value: 'interview_prep', label: 'Interview prep' },
  { value: 'golf_round', label: 'Golf round' },
  { value: 'city_advice', label: 'City advice' },
  { value: 'drinks_informal', label: 'Drinks / informal meet' },
  { value: 'general_intro', label: 'General intro' },
]

const CONTEXT_OPTIONS: { value: Context; label: string }[] = [
  { value: 'exploring_field', label: "I'm exploring this field" },
  { value: 'applying_to_role', label: "I'm applying to a role" },
  { value: 'in_their_city', label: "I'll be in their city soon" },
  { value: 'learn_about_path', label: "I'd like to learn about their path" },
  { value: 'referred_by_teammate', label: 'I was referred by a teammate or coach' },
  { value: 'want_to_play', label: "I'd love to play a round" },
]

function buildDraft(profile: PlayerProfile, purpose: Purpose, context: Context): string {
  const first = profile.firstName ?? profile.canonicalName.split(' ')[0]
  const company = profile.career?.currentCompany
  const role = profile.career?.currentRole
  const hasCareer = !!(profile.career && (role || company))
  const careerRef = hasCareer
    ? company
      ? `your path from Penn Golf to ${company}`
      : `your work in ${role}`
    : 'your path since Penn Golf'

  const referralLine =
    context === 'referred_by_teammate'
      ? ' A teammate pointed me your way and said you were someone worth reaching out to.'
      : ''

  const cityLine =
    context === 'in_their_city'
      ? " I'll actually be in your area soon and thought it could be a great chance to connect in person."
      : ''

  const applyingLine =
    context === 'applying_to_role'
      ? " I'm currently exploring opportunities in this space and your perspective would be really valuable."
      : ''

  const exploringLine =
    context === 'exploring_field'
      ? " I'm in the early stages of exploring this field and would love any honest perspective."
      : ''

  if (purpose === 'career_advice') {
    return `Hi ${first} —\n\nI'm a current Penn Golf player and came across your profile in the Clubhouse.${referralLine}${applyingLine}${exploringLine} I'd love to hear about ${careerRef} and any advice you might have for someone earlier in the process. Even 20 minutes would mean a lot.\n\nThanks for staying connected to the program.\n\n— [Your name]`
  }

  if (purpose === 'coffee_chat') {
    return `Hi ${first} —\n\nI'm a current Penn Golf player and found your profile in the Clubhouse.${referralLine}${cityLine} I'd love to connect over a quick coffee or call sometime — happy to work around your schedule entirely.\n\nThanks for being part of the network.\n\n— [Your name]`
  }

  if (purpose === 'mentorship') {
    return `Hi ${first} —\n\nI'm a current Penn Golf player and came across your profile in the Clubhouse.${referralLine}${exploringLine} I'm at a point where I'm thinking seriously about my path after Penn, and I'd be genuinely grateful for even a brief conversation. Hearing about ${careerRef} would help a lot.\n\nNo obligation at all — I appreciate you considering it.\n\n— [Your name]`
  }

  if (purpose === 'warm_introduction') {
    return `Hi ${first} —\n\nI'm a current Penn Golf player reaching out through the Clubhouse.${referralLine} I'm hoping you might be able to connect me with someone in your network${company ? ` at ${company}` : ''} — I'd be happy to share more context on what I'm looking for. Totally understand if it's not the right time.\n\nThanks for staying involved with the program.\n\n— [Your name]`
  }

  if (purpose === 'internship_guidance') {
    return `Hi ${first} —\n\nI'm a current Penn Golf player and found your profile in the Clubhouse.${referralLine}${applyingLine} I'm actively looking at internships${company ? ` in the ${company} space` : ''} and would really value any guidance you could share — even a quick note on what to look for or avoid.\n\nThanks for staying connected to Penn Golf.\n\n— [Your name]`
  }

  if (purpose === 'interview_prep') {
    return `Hi ${first} —\n\nI'm a current Penn Golf player reaching out through the Clubhouse.${referralLine}${applyingLine} I have an interview coming up${company ? ` for a role at a firm like ${company}` : ''} and I'd be really grateful for any prep advice or a quick chat. I know you're busy — even 15 minutes would make a real difference.\n\n— [Your name]`
  }

  if (purpose === 'golf_round') {
    return `Hi ${first} —\n\nI saw you're open to rounds in the Clubhouse. Would love to play sometime if you're ever in the area. No pressure at all — just thought it'd be great to stay connected on the course.\n\nThanks for supporting the program.\n\n— [Your name]`
  }

  if (purpose === 'city_advice') {
    return `Hi ${first} —\n\nI'm a current Penn Golf player and came across your profile in the Clubhouse.${referralLine} I'm planning to spend some time in your city and would love any advice on neighborhoods, things to do, or people to connect with. Even a few pointers would be super helpful.\n\n— [Your name]`
  }

  if (purpose === 'drinks_informal') {
    return `Hi ${first} —\n\nI'm a current Penn Golf player reaching out through the Clubhouse.${referralLine}${cityLine} Would love to grab a drink or meet up informally if you're around sometime. No agenda — just a chance to connect as part of the same program.\n\n— [Your name]`
  }

  // general_intro fallback
  return `Hi ${first} —\n\nI'm a current Penn Golf player and came across your profile in the Clubhouse.${referralLine} I'd love to introduce myself and stay connected — Penn Golf alumni mean a lot to the program and it'd be great to know you.\n\nThanks for staying part of the network.\n\n— [Your name]`
}

function OutreachPageInner() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const teamSlug = searchParams.get('teamSlug') ?? 'penn-mens-golf'
  const initialPurpose = (searchParams.get('purpose') as Purpose | null) ?? 'career_advice'

  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFoundState, setNotFoundState] = useState(false)

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [purpose, setPurpose] = useState<Purpose>(initialPurpose)
  const [context, setContext] = useState<Context>('learn_about_path')
  const [customMessage, setCustomMessage] = useState('')
  const [messageEdited, setMessageEdited] = useState(false)

  // Request form state
  const [fromName, setFromName] = useState('')
  const [fromEmail, setFromEmail] = useState('')
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

  const generatedDraft = profile ? buildDraft(profile, purpose, context) : ''

  useEffect(() => {
    if (!messageEdited) setCustomMessage(generatedDraft)
  }, [generatedDraft, messageEdited])

  const displayDraft = messageEdited ? customMessage : generatedDraft

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
          <Link href="/member-book" className="text-sm text-[#990000] hover:underline">
            &larr; Back to search
          </Link>
        </div>
      </div>
    )
  }

  const first = profile.firstName ?? profile.canonicalName.split(' ')[0]
  const rosterLabel =
    profile.rosterYearsLabel !== '—' ? `Penn Golf ${profile.rosterYearsLabel}` : 'Penn Golf'

  const purposeLabel = PURPOSE_OPTIONS.find(o => o.value === purpose)?.label ?? purpose

  const STEP_LABELS = ['What kind of request?', 'A bit of context', 'Your message']

  if (requestSent) {
    return (
      <div className="min-h-screen bg-[#f8f5f0]">
        <div className="bg-[#0a1628] border-b border-white/10">
          <div className="max-w-[680px] mx-auto px-6 py-5">
            <div className="flex items-center gap-3 mb-3 text-xs">
              <Link href="/player" className="text-gray-400 hover:text-gray-200 transition-colors">
                &larr; Player Mode
              </Link>
            </div>
            <h1 className="text-white text-xl font-semibold">Send a Clubhouse Request</h1>
            <p className="text-gray-400 text-sm mt-1">{profile.canonicalName}</p>
          </div>
        </div>
        <div className="max-w-[680px] mx-auto px-6 py-12">
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-8 text-center"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <p className="text-base font-semibold text-[#0a1628] mb-2">Request sent.</p>
            <p className="text-sm text-[#4a5568] leading-relaxed max-w-sm mx-auto">
              Your request has been saved. {first} will see it when they check their Clubhouse inbox. Email notifications are coming soon.
            </p>
            <Link
              href={`/player/alumni/${profile.personId}`}
              className="inline-block mt-6 text-sm font-medium text-[#990000] hover:underline"
            >
              &larr; Back to {first}&apos;s profile
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Header */}
      <div className="bg-[#0a1628] border-b border-white/10">
        <div className="max-w-[680px] mx-auto px-6 py-5">
          <div className="flex items-center gap-3 mb-3 text-xs">
            <Link href="/player" className="text-gray-400 hover:text-gray-200 transition-colors">
              &larr; Player Mode
            </Link>
            <span className="text-gray-600">/</span>
            <Link href={`/player/alumni/${profile.personId}`} className="text-gray-400 hover:text-gray-200 transition-colors">
              {profile.canonicalName}
            </Link>
          </div>
          <h1 className="text-white text-xl font-semibold">Send a Clubhouse Request</h1>
          <p className="text-gray-400 text-sm mt-1">{profile.canonicalName} &middot; {rosterLabel}</p>
        </div>
      </div>

      <div className="max-w-[680px] mx-auto px-6 py-8">
        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8">
          {STEP_LABELS.map((label, i) => {
            const s = (i + 1) as 1 | 2 | 3
            const active = step === s
            const done = step > s
            return (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                      done
                        ? 'bg-[#0a1628] text-white'
                        : active
                          ? 'bg-[#990000] text-white'
                          : 'bg-[rgba(180,168,150,0.3)] text-[#8a7f70]'
                    }`}
                  >
                    {done ? '✓' : s}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${active ? 'text-[#0a1628]' : 'text-[#8a7f70]'}`}>
                    {label}
                  </span>
                </div>
                {s < 3 && <div className="flex-1 h-px bg-[rgba(180,168,150,0.4)] mx-3" />}
              </div>
            )
          })}
        </div>

        <div className="space-y-4">

          {/* Step 1: Purpose */}
          <div
            className={`bg-white border rounded-xl p-6 transition-all ${step === 1 ? 'border-[#0a1628]/30' : 'border-[rgba(180,168,150,0.35)]'}`}
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider">
                Step 1 — What kind of request?
              </p>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-[#990000] hover:underline"
                >
                  Edit
                </button>
              )}
            </div>

            {step === 1 ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {PURPOSE_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => { setPurpose(o.value); setMessageEdited(false) }}
                      className={`text-left text-sm px-4 py-3 rounded-lg border transition-colors font-medium ${
                        purpose === o.value
                          ? 'border-[#990000] bg-[#990000]/5 text-[#990000]'
                          : 'border-[rgba(180,168,150,0.4)] hover:border-[#0a1628] text-[#0a1628]'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-sm font-semibold bg-[#0a1628] hover:bg-[#1a2a40] text-white px-5 py-2.5 rounded-lg transition-colors"
                  >
                    Continue &rarr;
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm font-medium text-[#0a1628]">{purposeLabel}</p>
            )}
          </div>

          {/* Step 2: Context */}
          {step >= 2 && (
            <div
              className={`bg-white border rounded-xl p-6 transition-all ${step === 2 ? 'border-[#0a1628]/30' : 'border-[rgba(180,168,150,0.35)]'}`}
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider">
                  Step 2 — A bit of context
                </p>
                {step > 2 && (
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs text-[#990000] hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>

              {step === 2 ? (
                <>
                  <div className="flex flex-col gap-2">
                    {CONTEXT_OPTIONS.map(o => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => { setContext(o.value); setMessageEdited(false) }}
                        className={`text-left text-sm px-4 py-3 rounded-lg border transition-colors ${
                          context === o.value
                            ? 'border-[#990000] bg-[#990000]/5 text-[#990000] font-medium'
                            : 'border-[rgba(180,168,150,0.4)] hover:border-[#0a1628] text-[#0a1628]'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="text-sm font-semibold bg-[#0a1628] hover:bg-[#1a2a40] text-white px-5 py-2.5 rounded-lg transition-colors"
                    >
                      Continue &rarr;
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm font-medium text-[#0a1628]">
                  {CONTEXT_OPTIONS.find(o => o.value === context)?.label}
                </p>
              )}
            </div>
          )}

          {/* Step 3: Message + send */}
          {step === 3 && (
            <div
              className="bg-white border border-[#0a1628]/30 rounded-xl p-6"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-4">
                Step 3 — Your message
              </p>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-[#8a7f70]">Edit as needed</label>
                  {messageEdited && (
                    <button
                      type="button"
                      onClick={() => { setCustomMessage(generatedDraft); setMessageEdited(false) }}
                      className="text-xs text-[#8a7f70] hover:text-[#0a1628]"
                    >
                      Reset draft
                    </button>
                  )}
                </div>
                <textarea
                  data-testid="outreach-draft-preview"
                  value={displayDraft}
                  onChange={e => { setCustomMessage(e.target.value); setMessageEdited(true) }}
                  rows={12}
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2.5 text-sm text-[#0a1628] focus:outline-none focus:ring-1 focus:ring-[#0a1628] bg-white font-sans leading-relaxed resize-none"
                />
              </div>

              {/* Sender info + submit */}
              <div className="border-t border-[rgba(180,168,150,0.25)] pt-5 mt-2 space-y-3">
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
                    Your email <span className="text-[#8a7f70]">(optional — for the alum to reply to)</span>
                  </label>
                  <input
                    type="email"
                    value={fromEmail}
                    onChange={e => setFromEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-1 focus:ring-[#0a1628]"
                  />
                </div>
                {requestError && (
                  <p className="text-xs text-[#990000]">{requestError}</p>
                )}
                <button
                  type="button"
                  onClick={handleSendRequest}
                  disabled={!fromName.trim() || submitting}
                  className="w-full text-sm font-semibold bg-[#990000] hover:bg-[#b30000] text-white py-3 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Sending…' : `Send request to ${first}`}
                </button>
              </div>
            </div>
          )}

          <Link
            href={`/player/alumni/${profile.personId}`}
            className="inline-flex text-sm text-[#990000] hover:underline font-medium"
          >
            &larr; Back to {first}&apos;s profile
          </Link>
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
