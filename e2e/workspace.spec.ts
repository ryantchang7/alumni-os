import { test, expect } from '@playwright/test'
import { resetAndSeedPennTeam } from './utils/store'
import { expectNoFakeAlumniText, expectNoInfiniteLoading } from './utils/assertions'
import { TEAM_SLUG } from './utils/test-data'

test.describe('Workspace', () => {
  test.beforeAll(() => {
    resetAndSeedPennTeam()
  })

  test('workspace loads and shows expected UI', async ({ page }) => {
    await page.goto(`/builder/workspace?teamSlug=${TEAM_SLUG}`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('[data-testid="workspace-ready"]')).toBeVisible({ timeout: 15000 })

    const header = await page.textContent('h1')
    expect(header).toContain("Men's Golf")

    const bodyText = await page.textContent('body')
    expect(bodyText).toMatch(/University of Pennsylvania/i)

    await expect(page.locator('[data-testid="recommended-action"]')).toBeVisible()
    const actionText = await page.locator('[data-testid="recommended-action"]').textContent()
    expect(actionText).toContain('Extract current roster')

    const checklist = page.locator('[data-testid="readiness-checklist"]')
    await expect(checklist).toBeVisible()
    const checklistText = await checklist.textContent()
    expect(checklistText).toContain('Team created')
    expect(checklistText).toContain('Current roster extracted')
    expect(checklistText).toContain('Entries promoted')
    expect(checklistText).toContain('Historical seasons imported')
    expect(checklistText).toContain('Graph quality reviewed')
    expect(checklistText).toContain('Profiles enriched')

    const workflowSteps = page.locator('[data-testid="workflow-steps"]')
    await expect(workflowSteps).toBeVisible()
    const stepsText = await workflowSteps.textContent()
    expect(stepsText).toContain('Verified profile details')

    const links = await page.locator('a').all()
    const hrefs = await Promise.all(links.map(l => l.getAttribute('href')))
    const hrefSet = hrefs.filter(Boolean) as string[]

    expect(hrefSet.some(h => h.includes('/builder/debug-roster'))).toBe(true)
    expect(hrefSet.some(h => h.includes('/builder/history'))).toBe(true)
    expect(hrefSet.some(h => h.includes('/builder/promote'))).toBe(true)
    expect(hrefSet.some(h => h.includes('/builder/people'))).toBe(true)
    expect(hrefSet.some(h => h.includes('/builder/quality'))).toBe(true)
    expect(hrefSet.some(h => h.includes('/builder/graph'))).toBe(true)
    expect(hrefSet.some(h => h.includes('/builder/enrich'))).toBe(true)

    await expectNoFakeAlumniText(page)
    await expectNoInfiniteLoading(page)
  })
})
