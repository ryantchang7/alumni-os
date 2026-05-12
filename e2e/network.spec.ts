import { test, expect } from '@playwright/test'
import { resetSeedAndNetworkDemo, resetStore } from './utils/store'
import { TEAM_SLUG } from './utils/test-data'
import { expectNoFakeAlumniText } from './utils/assertions'

const BASE_URL = `/network/search?teamSlug=${TEAM_SLUG}`

test.describe('Player Network', () => {
  test('Test A: network search shows published alumni only', async ({ page }) => {
    resetSeedAndNetworkDemo()

    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    // Grid with published alumni
    const grid = page.locator('[data-testid="network-alumni-grid"]')
    await expect(grid).toBeVisible({ timeout: 10000 })

    const bodyText = await page.textContent('body')
    expect(bodyText).toContain('Ryan Chang')
    expect(bodyText).toContain('Hayden Adams')

    // Network must NOT contain builder/admin vocabulary
    expect(bodyText).not.toContain('extraction')
    expect(bodyText).not.toContain('graph quality')
    expect(bodyText).not.toContain('confidence score')
    expect(bodyText).not.toContain('AI Builder')
    expect(bodyText).not.toContain('promotion')
    expect(bodyText).not.toContain('needs enrichment')
    expect(bodyText).not.toContain('agent timeline')

    await expectNoFakeAlumniText(page)
  })

  test('Test B: network search shows empty state when no published profiles', async ({ page }) => {
    resetStore()
    // Seed the team but publish nobody
    const { execFileSync } = await import('child_process')
    const path = await import('path')
    const ROOT = path.resolve(__dirname, '..')
    const TSX = path.join(ROOT, 'node_modules', '.bin', 'tsx')
    execFileSync(TSX, [path.join(ROOT, 'scripts', 'seed-agent-demo.ts')], {
      cwd: ROOT,
      stdio: 'pipe',
      encoding: 'utf-8',
    })

    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    const empty = page.locator('[data-testid="network-empty-state"]')
    await expect(empty).toBeVisible({ timeout: 10000 })

    const emptyText = await empty.textContent()
    expect(emptyText).toContain('No alumni published yet')
    expect(emptyText).toContain('captains')

    await expectNoFakeAlumniText(page)
  })

  test('Test C: POST /api/network/publish with role=player returns 403', async ({ request }) => {
    const res = await request.post('/api/network/publish', {
      data: { teamSlug: TEAM_SLUG, personId: 'any-id', role: 'player' },
    })
    expect(res.status()).toBe(403)
    const body = await res.json()
    expect(body.error).toContain('Forbidden')
  })

  test('Test D: captain can publish a profile via API and it appears in network', async ({ page, request }) => {
    resetSeedAndNetworkDemo()

    // Get a person from the graph
    const profilesRes = await request.get(`/api/alumni/profiles?teamSlug=${TEAM_SLUG}`)
    expect(profilesRes.status()).toBe(200)
    const { profiles } = await profilesRes.json()
    expect(profiles.length).toBeGreaterThanOrEqual(1)

    const personId = profiles[0].personId
    const name = profiles[0].canonicalName

    // Unpublish first to test publish flow
    await request.post('/api/network/unpublish', {
      data: { teamSlug: TEAM_SLUG, personId, role: 'captain' },
    })

    // Now publish via captain
    const publishRes = await request.post('/api/network/publish', {
      data: { teamSlug: TEAM_SLUG, personId, role: 'captain' },
    })
    expect(publishRes.status()).toBe(200)
    const publishBody = await publishRes.json()
    expect(publishBody.published).toBe(true)

    // Verify it appears in network profiles
    const networkRes = await request.get(`/api/network/profiles?teamSlug=${TEAM_SLUG}`)
    expect(networkRes.status()).toBe(200)
    const networkData = await networkRes.json()
    const names = networkData.profiles.map((p: { canonicalName: string }) => p.canonicalName)
    expect(names).toContain(name)
  })

  test('Test E: unpublished person does not appear in network', async ({ request }) => {
    resetSeedAndNetworkDemo()

    // Get all profiles
    const profilesRes = await request.get(`/api/alumni/profiles?teamSlug=${TEAM_SLUG}`)
    const { profiles } = await profilesRes.json()
    const firstPersonId = profiles[0]?.personId

    if (!firstPersonId) {
      test.skip()
      return
    }

    // Unpublish them
    await request.post('/api/network/unpublish', {
      data: { teamSlug: TEAM_SLUG, personId: firstPersonId, role: 'captain' },
    })

    // Should not be in network profiles
    const networkRes = await request.get(`/api/network/profiles?teamSlug=${TEAM_SLUG}`)
    const networkData = await networkRes.json()
    const networkIds = networkData.profiles.map((p: { personId: string }) => p.personId)
    expect(networkIds).not.toContain(firstPersonId)
  })

  test('Test F: network landing page has correct copy and no builder links', async ({ page }) => {
    await page.goto('/network')
    await page.waitForLoadState('networkidle')

    const bodyText = await page.textContent('body')
    expect(bodyText).toContain('Penn Golf Network')
    expect(bodyText).toContain('captains or staff')

    // No builder references
    expect(bodyText).not.toContain('AI Builder')
    expect(bodyText).not.toContain('graph quality')
    expect(bodyText).not.toContain('scraping')
    expect(bodyText).not.toContain('extraction')

    await expectNoFakeAlumniText(page)
  })

  test('Test G: captain-review page is accessible from builder', async ({ page }) => {
    resetSeedAndNetworkDemo()

    await page.goto(`/builder/captain-review?teamSlug=${TEAM_SLUG}`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('[data-testid="captain-review-title"]')).toBeVisible({ timeout: 10000 })

    const titleText = await page.locator('[data-testid="captain-review-title"]').textContent()
    expect(titleText).toContain('Approve')
    expect(titleText).toContain('Network')

    // Should list people
    const list = page.locator('[data-testid="captain-review-list"]')
    await expect(list).toBeVisible({ timeout: 10000 })
    const listText = await list.textContent()
    expect(listText).toContain('Ryan Chang')

    await expectNoFakeAlumniText(page)
  })
})
