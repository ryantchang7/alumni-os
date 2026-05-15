import { test, expect } from '@playwright/test'
import { resetSeedAndNetworkDemo } from './utils/store'

test.describe('Landing page — cover and copy', () => {
  test('uses clubhouse cover image', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const img = page.locator('[data-testid="cover-image"]')
    await expect(img).toBeVisible({ timeout: 10000 })
    const src = await img.getAttribute('src')
    expect(src).toContain('clubhouse-cover')
  })

  test('renders WELCOME TO THE eyebrow', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const body = await page.textContent('body')
    expect(body?.toUpperCase()).toContain('WELCOME TO THE')
  })

  test('renders PENN GOLF CLUBHOUSE heading', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const title = page.locator('[data-testid="landing-title"]')
    await expect(title).toBeVisible({ timeout: 10000 })
    const text = await title.textContent()
    expect(text?.toUpperCase()).toContain('PENN GOLF CLUBHOUSE')
  })

  test('renders Enter Clubhouse button linking to /player', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const btn = page.locator('[data-testid="enter-clubhouse"]')
    await expect(btn).toBeVisible({ timeout: 10000 })
    const href = await btn.getAttribute('href')
    expect(href).toBe('/player')
  })

  test('renders Claim Alumni Profile button', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const btn = page.locator('[data-testid="claim-alumni-profile"]')
    await expect(btn).toBeVisible({ timeout: 10000 })
    const text = await btn.textContent()
    expect(text).toContain('Claim Alumni Profile')
  })

  test('does not render Private Member Network', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const body = await page.textContent('body')
    expect(body).not.toContain('Private Member Network')
  })

  test('does not render removed slogans', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const body = await page.textContent('body')
    expect(body).not.toContain('For those who carried')
    expect(body).not.toContain('Ask. Meet. Play. Gather.')
  })

  test('no forbidden vocabulary on landing', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const body = await page.textContent('body')
    for (const word of ['confidence', 'extraction', 'pipeline', 'enrichment', 'dashboard', 'analytics', 'scraper']) {
      expect(body).not.toContain(word)
    }
  })
})

test.describe('Clubhouse home — Penn Golf Tradition', () => {
  test.beforeAll(() => {
    resetSeedAndNetworkDemo()
  })

  test('renders tradition section', async ({ page }) => {
    await page.goto('/player')
    await page.waitForLoadState('networkidle')
    const section = page.locator('[data-testid="tradition-section"]')
    await expect(section).toBeVisible({ timeout: 10000 })
    const text = await section.textContent()
    expect(text).toContain('Penn Golf Tradition')
  })

  test('tradition section shows Ivy League Champions with correct years', async ({ page }) => {
    await page.goto('/player')
    await page.waitForLoadState('networkidle')
    const section = page.locator('[data-testid="tradition-section"]')
    await expect(section).toBeVisible({ timeout: 10000 })
    const text = await section.textContent()
    expect(text).toContain('Ivy League')
    expect(text).toContain('1998')
    expect(text).toContain('2007')
    expect(text).toContain('2012')
    expect(text).toContain('2015')
  })

  test('tradition section shows Big 5 Champions 2024', async ({ page }) => {
    await page.goto('/player')
    await page.waitForLoadState('networkidle')
    const section = page.locator('[data-testid="tradition-section"]')
    const text = await section.textContent()
    expect(text).toMatch(/Big 5/)
    expect(text).toContain('2024')
  })

  test('tradition section shows NCAA Postseason History', async ({ page }) => {
    await page.goto('/player')
    await page.waitForLoadState('networkidle')
    const section = page.locator('[data-testid="tradition-section"]')
    const text = await section.textContent()
    expect(text).toMatch(/NCAA/i)
    expect(text).toContain('1972')
    expect(text).toContain('1973')
    expect(text).toContain('1974')
  })

  test('no forbidden vocabulary on clubhouse home', async ({ page }) => {
    await page.goto('/player')
    await page.waitForLoadState('networkidle')
    const body = await page.textContent('body')
    for (const word of ['dashboard', 'analytics', 'pipeline', 'enrichment', 'source_backed', 'manually_verified', 'extraction']) {
      expect(body).not.toContain(word)
    }
  })
})

test.describe('Team Room — mascot', () => {
  test('renders Penn Quaker mascot image in hero', async ({ page }) => {
    await page.goto('/team-room')
    await page.waitForLoadState('networkidle')
    const mascot = page.locator('[data-testid="team-room-mascot"]')
    await expect(mascot).toBeVisible({ timeout: 10000 })
  })
})
