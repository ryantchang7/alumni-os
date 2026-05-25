import { test, expect } from '@playwright/test'
import { resetSeedAndNetworkDemo } from './utils/store'
import { getProfileByName, upsertEnrichment, addEnrichmentSource } from './utils/api'
import { expectNoFakeAlumniText } from './utils/assertions'
import { TEAM_SLUG, RYAN_ENRICHMENT } from './utils/test-data'

test.describe('Player outreach', () => {
  let ryanPersonId: string
  let haydenPersonId: string

  test.beforeAll(async ({ request }) => {
    resetSeedAndNetworkDemo()

    const ryan = await getProfileByName(request, TEAM_SLUG, 'Ryan Chang')
    expect(ryan, 'Ryan Chang must be promoted').toBeTruthy()
    ryanPersonId = ryan!.personId

    const hayden = await getProfileByName(request, TEAM_SLUG, 'Hayden Adams')
    expect(hayden, 'Hayden Adams must be promoted').toBeTruthy()
    haydenPersonId = hayden!.personId

    await upsertEnrichment(request, TEAM_SLUG, ryanPersonId, RYAN_ENRICHMENT)
    await addEnrichmentSource(request, TEAM_SLUG, ryanPersonId, {
      url: 'https://pennathletics.com/sports/mens-golf/roster',
      sourceType: 'team_roster',
      title: 'Penn Men\'s Golf Roster',
    })
  })

  test('player search shows Ryan via verified enrichment search', async ({ page }) => {
    await page.goto('/player/search')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const searchInput = page.locator('input[type="text"]').first()
    await searchInput.fill('University of Pennsylvania')
    await page.waitForTimeout(500)

    const bodyText = await page.textContent('body')
    expect(bodyText).toContain('Ryan Chang')

    await expectNoFakeAlumniText(page)
  })

  test('Ryan player profile shows verified enrichment', async ({ page }) => {
    await page.goto(`/player/alumni/${ryanPersonId}`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('[data-testid="player-profile"]')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('[data-testid="career-contact-card"]')).toBeVisible()

    const profileText = await page.locator('[data-testid="player-profile"]').textContent()
    expect(profileText).toMatch(/Manually verified/i)
    expect(profileText).toContain('Student Athlete')
    expect(profileText).toContain('University of Pennsylvania')

    expect(profileText).not.toMatch(/email@/i)
    expect(profileText).not.toMatch(/linkedin\.com\/in/i)

    await expectNoFakeAlumniText(page)
  })

  test('Ryan outreach shows verified facts and can reference company', async ({ page }) => {
    await page.goto(`/player/outreach/${ryanPersonId}`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('[data-testid="outreach-draft-preview"]')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('[data-testid="verified-facts-panel"]')).toBeVisible()

    const noticeText = await page.locator('.bg-amber-50').first().textContent()
    expect(noticeText).toMatch(/verified career/i)

    const factsText = await page.locator('[data-testid="verified-facts-panel"]').textContent()
    expect(factsText).toContain('Ryan Chang')
    expect(factsText).toContain('University of Pennsylvania')

    await expectNoFakeAlumniText(page)
  })

  test('Hayden outreach does not invent career facts', async ({ page }) => {
    await page.goto(`/player/outreach/${haydenPersonId}`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('[data-testid="outreach-draft-preview"]')).toBeVisible({ timeout: 15000 })

    const noticeText = await page.locator('.bg-amber-50').first().textContent()
    expect(noticeText).toMatch(/roster data|enrichment/i)

    const draftText = await page.locator('[data-testid="outreach-draft-preview"]').textContent()
    expect(draftText).not.toContain('Student Athlete')
    expect(draftText).not.toContain('University of Pennsylvania')

    await expectNoFakeAlumniText(page)
  })
})
