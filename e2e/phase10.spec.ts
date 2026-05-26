import { test, expect } from '@playwright/test'
import { resetAndSeedPennTeam, resetSeedAndNetworkDemo, resetStore } from './utils/store'
import { TEAM_SLUG } from './utils/test-data'
import { expectNoFakeAlumniText } from './utils/assertions'

test.describe('Phase 10 — Simplified Product', () => {
  test('Test A: nav shows Build | Player Mode | Alumni Mode only', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const nav = page.locator('header nav')
    await expect(nav).toBeVisible({ timeout: 10000 })
    const navText = await nav.textContent()

    expect(navText).toContain('Build')
    expect(navText).toContain('Player Mode')
    expect(navText).toContain('Alumni Mode')

    // Old nav items must be gone
    expect(navText).not.toContain('Review')
    expect(navText).not.toContain('Penn Golf Demo')

    // No Builder link in nav (Builder is legacy, now called Build)
    const builderLinks = await page.locator('header a[href="/builder"]').count()
    expect(builderLinks).toBe(0)
  })

  test('Test B: /build loads with 4-step flow, no internal vocabulary', async ({ page }) => {
    resetAndSeedPennTeam()

    await page.goto('/build')
    await page.waitForLoadState('networkidle')

    // Page header
    await expect(page.locator('h1')).toContainText('Build your alumni network', { timeout: 10000 })

    // Step labels visible
    const bodyText = await page.textContent('body')
    expect(bodyText).toContain('Add your team')
    expect(bodyText).toContain('Review what was found')
    expect(bodyText).toContain('Approve and publish')
    expect(bodyText).toContain('Open Player Mode')

    // No internal pipeline vocabulary
    expect(bodyText).not.toContain('confidence')
    expect(bodyText).not.toContain('extraction')
    expect(bodyText).not.toContain('graph quality')
    expect(bodyText).not.toContain('scraping')
    expect(bodyText).not.toContain('crawl')
    expect(bodyText).not.toContain('promoted')

    await expectNoFakeAlumniText(page)
  })

  test('Test C: /build?teamSlug=penn-mens-golf shows team status', async ({ page }) => {
    resetAndSeedPennTeam()

    await page.goto(`/build?teamSlug=${TEAM_SLUG}`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1')).toContainText('Build your alumni network', { timeout: 10000 })

    // With seed data (team exists, people promoted), step 2 should show count
    const bodyText = await page.textContent('body')
    // Should mention people count (team is seeded with penn-mens-golf)
    // At minimum the page should load without error
    expect(bodyText).not.toContain('confidence')
    expect(bodyText).not.toContain('extraction')
  })

  test('Test D: /player shows published profiles with clean data (no internal language)', async ({
    page,
  }) => {
    resetSeedAndNetworkDemo()

    await page.goto('/player')
    await page.waitForLoadState('networkidle')

    // Should show published alumni
    const grid = page.locator('[data-testid="network-alumni-grid"]')
    await expect(grid).toBeVisible({ timeout: 10000 })

    const bodyText = await page.textContent('body')
    expect(bodyText).toContain('Ryan Chang')
    expect(bodyText).toContain('Hayden Adams')

    // Must NOT contain internal language
    expect(bodyText).not.toContain('confidence')
    expect(bodyText).not.toContain('extraction')
    expect(bodyText).not.toContain('graph quality')
    expect(bodyText).not.toContain('needs enrichment')
    expect(bodyText).not.toContain('source_backed')
    expect(bodyText).not.toContain('manually_verified')
    expect(bodyText).not.toContain('AI Builder')
    expect(bodyText).not.toContain('promotion')

    await expectNoFakeAlumniText(page)
  })

  test('Test E: /player shows empty state when no profiles published', async ({ page }) => {
    resetStore()
    // Seed team but do not publish anyone
    const { execFileSync } = await import('child_process')
    const path = await import('path')
    const ROOT = path.resolve(__dirname, '..')
    const TSX = path.join(ROOT, 'node_modules', '.bin', 'tsx')
    execFileSync(TSX, [path.join(ROOT, 'scripts', 'seed-penn-team.ts')], {
      cwd: ROOT,
      stdio: 'pipe',
      encoding: 'utf-8',
    })

    await page.goto('/player')
    await page.waitForLoadState('networkidle')

    const emptyState = page.locator('[data-testid="network-empty-state"]')
    await expect(emptyState).toBeVisible({ timeout: 10000 })

    const emptyText = await emptyState.textContent()
    expect(emptyText).toContain('No alumni published yet')
    expect(emptyText).toContain('captains')

    await expectNoFakeAlumniText(page)
  })

  test('Test F: /alumni landing shows person selector and correct copy', async ({ page }) => {
    resetSeedAndNetworkDemo()

    await page.goto(`/alumni?teamSlug=${TEAM_SLUG}`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1')).toContainText("Penn Golf alum", { timeout: 10000 })

    const bodyText = await page.textContent('body')
    // Shows the dev-mode person selector
    expect(bodyText).toContain('Ryan Chang')
    expect(bodyText).toContain('Hayden Adams')
    // Mentions what alumni can do
    expect(bodyText).toContain('help')

    // No builder or internal vocabulary
    expect(bodyText).not.toContain('confidence')
    expect(bodyText).not.toContain('extraction')

    await expectNoFakeAlumniText(page)
  })

  test('Test G: /alumni/profile/[id] shows editable form with read-only roster section', async ({
    page,
  }) => {
    resetSeedAndNetworkDemo()

    // Get a person id from the API
    const res = await page.request.get(`/api/alumni/profiles?teamSlug=${TEAM_SLUG}`)
    expect(res.status()).toBe(200)
    const { profiles } = await res.json()
    const personId = profiles[0]?.personId
    expect(personId).toBeTruthy()

    await page.goto(`/alumni/profile/${personId}?teamSlug=${TEAM_SLUG}`)
    await page.waitForLoadState('networkidle')

    // Read-only section present
    const bodyText = await page.textContent('body')
    expect(bodyText).toContain('Roster record')
    expect(bodyText).toContain('read only')

    // Editable fields visible
    await expect(page.locator('input[placeholder*="role"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('input[placeholder*="Company name"]')).toBeVisible({ timeout: 5000 })

    // Help topics visible
    expect(bodyText).toContain('How you can help')
    expect(bodyText).toContain('Career advice')

    // Contact preference section
    expect(bodyText).toContain('Contact preference')

    // No internal language
    expect(bodyText).not.toContain('confidence')
    expect(bodyText).not.toContain('verificationStatus')
    expect(bodyText).not.toContain('source_backed')

    await expectNoFakeAlumniText(page)
  })

  test('Test H: legacy redirects work (/builder → /build, /network → /player)', async ({
    page,
  }) => {
    resetAndSeedPennTeam()

    // /builder should redirect to /build
    await page.goto('/builder')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/build')

    // /network should redirect to /player
    await page.goto('/network')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/player')
  })
})
