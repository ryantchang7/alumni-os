import { test, expect } from '@playwright/test'

test.describe('Penn Men’s Golf Member Book', () => {
  test('renders title, stats, and full member registry', async ({ page }) => {
    await page.goto('/member-book')
    await page.waitForLoadState('networkidle')

    // Title
    await expect(page.getByTestId('member-book-title')).toHaveText(/Penn Men.+s Golf Member Book/)

    // Stat plaques include expected counts
    const stats = page.getByTestId('member-book-stats')
    await expect(stats).toContainText('343')
    await expect(stats).toContainText('330')
    await expect(stats).toContainText('631')
    await expect(stats).toContainText('6')

    // Results count starts at 343
    await expect(page.getByTestId('member-results-count')).toHaveText('343')

    // Public copy hygiene — no forbidden vocabulary on the page
    const body = (await page.textContent('body')) ?? ''
    expect(body).not.toMatch(/\bdatabase\b/i)
    expect(body).not.toMatch(/\bdashboard\b/i)
    expect(body).not.toMatch(/\bN\/A\b/)
    expect(body).not.toMatch(/\bpipeline\b/i)
    expect(body).not.toMatch(/\benrichment\b/i)
  })

  test('search narrows the registry', async ({ page }) => {
    await page.goto('/member-book')
    await page.waitForLoadState('networkidle')

    const search = page.getByLabel('Search members')
    await search.fill('Chang')
    await expect(page.getByTestId('member-results-count')).toHaveText('1')
    await expect(page.getByText('Ryan Chang')).toBeVisible()
  })

  test('letter-year filter selects members by ending year', async ({ page }) => {
    await page.goto('/member-book')
    await page.waitForLoadState('networkidle')

    await page.getByLabel('Letter year').selectOption('2004')
    const count = await page.getByTestId('member-results-count').textContent()
    expect(Number.parseInt(count ?? '0', 10)).toBeGreaterThan(0)
  })

  test('manager filter preserves the 6 manager records', async ({ page }) => {
    await page.goto('/member-book')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: 'Managers' }).click()
    await expect(page.getByTestId('member-results-count')).toHaveText('6')
  })
})
