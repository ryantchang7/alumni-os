'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { scoreAndSort, generateDraft, type ProfileForScoring, type ScoredProfile } from '@/lib/ask/scoring'

// ── Constants ─────────────────────────────────────────────────────────────────

const PURPOSES = [
  { key: 'career_advice', label: 'Career advice', desc: 'Get perspective on industries, career paths, or roles.' },
  { key: 'warm_introduction', label: 'Warm introduction', desc: 'Ask a member to introduce you to someone in their network.' },
  { key: 'interview_prep', label: 'Interview prep', desc: 'Get advice on consulting, banking, or other recruiting processes.' },
  { key: 'resume_review', label: 'Resume review', desc: 'Get feedback on your resume before applying.' },
  { key: 'internship_guidance', label: 'Internship guidance', desc: 'Get advice on finding and landing a strong summer role.' },
  { key: 'coffee_chat', label: 'Coffee chat', desc: 'A casual conversation to learn more about a member\'s experience.' },
  { key: 'golf_round', label: 'Golf round', desc: 'Play a round with a member who is open to it.' },
  { key: 'city_advice', label: 'City advice', desc: 'Ask for recommendations from a member who lives somewhere you\'re headed.' },
  { key: 'mentorship', label: 'Long-term mentorship', desc: 'Find a member willing to stay in touch as a mentor.' },
]

const CONTEXTS = [
  { key: 'exploring_field', label: 'I\'m exploring this field' },
  { key: 'applying_to_role', label: 'I\'m applying to a role' },
  { key: 'in_their_city', label: 'I\'ll be in their city' },
  { key: 'learn_their_path', label: 'I\'d like to learn about their path' },
  { key: 'referred', label: 'I was referred by a teammate or coach' },
  { key: 'want_to_play', label: 'I want to play a round' },
  { key: 'summer_advice', label: 'I\'m looking for summer advice' },
  { key: 'preparing_interviews', label: 'I\'m preparing for interviews' },
]

