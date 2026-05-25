import { test, expect } from '@playwright/test'
import { resetSeedAndPromoteDemoPeople } from './utils/store'
import { getProfileByName } from './utils/api'
import { expectNoFakeAlumniText } from './utils/assertions'
import { TEAM_SLUG } from './utils/test-data'

test.describe('Enrichment flow', () => {
  test.beforeAll(() => {
    resetSeedAndPromoteDemoPeople()
  })

  test('enrich list shows Ryan and Hayden with no enrichment initially', async ({ page, request }) => {
    await page.goto(`/builder/enrich?teamSlug=${TEAM_SLUG}`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('[data-testid="enrich-list"]')).toBeVisible({ timeout: 15000 })

    const bodyText = await page.textContent('body')
    expect(bodyText).toContain('Ryan Chang')
    expect(bodyText).toContain('Hayden Adams')

    await expectNoFakeAlumniText(page)
  })

  test('enrich edit form saves and persists', async ({ page, request }) => {
    const ryanProfile = await getProfileByName(request, TEAM_SLUG, 'Ryan Chang')
    expect(ryanProfile, 'Ryan Chang must be a promoted person').toBeTruthy()
    const personId = ryanProfile!.personId

    await page.goto(`/builder/enrich/${personId}?teamSlug=${TEAM_SLUG}`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('[data-testid="roster-truth-panel"]')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('[data-testid="enrich-edit-form"]')).toBeVisible()

    await page.locator('input[placeholder="e.g. Software Engineer"]').fill('Student Athlete')
    await page.locator('input[placeholder="e.g. Google"]').fill('University of Pennsylvania')
    await page.locator('input[placeholder="City"]').fill('Philadelphia')
    await page.locator('input[placeholder="State"]').fill('PA')

    await page.locator('select').filter({ hasText: 'Not started' }).selectOption('identified')
    await page.locator('select').filter({ hasText: 'Unverified' }).selectOption('manually_verified')

    await page.locator('textarea').fill('Manually verified from roster context.')

    const saveBtn = page.locator('[data-testid="enrichment-save-button"]')
    await expect(saveBtn).not.toBeDisabled()
    await saveBtn.click()

    await expect(page.locator('text=Saved!')).toBeVisible({ timeout: 10000 })

    await page.locator('[data-testid="enrichment-source-form"] input[type="url"]').fill(
      'https://pennathletics.com/sports/mens-golf/roster',
    )
    await page.locator('[data-testid="enrichment-source-form"] input[placeholder="Title (optional)"]').fill(
      'Penn Men\'s Golf Roster',
    )
    await page.locator('[data-testid="enrichment-source-form"] select').selectOption('team_roster')
    await page.locator('[data-testid="enrichment-source-form"] input[placeholder="Notes (optional)"]').fill(
      'Manual source for enrichment.',
    )
    await page.locator('[data-testid="enrichment-source-add-button"]').click()

    await page.waitForTimeout(1000)

    await page.reload()
    await page.waitForLoadState('networkidle')

    const currentRoleInput = page.locator('input[placeholder="e.g. Software Engineer"]')
    await expect(currentRoleInput).toHaveValue('Student Athlete')
    const companyInput = page.locator('input[placeholder="e.g. Google"]')
    await expect(companyInput).toHaveValue('University of Pennsylvania')
  })

  test('enrich list shows Ryan as verified after enrichment', async ({ page, request }) => {
    await page.goto(`/builder/enrich?teamSlug=${TEAM_SLUG}`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('[data-testid="enrich-list"]')).toBeVisible({ timeout: 15000 })

    const bodyText = await page.textContent('body')
    expect(bodyText).toContain('Ryan Chang')
    expect(bodyText).toContain('Hayden Adams')

    const ryanCell = page.locator('tr').filter({ hasText: 'Ryan Chang' })
    await expect(ryanCell).toBeVisible()
    const ryanText = await ryanCell.textContent()
    expect(ryanText).toMatch(/Verified|verified/i)

    const haydenCell = page.locator('tr').filter({ hasText: 'Hayden Adams' })
    await expect(haydenCell).toBeVisible()
    const haydenText = await haydenCell.textContent()
    expect(haydenText).toMatch(/None/i)

    await expectNoFakeAlumniText(page)
  })
})
