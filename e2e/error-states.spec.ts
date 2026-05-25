import { test, expect } from '@playwright/test'
import { resetAndSeedPennTeam } from './utils/store'

test.describe('Error states — bad slugs and missing IDs', () => {
  test.beforeAll(() => {
    resetAndSeedPennTeam()
  })

  const BAD_TEAM_PAGES = [
    '/builder/workspace?teamSlug=bad-team',
    '/builder/people?teamSlug=bad-team',
    '/builder/enrich?teamSlug=bad-team',
    '/builder/promote?teamSlug=bad-team',
    '/builder/quality?teamSlug=bad-team',
  ]

  const BAD_PERSON_PAGES = [
    '/player/alumni/not-a-real-person',
    '/player/outreach/not-a-real-person',
  ]

  for (const url of BAD_TEAM_PAGES) {
    test(`no crash on ${url}`, async ({ page }) => {
      const response = await page.goto(url)
      await page.waitForLoadState('networkidle')

      expect(response?.status() ?? 200).toBeLessThan(600)

      const spinners = page.locator('.animate-spin')
      if (await spinners.count() > 0) {
        await expect(spinners.first()).not.toBeVisible({ timeout: 10000 })
      }

      const bodyText = await page.textContent('body') ?? ''
      const lower = bodyText.toLowerCase()
      const hasError = lower.includes('not found') ||
        lower.includes('failed') ||
        lower.includes('error') ||
        lower.includes('bad-team') ||
        lower.includes('no team') ||
        lower.includes('no entries') ||
        lower.includes('no profiles') ||
        lower.includes('no promoted')
      expect(hasError, `Page ${url} should show error or empty state, got: ${bodyText.slice(0, 200)}`).toBe(true)

      const hasNav = await page.locator('a').count()
      expect(hasNav, 'Page must have navigation links').toBeGreaterThan(0)

      const pageSource = await page.content()
      expect(pageSource).not.toContain('at Object.<anonymous>')
      expect(pageSource).not.toContain('SyntaxError')
    })
  }

  for (const url of BAD_PERSON_PAGES) {
    test(`no crash on ${url}`, async ({ page }) => {
      await page.goto(url)
      await page.waitForLoadState('networkidle')

      const spinners = page.locator('.animate-spin')
      if (await spinners.count() > 0) {
        await expect(spinners.first()).not.toBeVisible({ timeout: 10000 })
      }

      const bodyText = await page.textContent('body') ?? ''
      const hasError =
        bodyText.toLowerCase().includes('not found') ||
        bodyText.toLowerCase().includes('profile not found') ||
        page.url().includes('404')
      expect(hasError, `Page ${url} should show not found state`).toBe(true)

      const hasNav = await page.locator('a').count()
      expect(hasNav, 'Page must have navigation links').toBeGreaterThan(0)

      const pageSource = await page.content()
      expect(pageSource).not.toContain('at Object.<anonymous>')
    })
  }
})
