'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, UserPlus } from 'lucide-react'

export default function AddMemberForm() {
  const [name, setName] = useState('')
  const [memberRole, setMemberRole] = useState<'alumni' | 'current_player' | 'coach'>('alumni')
  const [hometown, setHometown] = useState('')
  const [classLabel, setClassLabel] = useState('')
  const [rosterStartYear, setRosterStartYear] = useState('')
  const [rosterEndYear, setRosterEndYear] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submittedName, setSubmittedName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        memberRole,
      }
      if (hometown.trim()) body.hometown = hometown.trim()
      if (classLabel.trim()) body.classLabel = classLabel.trim()
      const startYear = Number.parseInt(rosterStartYear, 10)
      if (Number.isFinite(startYear)) body.rosterStartYear = startYear
      const endYear = Number.parseInt(rosterEndYear, 10)
      if (Number.isFinite(endYear)) body.rosterEndYear = endYear

      const res = await fetch('/api/internal/add-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `Failed (${res.status})`)
      }
      setSubmittedName(name.trim())
      setName('')
      setHometown('')
      setClassLabel('')
      setRosterStartYear('')
      setRosterEndYear('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fbf9f6]">
      <div className="px-5 sm:px-8 py-5 border-b border-[rgba(180,168,150,0.35)]">
        <div className="max-w-[820px] mx-auto flex items-center justify-between">
          <Link
            href="/internal"
            className="inline-flex items-center gap-1.5 text-[12px] text-[#3d4a5c] hover:text-[#0a1628] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Internal</span>
          </Link>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#990000]">
            Captain · Add Member
          </p>
        </div>
      </div>

      <div className="max-w-[820px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div
          className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.06)' }}
        >
          <div className="px-7 sm:px-10 pt-10 pb-6 border-b border-[rgba(180,168,150,0.3)] bg-[#fdfcf9]">
            <span className="block w-10 h-[2px] bg-[#0a1628] mb-5" />
            <h1
              className="text-[#0a1628] text-3xl sm:text-4xl font-medium leading-tight font-heading"
            >
              Add a member
            </h1>
            <p className="text-[13px] text-[#3d4a5c]/80 mt-3 max-w-lg">
              For new alumni who aren&rsquo;t in the historical Member Book yet, or
              for current players you just added to the roster. They&rsquo;ll show up
              in the Member Map, Career Room, and Hall of Fame surfaces. They can
              then claim the card from their own Google sign-in.
            </p>
          </div>

          {submittedName && (
            <div className="px-7 sm:px-10 py-4 bg-[#2d6a4f]/8 border-b border-[#2d6a4f]/20">
              <p className="text-[13px] text-[#2d6a4f]">
                <strong>{submittedName}</strong> added to the roster. Add another below or head{' '}
                <Link href="/internal" className="underline">back to Internal</Link>.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="px-7 sm:px-10 py-8 space-y-6">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted mb-2">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Q. Smith"
                required
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/30 focus:border-[#0a1628]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted mb-2">
                Role
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'alumni', label: 'Alumni' },
                  { value: 'current_player', label: 'Current Player' },
                  { value: 'coach', label: 'Coach' },
                ].map((opt) => {
                  const active = memberRole === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMemberRole(opt.value as typeof memberRole)}
                      className={`text-[12.5px] font-medium px-4 py-2.5 rounded-lg border transition-colors ${
                        active
                          ? 'bg-[#0a1628] text-white border-[#0a1628]'
                          : 'bg-white text-[#3d4a5c] border-[rgba(180,168,150,0.5)] hover:border-[#0a1628]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted mb-2">
                  Class
                </label>
                <input
                  type="text"
                  value={classLabel}
                  onChange={(e) => setClassLabel(e.target.value)}
                  placeholder="C'27 or Class of 2018"
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/30 focus:border-[#0a1628]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted mb-2">
                  Hometown
                </label>
                <input
                  type="text"
                  value={hometown}
                  onChange={(e) => setHometown(e.target.value)}
                  placeholder="Greenwich, CT"
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/30 focus:border-[#0a1628]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted mb-2">
                  Roster start year
                </label>
                <input
                  type="number"
                  value={rosterStartYear}
                  onChange={(e) => setRosterStartYear(e.target.value)}
                  placeholder="2014"
                  min={1900}
                  max={2030}
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/30 focus:border-[#0a1628]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted mb-2">
                  Roster end year
                </label>
                <input
                  type="number"
                  value={rosterEndYear}
                  onChange={(e) => setRosterEndYear(e.target.value)}
                  placeholder="2018"
                  min={1900}
                  max={2030}
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/30 focus:border-[#0a1628]"
                />
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 bg-[#990000]/8 border border-[#990000]/25 rounded-lg">
                <p className="text-[13px] text-[#990000]">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="inline-flex items-center gap-2 bg-[#0a1628] hover:bg-[#112240] text-white text-[13px] font-semibold uppercase tracking-[0.14em] px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-4 h-4" />
                {submitting ? 'Adding…' : 'Add to roster'}
              </button>
              <Link
                href="/internal"
                className="text-[12px] text-ink-muted hover:text-[#0a1628]"
              >
                Done
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
