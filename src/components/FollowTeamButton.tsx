'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  initialFollowing: boolean
  signedIn: boolean
}

export default function FollowTeamButton({ initialFollowing, signedIn }: Props) {
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleToggle() {
    if (!signedIn) {
      router.push('/login?next=/team-room')
      return
    }
    const next = !following
    setFollowing(next) // optimistic
    setLoading(true)
    try {
      const res = await fetch('/api/me/follow-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: next }),
      })
      if (!res.ok) {
        // revert on failure
        setFollowing(!next)
      } else {
        const data = await res.json()
        setFollowing(data.value ?? next)
      }
    } catch {
      setFollowing(!next)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a84b]/60 disabled:opacity-60 ${
          following
            ? 'bg-[#c8a84b] hover:bg-[#b8973b] text-[#0a1628]'
            : 'bg-white border border-[#0a1628]/30 text-[#0a1628] hover:border-[#0a1628] hover:bg-[#fbf9f6]'
        }`}
      >
        {following ? (
          <>
            <svg
              aria-hidden="true"
              width="13"
              height="13"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0"
            >
              <path
                d="M2 7.5L5.5 11L12 4"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Following
          </>
        ) : (
          <>
            <svg
              aria-hidden="true"
              width="13"
              height="13"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0"
            >
              <path
                d="M7 2v10M2 7h10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Follow the team
          </>
        )}
      </button>
      <p className="text-xs text-ink-muted">
        {following
          ? "You'll get notified when new results are posted."
          : 'Get notified when the team posts results.'}
      </p>
    </div>
  )
}
