import { ImageResponse } from 'next/og'

// Branded link-preview card shown when penngolfclubhouse.com is shared in a
// text, email, or social post. 1200x630 is the standard OG size. Kept purely
// typographic (default font, no external font/image fetch) so it renders
// reliably and can never break the build. Next auto-wires og:image +
// twitter:image from this file.
export const alt = "Penn Golf Clubhouse, the private alumni network for Penn Men's Golf"
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
            marginBottom: 26,
          }}
        >
          {"Penn Men's Golf"}
        </div>
        <div
          style={{
            fontSize: 86,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: -1,
            textAlign: 'center',
            lineHeight: 1.05,
          }}
        >
          Penn Golf Clubhouse
        </div>
        <div style={{ width: 260, height: 5, backgroundColor: '#c8a84b', margin: '34px 0' }} />
        <div style={{ fontSize: 32, color: 'rgba(255,255,255,0.82)' }}>
          Ask. Meet. Play. Gather.
        </div>
        <div style={{ fontSize: 25, color: '#c8a84b', marginTop: 46, letterSpacing: 1 }}>
          penngolfclubhouse.com
        </div>
      </div>
    ),
    { ...size },
  )
}
