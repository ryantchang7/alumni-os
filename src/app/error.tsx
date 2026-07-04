'use client'

// Root error boundary — catches unhandled errors in the React tree and shows
// a branded page instead of Next.js's raw error overlay in production.

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  return (
    <div className="min-h-screen bg-[#f8f5f0] flex flex-col items-center justify-center px-6 text-center">
      {/* Penn red accent bar at the very top */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#990000] via-[#bb0000] to-[#990000]" />

      {/* Shield icon placeholder — uses brand colors */}
      <div className="w-16 h-16 rounded-2xl bg-[#0a1628] flex items-center justify-center mb-6 shadow-lg">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6L12 2z"
            fill="#c8a84b"
            opacity="0.9"
          />
        </svg>
      </div>

      <h1
        className="text-2xl sm:text-3xl font-medium text-[#0a1628] mb-3 font-heading"
      >
        Something went sideways in the clubhouse.
      </h1>

      <p className="text-[14px] text-ink-muted max-w-sm leading-relaxed mb-8">
        An unexpected error occurred. Try reloading — if it keeps happening, the team is already on it.
      </p>

      {process.env.NODE_ENV === 'development' && error?.message && (
        <p className="text-[11px] text-[#990000] font-mono mb-6 max-w-md text-left bg-white border border-[rgba(180,168,150,0.4)] rounded-lg px-4 py-3 break-words">
          {error.message}
        </p>
      )}

      <button
        type="button"
        onClick={reset}
        className="bg-[#0a1628] hover:bg-[#112240] text-white text-[13px] font-semibold uppercase tracking-[0.14em] px-6 py-3 rounded-xl transition-colors"
      >
        Reload
      </button>
    </div>
  )
}
