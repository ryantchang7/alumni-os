'use client'

import { useState } from 'react'

interface Props {
  memberId: string
  memberName: string
}

type Step = 'prompt' | 'form' | 'submitted'

export default function ClaimModule({ memberId, memberName }: Props) {
  const [step, setStep] = useState<Step>('prompt')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [years, setYears] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) { setError('Please add your name.'); return }
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email.'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/profile/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          requesterName: name.trim(),
          requesterEmail: email.trim(),
          pennGolfYears: years.trim() || undefined,
          note: note.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Error ${res.status}`)
      }
      setStep('submitted')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'submitted') {
    return (
      <div
        className="border-l-2 border-l-[#990000] bg-[#faf7f2] border border-[rgba(180,168,150,0.3)] rounded-r-xl px-6 py-5"
        style={{ boxShadow: '0 1px 4px rgba(10,22,40,0.04)' }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#990000] mb-2">
          Claim Request Saved
        </p>
        <p className="text-sm text-[#3d4a5c] leading-relaxed">
          A Penn Golf admin will review your request for{' '}
          <span className="font-medium">{memberName}</span>. You&rsquo;ll be contacted once it&rsquo;s been confirmed.
        </p>
      </div>
    )
  }

  if (step === 'prompt') {
    return (
      <div
        className="border-l-2 border-l-[rgba(180,168,150,0.6)] bg-[#faf7f2] border border-[rgba(180,168,150,0.3)] rounded-r-xl px-6 py-5"
        style={{ boxShadow: '0 1px 4px rgba(10,22,40,0.04)' }}
        data-testid="claim-module"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mb-1.5">
          Is This You?
        </p>
        <p className="text-sm text-[#3d4a5c] leading-relaxed mb-4 max-w-lg">
          Claim your Penn Golf Clubhouse profile to update your role, city, availability, and how you&rsquo;re open to helping.
        </p>
        <button
          onClick={() => setStep('form')}
          className="text-sm font-semibold text-[#0a1628] border border-[#0a1628]/20 bg-white hover:bg-[#0a1628] hover:text-white px-4 py-2 rounded-lg transition-colors"
        >
          Claim Profile
        </button>
      </div>
    )
  }

  return (
    <div
      className="border-l-2 border-l-[#990000] bg-[#faf7f2] border border-[rgba(180,168,150,0.3)] rounded-r-xl px-6 py-5"
      style={{ boxShadow: '0 1px 4px rgba(10,22,40,0.04)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#990000]">
          Claim Profile
        </p>
        <button
          onClick={() => setStep('prompt')}
          className="text-xs text-[#8a7f70] hover:text-[#0a1628] transition-colors"
          aria-label="Cancel claim"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="claim-name" className="block text-xs font-medium text-[#3d4a5c] mb-1">
              Your name
            </label>
            <input
              id="claim-name"
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={memberName}
              className="w-full bg-white border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] placeholder-[#b0a898] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/10 focus:border-[#0a1628]/25 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="claim-email" className="block text-xs font-medium text-[#3d4a5c] mb-1">
              Email address
            </label>
            <input
              id="claim-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] placeholder-[#b0a898] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/10 focus:border-[#0a1628]/25 transition-colors"
            />
          </div>
        </div>

        <div>
          <label htmlFor="claim-years" className="block text-xs font-medium text-[#3d4a5c] mb-1">
            Penn Golf years <span className="text-[#b0a898] font-normal">(optional)</span>
          </label>
          <input
            id="claim-years"
            type="text"
            value={years}
            onChange={e => setYears(e.target.value)}
            placeholder="e.g. 2012–2016"
            className="w-full bg-white border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] placeholder-[#b0a898] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/10 focus:border-[#0a1628]/25 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="claim-note" className="block text-xs font-medium text-[#3d4a5c] mb-1">
            Note <span className="text-[#b0a898] font-normal">(optional)</span>
          </label>
          <textarea
            id="claim-note"
            value={note}
            onChange={e => setNote(e.target.value)}
            maxLength={1000}
            placeholder="Anything that helps us verify your identity..."
            rows={2}
            className="w-full bg-white border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] placeholder-[#b0a898] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/10 focus:border-[#0a1628]/25 transition-colors resize-none"
          />
        </div>

        {error && (
          <p role="alert" className="text-xs text-[#990000]">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="text-sm font-semibold bg-[#0a1628] hover:bg-[#0a1628]/90 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg transition-colors"
        >
          {submitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  )
}
