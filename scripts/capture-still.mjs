// Re-shoot one full-page 2x still into the video repo's public/capture2x/.
// True retina without upscaling: viewport 3840 + DSF 1 + CSS zoom 2 (asking
// Playwright for a 4K deviceScaleFactor just grey-pads a 1080 capture).
// Read-only against prod — navigates and screenshots, never submits.
//
//   node scripts/capture-still.mjs /team-room team-room
//
// The printed height is the page's true 2x pixel height: paste it into the
// R table in the video repo's src/video-config.ts, or the camera pans over
// a page geometry that no longer exists.
import { chromium } from 'playwright'
const AUTH = '/Users/ryanchang/dev/penn-golf-clubhouse-video/assets/capture/auth.json'
const OUT = '/Users/ryanchang/dev/penn-golf-clubhouse-video/public/capture2x'
const B = 'https://www.penngolfclubhouse.com'
const [route, name] = process.argv.slice(2)
const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 3840, height: 2160 }, deviceScaleFactor: 1, storageState: AUTH,
})
await ctx.addInitScript(() => {
  const z = () => { document.documentElement.style.zoom = '2' }
  if (document.readyState !== 'loading') z(); else window.addEventListener('DOMContentLoaded', z)
})
const p = await ctx.newPage()
await p.goto(B + route, { waitUntil: 'domcontentloaded', timeout: 60000 })
await p.waitForTimeout(3000)
// force every lazy section to mount before the full-page shot
await p.evaluate(async () => {
  const step = window.innerHeight
  for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
    window.scrollTo(0, y); await new Promise(r => setTimeout(r, 220))
  }
  window.scrollTo(0, 0)
})
await p.waitForTimeout(1500)
await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
const h = await p.evaluate(() => document.documentElement.scrollHeight)
console.log(name, 'height', h)
await browser.close()
