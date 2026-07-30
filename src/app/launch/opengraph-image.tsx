import { ImageResponse } from 'next/og'

// Link-preview card for /launch — the one URL the alumni email and texts
// point at. Sells the film specifically ("Watch the film") rather than the
// generic site card. Purely typographic like the root card: no external
// fetches, can never break the build.
export const alt = 'The Penn Golf Clubhouse — watch the film'
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
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a1628',
          fontFamily: 'sans-serif',
          padding: 80,
        }}
      >
        <div
          style={{
            fontSize: 24,
            letterSpacing: 10,
            color: '#c8a84b',
            textTransform: 'uppercase',
            marginBottom: 30,
          }}
        >
          {"Penn Men's Golf"}
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 700,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.1,
            marginBottom: 34,
          }}
        >
          The Penn Golf Clubhouse
        </div>
        {/* play affordance */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              border: '3px solid #c8a84b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderTop: '14px solid transparent',
                borderBottom: '14px solid transparent',
                borderLeft: '22px solid #c8a84b',
                marginLeft: 6,
              }}
            />
          </div>
          <div style={{ fontSize: 30, color: 'rgba(255,255,255,0.85)' }}>
            Watch the film · 3 minutes
          </div>
        </div>
        <div
          style={{
            fontSize: 24,
            color: '#c8a84b',
            letterSpacing: 2,
            marginTop: 22,
          }}
        >
          penngolfclubhouse.com/launch
        </div>
      </div>
    ),
    size,
  )
}
