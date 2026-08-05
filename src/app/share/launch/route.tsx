import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Launch share card — 1200×630 marketing PNG for email/blast
// GET /share/launch → image/png

export async function GET() {
  let crestSrc: string | null = null
  try {
    const data = await readFile(join(process.cwd(), 'public/penn-golf-shield.png'))
    crestSrc = `data:image/png;base64,${data.toString('base64')}`
  } catch {
    // No crest — purely typographic fallback
  }

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
        {crestSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={crestSrc}
            width={80}
            height={80}
            alt=""
            style={{ marginBottom: 28, objectFit: 'contain' }}
          />
        )}

        {/* Eyebrow */}
        <div
          style={{
            fontSize: 24,
            letterSpacing: 10,
            color: '#c8a84b',
            textTransform: 'uppercase',
            marginBottom: crestSrc ? 16 : 26,
          }}
        >
          {"PENN MEN'S GOLF"}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 84,
            fontWeight: 700,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.05,
            letterSpacing: -1,
          }}
        >
          Penn Golf Clubhouse
        </div>

        {/* Gold rule */}
        <div
          style={{
            width: 260,
            height: 5,
            backgroundColor: '#c8a84b',
            margin: '34px 0',
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: 30,
            color: 'rgba(255,255,255,0.82)',
            textAlign: 'center',
          }}
        >
          Now open to every alum &amp; player.
        </div>

        {/* CTA pill */}
        <div
          style={{
            display: 'flex',
            marginTop: 38,
            backgroundColor: '#c8a84b',
            color: '#0a1628',
            fontWeight: 700,
            fontSize: 26,
            borderRadius: 999,
            padding: '16px 34px',
          }}
        >
          Claim your profile, 30 seconds
        </div>

        {/* Footer URL */}
        <div
          style={{
            fontSize: 24,
            color: '#c8a84b',
            marginTop: 36,
            letterSpacing: 1,
          }}
        >
          penngolfclubhouse.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
