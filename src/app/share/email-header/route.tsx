import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Email header banner — 1200×400 marketing PNG for email blasts
// GET /share/email-header → image/png

export async function GET() {
  let crestSrc: string | null = null
  try {
    const data = await readFile(join(process.cwd(), 'public/locker-room-crest.png'))
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
          padding: '40px 80px',
        }}
      >
        {crestSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={crestSrc}
            width={64}
            height={64}
            alt=""
            style={{ marginBottom: 20, objectFit: 'contain' }}
          />
        )}

        {/* Eyebrow */}
        <div
          style={{
            fontSize: 20,
            letterSpacing: 10,
            color: '#c8a84b',
            textTransform: 'uppercase',
            marginBottom: crestSrc ? 12 : 20,
          }}
        >
          {"PENN MEN'S GOLF"}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 64,
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
            margin: '24px 0',
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: 'rgba(255,255,255,0.82)',
            textAlign: 'center',
          }}
        >
          Ask. Meet. Play. Gather.
        </div>

        {/* Footer URL */}
        <div
          style={{
            fontSize: 20,
            color: '#c8a84b',
            marginTop: 22,
            letterSpacing: 1,
          }}
        >
          penngolfclubhouse.com
        </div>
      </div>
    ),
    { width: 1200, height: 400 },
  )
}
