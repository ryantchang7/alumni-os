import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { FAKE_ALUMNI_NAMES } from './test-data'

export async function expectNoFakeAlumniText(page: Page) {
  const content = await page.textContent('body')
  if (!content) return
  for (const name of FAKE_ALUMNI_NAMES) {
    expect(content, `Page must not contain fake alumni name: "${name}"`).not.toContain(name)
  }
}

export async function expectNoInfiniteLoading(page: Page) {
  const spinners = page.locator('.animate-spin')
  const count = await spinners.count()
  if (count > 0) {
    await expect(spinners.first(), 'Loading spinner must not still be visible after 10s').not.toBeVisible({
      timeout: 10000,
    })
  }
}
