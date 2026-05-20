import { test, expect } from '@playwright/test'

test.describe('Penn Men’s Golf Member Book', () => {
  test('renders title, public stats, and minimal registry', async ({ page }) => {
    await page.goto('/member-book')
    await page.waitForLoadState('networkidle')

    await expect(page.getByTestId('member-book-title')).toContainText(/Member Book/i)

    // Stat plaques show player-only count (337), letter-year rows (631),
    // and do NOT advertise a manager plaque publicly.
    const stats = page.getByTestId('member-book-stats')
    await expect(stats).toContainText('337')
    await expect(stats).toContainText('631')
    await expect(stats).not.toContainText('Managers')

    // Results count starts at 337 (managers hidden by default)
    await expect(page.getByTestId('member-results-count')).toHaveText('337')

    // Public copy hygiene — verification/status/admin vocabulary must not leak
    const body = (await page.textContent('body')) ?? ''
    expect(body).not.toMatch(/\bdatabase\b/i)
    expect(body).not.toMatch(/\bdashboard\b/i)
    expect(body).not.toMatch(/\bN\/A\b/)
    expect(body).not.toMatch(/\bpipeline\b/i)
    expect(body).not.toMatch(/\benrichment\b/i)
    expect(body).not.toMatch(/Roster Verified/i)
    expect(body).not.toMatch(/Needs Roster Check/i)
    expect(body).not.toMatch(/Letter Winner\b/)

    // Managers should not appear on the public registry
    const grid = page.getByTestId('member-book-grid')
    await expect(grid).not.toContainText('Manager')
  })

  test('search narrows the registry', async ({ page }) => {
    await page.goto('/member-book')
    await page.waitForLoadState('networkidle')

    const search = page.getByLabel('Search the Member Book')
    await search.fill('Chang')
    const count = page.getByTestId('member-results-count')
    await expect(count).not.toHaveText('337')
    await expect(page.getByText('Ryan Chang')).toBeVisible()
  })

  test('clicking a member navigates to a detail page', async ({ page }) => {
    await page.goto('/member-book')
    await page.waitForLoadState('networkidle')

    const search = page.getByLabel('Search the Member Book')
    await search.fill('Chang')
    await page.getByText('Ryan Chang').first().click()
    await expect(page).toHaveURL(/\/member-book\/[^/]+$/)
    await expect(page.getByTestId('member-detail-name')).toContainText('Ryan Chang')

    // Detail page should not surface internal verification language
    const body = (await page.textContent('body')) ?? ''
    expect(body).not.toMatch(/Roster Verified/i)
    expect(body).not.toMatch(/Needs Roster Check/i)
    expect(body).not.toMatch(/\bverification\b/i)
  })
})

test.describe('Member Map', () => {
  test('shows filters, no full directory underneath, and contextual links', async ({ page }) => {
    await page.goto('/member-map')
    await page.waitForLoadState('networkidle')

    // The new role filters: All Players / Current Roster / Alumni
    await expect(page.getByTestId('role-filter')).toContainText('All Players')
    await expect(page.getByTestId('role-filter')).toContainText('Current Roster')
    await expect(page.getByTestId('role-filter')).toContainText('Alumni')

    // The page should not duplicate a member directory underneath the map
    await expect(page.getByTestId('member-directory')).toHaveCount(0)

    // Contextual panel shows the "Open the Member Book" CTA when nothing selected
    const panel = page.getByTestId('map-contextual-panel')
    await expect(panel).toContainText(/Open the Member Book/i)
  })
})
