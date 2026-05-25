import { test, expect } from '@playwright/test'
import { resetSeedAndPromoteDemoPeople } from './utils/store'
import { getProfileByName, upsertEnrichment } from './utils/api'
import { TEAM_SLUG } from './utils/test-data'

test.describe('Unverified enrichment', () => {
  let ryanPersonId: string

  test.beforeAll(async ({ request }) => {
    resetSeedAndPromoteDemoPeople()

    const ryan = await getProfileByName(request, TEAM_SLUG, 'Ryan Chang')
    expect(ryan, 'Ryan Chang must be promoted').toBeTruthy()
    ryanPersonId = ryan!.personId

    await upsertEnrichment(request, TEAM_SLUG, ryanPersonId, {
      currentRole: 'Student Athlete',
      currentCompany: 'University of Pennsylvania',
      verificationStatus: 'unverified',
    })
  })

  test('player profile shows unverified warning', async ({ page }) => {
    await page.goto(`/player/alumni/${ryanPersonId}`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('[data-testid="career-contact-card"]')).toBeVisible({ timeout: 15000 })

    const cardText = await page.locator('[data-testid="career-contact-card"]').textContent()
    expect(cardText).toMatch(/Unverified|unverified/i)
    expect(cardText).toMatch(/not confirmed/i)
  })

  test('outreach does not use unverified company/role in polished template', async ({ page }) => {
    await page.goto(`/player/outreach/${ryanPersonId}`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('[data-testid="outreach-draft-preview"]')).toBeVisible({ timeout: 15000 })

    await page.locator('select').first().selectOption('career_advice')
    await page.locator('select').nth(1).selectOption('polished')

    await page.waitForTimeout(300)

    const draftText = await page.locator('[data-testid="outreach-draft-preview"]').textContent()
    expect(draftText).not.toMatch(/Student Athlete|University of Pennsylvania/)

    const noticeText = await page.locator('.bg-amber-50').first().textContent()
    expect(noticeText).toMatch(/roster data|enrichment/i)
  })

  test('builder enrich list shows partial/unverified status', async ({ page }) => {
    await page.goto(`/builder/enrich?teamSlug=${TEAM_SLUG}`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('[data-testid="enrich-list"]')).toBeVisible({ timeout: 15000 })

    const ryanRow = page.locator('tr').filter({ hasText: 'Ryan Chang' })
    await expect(ryanRow).toBeVisible()
    const ryanText = await ryanRow.textContent()
    expect(ryanText).toMatch(/Unverified/i)
  })
})
