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
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'prompt') {
    return (
      <div
        className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
        style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
      >
        <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-1">
          Is This You?
        </p>
        <p className="text-sm text-[#0a1628] mb-4">
          If this is your profile, you can request to claim it and add your career and contact details.
        </p>
        <button
          onClick={() => setStep('form')}
          className="text-sm font-semibold text-[#990000] hover:underline"
        >
          Claim this profile &rarr;
        </button>
      </div>
    )
  }

  if (step === 'submitted') {
    return (
      <div
        className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
        style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
      >
        <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-1">
          Request Submitted
        </p>
        <p className="text-sm text-[#0a1628]">
          Your request to claim <span className="font-medium">{memberName}</span>&apos;s profile has been sent. Penn Golf will review it shortly.
        </p>
      </div>
    )
  }

  return (
    <div
      className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider">
          Claim This Profile
        </p>
        <button
          onClick={() => setStep('prompt')}
          className="text-xs text-[#8a7f70] hover:text-[#0a1628]"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#0a1628] mb-1">Your name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={memberName}
              className="w-full bg-[#f8f5f0] border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] placeholder-[#8a7f70] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/15 focus:border-[#0a1628]/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#0a1628] mb-1">Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#f8f5f0] border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] placeholder-[#8a7f70] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/15 focus:border-[#0a1628]/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#0a1628] mb-1">Penn Golf years (optional)</label>
          <input
            type="text"
            value={years}
            onChange={e => setYears(e.target.value)}
            placeholder="e.g. 2012–2016"
            className="w-full bg-[#f8f5f0] border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] placeholder-[#8a7f70] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/15 focus:border-[#0a1628]/30"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#0a1628] mb-1">Note (optional)</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Anything that helps verify your identity..."
            rows={2}
            className="w-full bg-[#f8f5f0] border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] placeholder-[#8a7f70] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/15 focus:border-[#0a1628]/30 resize-none"
          />
        </div>

        {error && (
          <p className="text-xs text-[#990000]">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto text-sm font-semibold bg-[#0a1628] hover:bg-[#0a1628]/90 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg transition-colors"
        >
          {submitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  )
}
