import { ImageResponse } from 'next/og'

// Link-preview card for /scotland. Typographic only (no remote fetches)
// so it can never break the build — matches the root card's style.
export const alt = 'Penn Golf is going to Scotland — October 2026'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          backgroundColor: '#0a1628',
          backgroundImage: 'linear-gradient(135deg, #0a1628 0%, #11223f 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 26,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#c8a84b',
            marginBottom: 28,
          }}
        >
          Penn Men&apos;s Golf · October 2026
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 84,
            fontWeight: 600,
            color: '#ffffff',
            lineHeight: 1.05,
            marginBottom: 30,
            maxWidth: 950,
          }}
        >
          Penn Golf is going to Scotland.
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: 'rgba(255,255,255,0.75)', maxWidth: 900 }}>
          The St Andrews Links Collegiate — then the family tour: the Castle
          Course, Kingsbarns, and Carnoustie.
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 56,
            fontSize: 24,
            color: '#c8a84b',
            letterSpacing: '0.08em',
          }}
        >
          penngolfclubhouse.com/scotland
        </div>
      </div>
    ),
    size,
  )
}
