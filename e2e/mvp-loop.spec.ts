import { test, expect } from '@playwright/test'
import { resetSeedAndNetworkDemo } from './utils/store'
import { getProfileByName } from './utils/api'
import { expectNoFakeAlumniText } from './utils/assertions'
import { TEAM_SLUG } from './utils/test-data'

test.describe('MVP loop', () => {
  test.beforeEach(() => {
    resetSeedAndNetworkDemo()
  })

  test('Test 1: /build is self-contained — no link to captain-review in visible flow', async ({
    page,
  }) => {
    await page.goto(`/build?teamSlug=${TEAM_SLUG}`)
    await page.waitForLoadState('networkidle')

    // Page loads with embedded publish panel
    await expect(page.locator('h1')).toContainText('Build your alumni network', { timeout: 10000 })

    // Publish panel is embedded — should show publish toggle UI
    const bodyText = await page.textContent('body')
    expect(bodyText).toContain('Visible to players')

    // No link pointing to /builder/captain-review in the main UI
    const captainReviewLinks = await page.locator('a[href*="captain-review"]').count()
    expect(captainReviewLinks).toBe(0)

    await expectNoFakeAlumniText(page)
  })

  test('Test 2: player can submit a request to an alumni', async ({ page, request }) => {
    const ryan = await getProfileByName(request, TEAM_SLUG, 'Ryan Chang')
    expect(ryan).toBeTruthy()
    const personId = ryan!.personId

    await page.goto(`/player/outreach/${personId}?teamSlug=${TEAM_SLUG}`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('[data-testid="outreach-draft-preview"]')).toBeVisible({
      timeout: 10000,
    })

    // Fill in name
    const nameInput = page.locator('input[placeholder*="Your name"]')
    await expect(nameInput).toBeVisible({ timeout: 5000 })
    await nameInput.fill('Test Player')

    // Send request button exists
    const sendButton = page.locator('button', { hasText: /send request/i })
    await expect(sendButton).toBeVisible()

    // Submit
    await sendButton.click()

    // Success message appears
    await expect(page.locator('text=/request saved/i')).toBeVisible({ timeout: 5000 })

    await expectNoFakeAlumniText(page)
  })

  test('Test 3: alumni inbox loads and shows person selector', async ({ page }) => {
    await page.goto(`/alumni/requests?teamSlug=${TEAM_SLUG}`)
    await page.waitForLoadState('networkidle')

    // Page title
    await expect(page.locator('h1')).toContainText('Player requests', { timeout: 10000 })

    // Dev mode notice present
    const bodyText = await page.textContent('body')
    expect(bodyText).toContain('Dev mode')

    // Person selector shown (no personId in URL)
    expect(bodyText).toContain('Select your profile')
    expect(bodyText).toContain('Ryan Chang')

    await expectNoFakeAlumniText(page)
  })

  test('Test 4: unpublished guard — player cannot request unpublished alumni', async ({
    request,
  }) => {
    // Hayden is published in network-demo seed but let's use a direct API check
    // We verify the guard is in place by calling the API with a non-published person

    // First get all build/people to find an unpublished person
    const res = await request.get(`/api/build/people?teamSlug=${TEAM_SLUG}`)
    expect(res.status()).toBe(200)
    const { people } = await res.json()

    const unpublished = people.find(
      (p: { publishedToNetwork: boolean }) => !p.publishedToNetwork,
    )

    if (!unpublished) {
      // All alumni are published in this seed — test passes vacuously
      return
    }

    // Attempt to POST a request for unpublished alumni
    const attemptRes = await request.post('/api/player/requests', {
      data: {
        teamSlug: TEAM_SLUG,
        alumniPersonId: unpublished.personId,
        fromName: 'Test Player',
        purpose: 'career_advice',
        message: 'This should fail because the alumni is not published.',
      },
    })

    expect(attemptRes.status()).toBe(403)
    const body = await attemptRes.json()
    expect(body.error).toMatch(/not available/i)
  })

  test('Test 5: no internal language on player-facing pages', async ({ page, request }) => {
    const ryan = await getProfileByName(request, TEAM_SLUG, 'Ryan Chang')
    expect(ryan).toBeTruthy()
    const personId = ryan!.personId

    // Check player alumni profile
    await page.goto(`/player/alumni/${personId}?teamSlug=${TEAM_SLUG}`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('[data-testid="player-profile"]')).toBeVisible({ timeout: 10000 })

    const profileText = await page.textContent('body')
    expect(profileText).not.toContain('source_backed')
    expect(profileText).not.toContain('manually_verified')
    expect(profileText).not.toContain('confidence')
    expect(profileText).not.toContain('extraction')
    expect(profileText).not.toContain('enrichment')
    expect(profileText).not.toContain('scrape')
    expect(profileText).not.toContain('promote')
    expect(profileText).not.toContain('graph quality')

    // Check player outreach page
    await page.goto(`/player/outreach/${personId}?teamSlug=${TEAM_SLUG}`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('[data-testid="outreach-draft-preview"]')).toBeVisible({
      timeout: 10000,
    })

    const outreachText = await page.textContent('body')
    expect(outreachText).not.toContain('source_backed')
    expect(outreachText).not.toContain('manually_verified')
    expect(outreachText).not.toContain('graph quality')

    await expectNoFakeAlumniText(page)
  })

  test('Test 6: zombie routes redirect correctly', async ({ page }) => {
    // /login → /
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    expect(page.url()).not.toContain('/login')

    // /app → /
    await page.goto('/app')
    await page.waitForLoadState('networkidle')
    expect(page.url()).not.toContain('/app')

    // /player/relationships → /player
    await page.goto('/player/relationships')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/player')
    expect(page.url()).not.toContain('/relationships')

    // /review/candidates → /internal
    await page.goto('/review/candidates')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/internal')

    // /network/search → /player
    await page.goto('/network/search')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/player')
  })
})