const PURPOSE_PARAM_MAP: Record<string, string> = {
  career_advice: 'career_advice',
  warm_intro: 'warm_introduction',
  golf_round: 'golf_round',
  coffee_chat: 'coffee_chat',
  mentorship: 'mentorship',
  interview_prep: 'interview_prep',
  resume_review: 'resume_review',
  internship_guidance: 'internship_guidance',
  city_advice: 'city_advice',
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ApiProfile {
  personId: string
  canonicalName: string
  firstName?: string
  memberRole: 'current_player' | 'alumni'
  classLabel?: string
  rosterStartYear?: number
  rosterEndYear?: number
  hometown?: string
  career?: { currentRole?: string; currentCompany?: string; city?: string }
  helpTopics?: string[]
  openToCoffee?: boolean
  openToMentorship?: boolean
  openToWarmIntroductions?: boolean
  openToGolfRounds?: boolean
  availabilityLevel?: string
  contactPreference?: string
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepBar({ step }: { step: number }) {
  const labels = ['What you need', 'Context', 'Choose member', 'Send request']
  return (
    <div className="flex items-center gap-0 mb-8">
      {labels.map((label, i) => {
        const n = i + 1
        const done = step > n
        const active = step === n
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  done
                    ? 'bg-[#2d6a4f] text-white'
                    : active
                      ? 'bg-[#0a1628] text-white'
                      : 'bg-[#e8e3db] text-[#8a7f70]'
                }`}
              >
                {done ? '✓' : n}
              </div>
              <p className={`text-[10px] mt-1 whitespace-nowrap hidden sm:block ${active ? 'text-[#0a1628] font-medium' : 'text-[#8a7f70]'}`}>
                {label}
              </p>
            </div>
            {i < 3 && (
              <div className={`flex-1 h-px mx-2 ${step > n ? 'bg-[#2d6a4f]' : 'bg-[#e8e3db]'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Member card (step 3) ──────────────────────────────────────────────────────

function MemberCard({
  profile,
  selected,
  onSelect,
}: {
  profile: ScoredProfile
  selected: boolean
  onSelect: () => void
}) {
  const initial = profile.canonicalName.charAt(0).toUpperCase()
  const careerLine = profile.career?.currentRole && profile.career?.currentCompany
    ? `${profile.career.currentRole} at ${profile.career.currentCompany}`
    : profile.career?.currentRole ?? profile.career?.currentCompany ?? null
  const years = profile.rosterStartYear
    ? profile.rosterEndYear
      ? `${profile.rosterStartYear}–${String(profile.rosterEndYear).slice(-2)}`
      : String(profile.rosterStartYear)
    : null

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-xl p-4 border transition-all ${
        selected
          ? 'border-[#0a1628] bg-[#0a1628]/5 shadow-sm'
          : 'border-[rgba(180,168,150,0.4)] bg-white hover:border-[#0a1628]/40'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-[#0a1628] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-semibold">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-[#0a1628] text-sm">{profile.canonicalName}</p>
            {selected && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#0a1628] text-white">
                Selected
              </span>
            )}
            {profile.memberRole === 'current_player' && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#2d6a4f]/12 text-[#2d6a4f] border border-[#2d6a4f]/25">
                Current Player
              </span>
            )}
          </div>
          {(profile.classLabel || years) && (
            <p className="text-xs text-[#8a7f70] mt-0.5">
              {[profile.classLabel, years ? `Penn Golf ${years}` : null].filter(Boolean).join(' · ')}
            </p>
          )}
          {careerLine && (
            <p className="text-xs text-[#4a5568] mt-0.5">{careerLine}</p>
          )}
          <p className="text-xs text-[#8a7f70] italic mt-1.5">{profile.whyLine}</p>
        </div>
      </div>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AskClient() {
  const searchParams = useSearchParams()

  const paramPersonId = searchParams.get('personId') ?? ''
  const paramPurpose = searchParams.get('purpose') ?? ''
  const resolvedPurpose = PURPOSE_PARAM_MAP[paramPurpose] ?? ''

  const [step, setStep] = useState<1 | 2 | 3 | 4>(resolvedPurpose ? 2 : 1)
  const [purpose, setPurpose] = useState(resolvedPurpose)
  const [contextKey, setContextKey] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [selectedId, setSelectedId] = useState(paramPersonId)
  const [fromName, setFromName] = useState('')
  const [draft, setDraft] = useState('')
  const [profiles, setProfiles] = useState<ApiProfile[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/player/profiles?teamSlug=penn-mens-golf')
      .then(r => r.ok ? r.json() : { profiles: [] })
      .then(d => {
        setProfiles(d.profiles ?? [])
        setLoadingProfiles(false)
      })
      .catch(() => setLoadingProfiles(false))
  }, [])

  const scoredProfiles: ScoredProfile[] = purpose && contextKey
    ? scoreAndSort(profiles as ProfileForScoring[], purpose, contextKey)
    : purpose
      ? scoreAndSort(profiles as ProfileForScoring[], purpose, '')
      : []

  const selectedProfile = profiles.find(p => p.personId === selectedId) as ProfileForScoring | undefined

  const buildDraft = useCallback(() => {
    if (!selectedProfile || !purpose) return
    setDraft(generateDraft({
      purpose,
      contextKey,
      additionalContext,
      fromName,
      profile: selectedProfile,
    }))
  }, [selectedProfile, purpose, contextKey, additionalContext, fromName])

  function goToStep(s: 1 | 2 | 3 | 4) {
    if (s === 4) buildDraft()
    setStep(s)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    if (!selectedId || !draft.trim() || !fromName.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/player/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamSlug: 'penn-mens-golf',
          alumniPersonId: selectedId,
          fromName: fromName.trim(),
          purpose,
          context: contextKey || undefined,
          additionalContext: additionalContext.trim() || undefined,
          message: draft.trim(),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to send request')
      }
      setSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const purposeObj = PURPOSES.find(p => p.key === purpose)
  const contextObj = CONTEXTS.find(c => c.key === contextKey)

  // ── Submitted state ──────────────────────────────────────────────────────────
  if (submitted) {
    const first = selectedProfile?.firstName ?? selectedProfile?.canonicalName.split(' ')[0] ?? 'them'
    return (
      <div className="min-h-screen bg-[#f8f5f0]">
        <div className="bg-[#0a1628] px-6 sm:px-8 pt-10 pb-14">
          <div className="max-w-[680px] mx-auto">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Penn Golf · Clubhouse</p>
            <h1 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight">Request sent.</h1>
            <p className="text-gray-400 text-sm mt-2">Your request has been delivered to {first}.</p>
          </div>
        </div>
        <div className="max-w-[680px] mx-auto px-6 sm:px-8 py-10">
          <div className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-8 text-center"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}>
            <p className="text-base font-semibold text-[#0a1628] mb-2">Your request has been sent.</p>
            <p className="text-sm text-[#8a7f70] max-w-sm mx-auto mb-6">
              {first} will see your message in their Clubhouse inbox. Give it a few days — Penn Golf members are busy.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                href={`/player/requests?fromName=${encodeURIComponent(fromName.trim())}`}
                className="text-sm font-semibold text-white bg-[#0a1628] px-5 py-2.5 rounded-lg hover:bg-[#0a1628]/85 transition-colors"
              >
                View your requests &rarr;
              </Link>
              <Link href="/player/search" className="text-sm font-medium text-[#0a1628] border border-[rgba(180,168,150,0.6)] px-5 py-2.5 rounded-lg hover:border-[#0a1628] transition-colors bg-white">
                Browse more members
              </Link>
              <Link href="/player" className="text-sm font-medium text-[#0a1628] border border-[rgba(180,168,150,0.6)] px-5 py-2.5 rounded-lg hover:border-[#0a1628] transition-colors bg-white">
                Back to Clubhouse
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Header */}
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-10 pb-14">
        <div className="max-w-[680px] mx-auto">
          <Link href="/player" className="text-xs text-gray-400 hover:text-gray-200 mb-3 inline-block">
            &larr; Clubhouse
          </Link>
          <h1 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight mt-1">Ask for Help</h1>
          <p className="text-gray-400 text-sm mt-2">
            Send a thoughtful request to a Penn Golf member in a few steps.
          </p>
        </div>
      </div>

      <div className="max-w-[680px] mx-auto px-6 sm:px-8 py-8">
        <div className="-mt-5 relative z-10">
          <StepBar step={step} />

          {/* ── Step 1: Purpose ───────────────────────────────────────────── */}
          {step === 1 && (
            <div className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}>
              <h2 className="text-base font-semibold text-[#0a1628] mb-1">What are you looking for?</h2>
              <p className="text-xs text-[#8a7f70] mb-5">Choose what kind of help you need from a Penn Golf member.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PURPOSES.map(p => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPurpose(p.key)}
                    className={`text-left rounded-lg px-4 py-3 border transition-all ${
                      purpose === p.key
                        ? 'border-[#0a1628] bg-[#0a1628]/5'
                        : 'border-[rgba(180,168,150,0.4)] hover:border-[#0a1628]/40'
                    }`}
                  >
                    <p className="font-medium text-[#0a1628] text-sm">{p.label}</p>
                    <p className="text-xs text-[#8a7f70] mt-0.5 leading-snug">{p.desc}</p>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  disabled={!purpose}
                  onClick={() => goToStep(2)}
                  className="text-sm font-semibold bg-[#0a1628] text-white px-6 py-2.5 rounded-lg disabled:opacity-40 hover:bg-[#0a1628]/85 transition-colors"
                >
                  Continue &rarr;
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Context ───────────────────────────────────────────── */}
          {step === 2 && (
            <div className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}>
              <div className="flex items-center gap-2 mb-1">
                <button type="button" onClick={() => goToStep(1)} className="text-xs text-[#990000] hover:underline">
                  &larr; Back
                </button>
                {purposeObj && (
                  <span className="text-xs font-medium text-[#8a7f70]">· {purposeObj.label}</span>
                )}
              </div>
              <h2 className="text-base font-semibold text-[#0a1628] mb-1 mt-2">What is the context?</h2>
              <p className="text-xs text-[#8a7f70] mb-5">This helps us suggest the right member and write a better message.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CONTEXTS.map(c => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setContextKey(c.key)}
                    className={`text-left rounded-lg px-4 py-3 border transition-all ${
                      contextKey === c.key
                        ? 'border-[#0a1628] bg-[#0a1628]/5'
                        : 'border-[rgba(180,168,150,0.4)] hover:border-[#0a1628]/40'
                    }`}
                  >
                    <p className="font-medium text-[#0a1628] text-sm">{c.label}</p>
                  </button>
                ))}
              </div>

              {/* Additional context */}
              <div className="mt-5">
                <label className="block text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-2">
                  Anything else we should know? <span className="font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  data-testid="additional-context-box"
                  value={additionalContext}
                  onChange={e => setAdditionalContext(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder={'E.g. "I\'m applying to Goldman sophomore summer roles." or "I\'ll be in New York this summer." or "Coach said you might be a good person to ask."'}
                  className="w-full text-sm text-[#0a1628] placeholder-[#b5ad9e] bg-[#f8f5f0] border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-3 resize-none focus:outline-none focus:border-[#0a1628] transition-colors"
                />
                <p className="text-[11px] text-[#8a7f70] mt-1">
                  This will be woven into your request message naturally.
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  disabled={!contextKey}
                  onClick={() => goToStep(3)}
                  className="text-sm font-semibold bg-[#0a1628] text-white px-6 py-2.5 rounded-lg disabled:opacity-40 hover:bg-[#0a1628]/85 transition-colors"
                >
                  Continue &rarr;
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Choose member ─────────────────────────────────────── */}
          {step === 3 && (
            <div className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}>
              <div className="flex items-center gap-2 mb-1">
                <button type="button" onClick={() => goToStep(2)} className="text-xs text-[#990000] hover:underline">
                  &larr; Back
                </button>
                {purposeObj && contextObj && (
                  <span className="text-xs font-medium text-[#8a7f70]">
                    · {purposeObj.label} · {contextObj.label}
                  </span>
                )}
              </div>
              <h2 className="text-base font-semibold text-[#0a1628] mb-1 mt-2">Choose a Penn Golf member</h2>
              <p className="text-xs text-[#8a7f70] mb-5">Sorted by fit for your request. Pick whoever feels right.</p>

              {loadingProfiles ? (
                <p className="text-sm text-[#8a7f70] py-6 text-center">Loading members…</p>
              ) : scoredProfiles.length === 0 ? (
                <p className="text-sm text-[#8a7f70] py-6 text-center">No members available. Try a different purpose.</p>
              ) : (
                <div className="space-y-2.5">
                  {scoredProfiles.map(p => (
                    <MemberCard
                      key={p.personId}
                      profile={p}
                      selected={selectedId === p.personId}
                      onSelect={() => setSelectedId(p.personId)}
                    />
                  ))}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  disabled={!selectedId}
                  onClick={() => goToStep(4)}
                  className="text-sm font-semibold bg-[#0a1628] text-white px-6 py-2.5 rounded-lg disabled:opacity-40 hover:bg-[#0a1628]/85 transition-colors"
                >
                  Continue &rarr;
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Edit and send ─────────────────────────────────────── */}
          {step === 4 && (
            <div className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}>
              <div className="flex items-center gap-2 mb-1">
                <button type="button" onClick={() => goToStep(3)} className="text-xs text-[#990000] hover:underline">
                  &larr; Back
                </button>
                {selectedProfile && (
                  <span className="text-xs font-medium text-[#8a7f70]">
                    · To {selectedProfile.canonicalName}
                  </span>
                )}
              </div>
              <h2 className="text-base font-semibold text-[#0a1628] mb-1 mt-2">Review and send your request</h2>
              <p className="text-xs text-[#8a7f70] mb-5">Edit the message below until it sounds like you.</p>

              {/* Draft */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-2">
                  Your message
                </label>
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  rows={10}
                  maxLength={2000}
                  className="w-full text-sm text-[#0a1628] bg-[#f8f5f0] border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-3 resize-y focus:outline-none focus:border-[#0a1628] transition-colors font-[inherit] leading-relaxed"
                />
                <p className="text-[11px] text-[#8a7f70] mt-1 text-right">{draft.length}/2000</p>
              </div>

              {/* From name */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-2">
                  Your name
                </label>
                <input
                  type="text"
                  value={fromName}
                  onChange={e => setFromName(e.target.value)}
                  placeholder="Your name"
                  maxLength={100}
                  className="w-full text-sm text-[#0a1628] placeholder-[#b5ad9e] bg-[#f8f5f0] border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-3 focus:outline-none focus:border-[#0a1628] transition-colors"
                />
              </div>

              {error && (
                <p className="text-sm text-[#990000] mb-4">{error}</p>
              )}

              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-[#8a7f70]">
                  {selectedProfile?.canonicalName} will see this in their Clubhouse inbox.
                </p>
                <button
                  type="button"
                  disabled={submitting || !draft.trim() || !fromName.trim()}
                  onClick={handleSubmit}
                  className="text-sm font-semibold bg-[#990000] hover:bg-[#b30000] text-white px-6 py-2.5 rounded-lg disabled:opacity-40 transition-colors whitespace-nowrap"
                >
                  {submitting ? 'Sending…' : 'Send Request'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
