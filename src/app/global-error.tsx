'use client'

// Root-layout error boundary. Unlike error.tsx (which only catches errors
// BELOW the root layout), global-error.tsx catches errors thrown IN the root
// layout/template itself. When active it REPLACES the root layout, so it must
// render its own <html> and <body> and cannot rely on the layout's fonts or
// providers — styles are inlined so the page is self-contained.

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          backgroundColor: '#fbf9f6', // cream
          color: '#0a1628', // navy
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        {/* Gold accent bar at the very top */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #c8a84b, #e0c878, #c8a84b)', // gold
          }}
        />

        {/* Navy shield mark with gold crest */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: '#0a1628',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            boxShadow: '0 8px 24px rgba(10,22,40,0.18)',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6L12 2z"
              fill="#c8a84b"
              opacity="0.9"
            />
          </svg>
        </div>

        <h1
          style={{
            fontSize: '28px',
            fontWeight: 500,
            margin: '0 0 12px',
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}
        >
          Something went sideways in the clubhouse.
        </h1>

        <p
          style={{
            fontSize: '14px',
            lineHeight: 1.6,
            color: 'var(--ink-muted)',
            maxWidth: '24rem',
            margin: '0 0 32px',
          }}
        >
          An unexpected error occurred. Try reloading, if it keeps happening, the
          team is already on it.
        </p>

        {process.env.NODE_ENV === 'development' && error?.message && (
          <p
            style={{
              fontSize: '11px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              color: '#990000', // Penn red
              maxWidth: '28rem',
              textAlign: 'left',
              backgroundColor: '#ffffff',
              border: '1px solid rgba(180,168,150,0.4)',
              borderRadius: '8px',
              padding: '12px 16px',
              margin: '0 0 24px',
              wordBreak: 'break-word',
            }}
          >
            {error.message}
          </p>
        )}

        <button
          type="button"
          onClick={() => reset()}
          style={{
            backgroundColor: '#0a1628',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Reload
        </button>
      </body>
    </html>
  )
}
