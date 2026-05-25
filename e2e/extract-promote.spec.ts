import { test, expect } from '@playwright/test'
import { resetAndSeedPennTeam } from './utils/store'
import { getRosterEntries, promoteAllExtractedEntries, getProfiles } from './utils/api'
import { expectNoFakeAlumniText } from './utils/assertions'
import { TEAM_SLUG, TEAM_URL, REAL_NAMES } from './utils/test-data'

test.describe('Extract and promote — live network', () => {
  test.beforeAll(() => {
    resetAndSeedPennTeam()
  })

  test('extracts current Penn roster, saves, promotes, and shows people', async ({ page, request }) => {
    await page.goto(`/builder/debug-roster?teamSlug=${TEAM_SLUG}`)
    await page.waitForLoadState('networkidle')

    const urlInput = page.locator('[data-testid="roster-url-input"]')
    await expect(urlInput).toBeVisible({ timeout: 10000 })
    await urlInput.fill(TEAM_URL)

    const extractBtn = page.locator('[data-testid="roster-extract-submit"]')
    await extractBtn.click()

    try {
      await expect(page.locator('[data-testid="roster-results"]')).toBeVisible({ timeout: 60000 })
    } catch {
      test.skip(true, 'Penn Athletics site unreachable — skipping live extraction test')
      return
    }

    const resultsText = await page.locator('[data-testid="roster-results"]').textContent()
    expect(resultsText).toContain('Ryan Chang')

    const saveBtn = page.locator('[data-testid="roster-save-button"]')
    await expect(saveBtn).not.toBeDisabled({ timeout: 5000 })
    await saveBtn.click()

    await expect(page.locator('text=Saved')).toBeVisible({ timeout: 15000 })

    await page.goto(`/builder/promote?teamSlug=${TEAM_SLUG}`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('[data-testid="select-high-confidence-button"]')).toBeVisible({ timeout: 10000 })
    await page.locator('[data-testid="select-high-confidence-button"]').click()
    await page.waitForTimeout(300)

    const promoteBtn = page.locator('[data-testid="promote-selected-button"]')
    await expect(promoteBtn).not.toBeDisabled({ timeout: 5000 })
    await promoteBtn.click()

    await expect(page.locator('.bg-green-50').filter({ hasText: 'Promoted' })).toBeVisible({ timeout: 15000 })

    await page.goto(`/builder/people?teamSlug=${TEAM_SLUG}`)
    await page.waitForLoadState('networkidle')

    const profiles = await getProfiles(request, TEAM_SLUG)
    expect(profiles.profiles.length, 'Expected 8 promoted people').toBeGreaterThanOrEqual(8)

    const names = profiles.profiles.map(p => p.canonicalName)
    expect(names.some(n => n.includes('Ryan Chang'))).toBe(true)

    await expectNoFakeAlumniText(page)

    const entries = await getRosterEntries(request, TEAM_SLUG)
    const promoted = entries.filter(e => e.status === 'promoted')
    expect(promoted.length).toBeGreaterThanOrEqual(8)

    const ryanEntry = promoted.find(e => e.fullName === 'Ryan Chang')
    expect(ryanEntry).toBeTruthy()
  })
})
