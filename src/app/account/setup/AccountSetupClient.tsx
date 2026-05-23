'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Search, X } from 'lucide-react'

interface MinimalMember {
  bookId: string
  displayName: string
  yearsLabel: string | null
  hometown: string | null
  classYear: string | null
}

export default function AccountSetupClient({
  members,
  signedInName,
  signedInEmail,
  claimedCount,
  monthCount,
}: {
  members: MinimalMember[]
  signedInName: string | null
  signedInEmail: string | null
  claimedCount: number
  monthCount: number
}) {
  const firstName = signedInName?.split(' ')[0] ?? null
  const router = useRouter()
  const { update: refreshSession } = useSession()
  const [query, setQuery] = useState(signedInName ?? '')
  const [claiming, setClaiming] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return members.slice(0, 24)
    return members.filter((m) => {
      const hay = [m.displayName, m.hometown ?? '', m.classYear ?? '', m.yearsLabel ?? '']
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [query, members])

  async function handleClaim(bookId: string) {
    setClaiming(bookId)
    setError(null)
    try {
      const res = await fetch('/api/account/link-person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'Failed to link profile')
      }
      const j = await res.json()
      // Force NextAuth to re-issue the session cookie so the new
      // linkedPersonId is on the JWT before the editor page reads it.
      await refreshSession()
      router.push(
        `/player?welcome=${encodeURIComponent(firstName ?? 'home')}&personId=${j.personId}`,
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setClaiming(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-5 sm:px-8 pt-12 pb-14 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: '50%',
            right: '8%',
            width: '520px',
            height: '380px',
            transform: 'translate(40%, -50%)',
            background:
              'radial-gradient(ellipse at center, rgba(200,168,75,0.12) 0%, rgba(200,168,75,0.03) 45%, transparent 75%)',
          }}
        />
        <div className="max-w-[860px] mx-auto relative">
          <div className="flex items-center gap-3 mb-5">
            <span className="block w-8 h-px bg-[#c8a84b]/55" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]/85">
              The Clubhouse · Sign-In
            </p>
          </div>
          <h1
            className="text-white text-3xl sm:text-[40px] font-medium tracking-tight leading-tight"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {firstName ? <>Welcome through the gate, {firstName}.</> : 'Welcome through the gate.'}
          </h1>
          {claimedCount > 0 && (
            <p
              className="text-white/70 text-[15px] sm:text-base mt-4 max-w-xl leading-relaxed"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              <span className="text-[#c8a84b]">{claimedCount}</span> of your foursome have already
              checked in
              {monthCount > 0 ? (
                <>
                  {' '}— <span className="italic">{monthCount} came back this month</span>
                </>
              ) : null}
              . Find your card to be found.
            </p>
          )}
          <p className="text-white/45 text-[13px] mt-4 max-w-xl leading-relaxed">
            {signedInEmail ? <>Signed in as {signedInEmail}. </> : null}
            Search by name, hometown, or class year. Once you claim, edit your role and how you can help.
          </p>
        </div>
      </div>

      <div className="max-w-[860px] mx-auto px-5 sm:px-8 -mt-6 relative z-10 pb-20">
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-5 py-4 mb-6"
          style={{
            boxShadow: '0 2px 8px rgba(10,22,40,0.06), 0 1px 2px rgba(10,22,40,0.04)',
          }}
        >
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-[#b0a898]" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search the Member Book"
              placeholder="Search by name, hometown, or class year..."
              autoFocus
              className="w-full bg-[#f8f5f0] border border-[rgba(180,168,150,0.4)] rounded-lg px-4 py-2.5 pl-10 text-sm text-[#0a1628] placeholder-[#b0a898] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/10 focus:border-[#0a1628]/25 transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute inset-y-0 right-2 flex items-center px-1 text-[#b0a898] hover:text-[#0a1628]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-[#990000]/8 border border-[#990000]/25 rounded-lg">
            <p className="text-[13px] text-[#990000]">{error}</p>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#0a1628] text-base" style={{ fontFamily: 'var(--font-playfair)' }}>
              No match found.
            </p>
            <p className="text-sm text-[#8a7f70] mt-2">
              Try just a first or last name. The Member Book holds every Penn Men&rsquo;s Golf player from 1948 onward.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((m) => {
              const isClaiming = claiming === m.bookId
              return (
                <button
                  key={m.bookId}
                  type="button"
                  onClick={() => handleClaim(m.bookId)}
                  disabled={isClaiming || claiming !== null}
                  className="text-left bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-5 py-4 hover:border-[#0a1628]/30 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                  style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.04), 0 2px 8px rgba(10,22,40,0.03)' }}
                >
                  <p
                    className="text-[#0a1628] text-[17px] font-medium leading-snug"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    {m.displayName}
                  </p>
                  {m.yearsLabel && (
                    <p className="text-[13px] text-[#3d4a5c] mt-1.5">{m.yearsLabel}</p>
                  )}
                  <div className="text-[12.5px] text-[#8a7f70] mt-0.5 leading-relaxed">
                    {m.classYear && <p>Class of {m.classYear}</p>}
                    {m.hometown && <p>{m.hometown}</p>}
                  </div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#990000] mt-4">
                    {isClaiming ? 'Claiming…' : 'This is me →'}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
