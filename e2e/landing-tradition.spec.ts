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

test.describe('Clubhouse home — Penn Golf Tradition trophy cabinet', () => {
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

  test('tradition section shows NCAA Championship History', async ({ page }) => {
    await page.goto('/player')
    await page.waitForLoadState('networkidle')
    const section = page.locator('[data-testid="tradition-section"]')
    const text = await section.textContent()
    expect(text).toMatch(/NCAA Championship/i)
    expect(text).toContain('1947')
    expect(text).toContain('1965')
    expect(text).toContain('1973')
  })

  test('tradition section shows NCAA Regional Appearances', async ({ page }) => {
    await page.goto('/player')
    await page.waitForLoadState('networkidle')
    const section = page.locator('[data-testid="tradition-section"]')
    const text = await section.textContent()
    expect(text).toMatch(/NCAA Regional/i)
    expect(text).toContain('2010')
  })

  test('tradition section shows Team Tournament Titles', async ({ page }) => {
    await page.goto('/player')
    await page.waitForLoadState('networkidle')
    const section = page.locator('[data-testid="tradition-section"]')
    const text = await section.textContent()
    expect(text).toMatch(/Team Tournament|Team Titles/i)
    expect(text).toContain('2024')
  })

  test('tradition section shows Individual Tournament Titles', async ({ page }) => {
    await page.goto('/player')
    await page.waitForLoadState('networkidle')
    const section = page.locator('[data-testid="tradition-section"]')
    const text = await section.textContent()
    expect(text).toMatch(/Individual/i)
    expect(text).toContain('1996')
  })

  test('tradition section shows Individual Honors', async ({ page }) => {
    await page.goto('/player')
    await page.waitForLoadState('networkidle')
    const section = page.locator('[data-testid="tradition-section"]')
    const text = await section.textContent()
    expect(text).toMatch(/All-America|Ivy Honors/i)
    expect(text).toContain('Powell')
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

test.describe('Member Map — filters', () => {
  test('renders role filter with Current Roster and Alumni', async ({ page }) => {
    await page.goto('/member-map')
    await page.waitForLoadState('networkidle')
    const roleFilter = page.locator('[data-testid="role-filter"]')
    await expect(roleFilter).toBeVisible({ timeout: 10000 })
    const text = await roleFilter.textContent()
    expect(text).toContain('Current Roster')
    expect(text).toContain('Alumni')
    expect(text).toContain('All Members')
  })

  test('renders era filter with decade options', async ({ page }) => {
    await page.goto('/member-map')
    await page.waitForLoadState('networkidle')
    const eraFilter = page.locator('[data-testid="era-filter"]')
    await expect(eraFilter).toBeVisible({ timeout: 10000 })
    const text = await eraFilter.textContent()
    expect(text).toContain('2010s')
    expect(text).toContain('2000s')
    expect(text).toContain('All Years')
  })

  test('renders state filter dropdown', async ({ page }) => {
    await page.goto('/member-map')
    await page.waitForLoadState('networkidle')
    const stateFilter = page.locator('[data-testid="state-filter"]')
    await expect(stateFilter).toBeVisible({ timeout: 10000 })
  })

  test('no forbidden vocabulary on member map', async ({ page }) => {
    await page.goto('/member-map')
    await page.waitForLoadState('networkidle')
    const body = await page.textContent('body')
    for (const word of ['dashboard', 'analytics', 'pipeline', 'source_backed', 'manually_verified', 'extraction', 'raw']) {
      expect(body).not.toContain(word)
    }
  })
})
