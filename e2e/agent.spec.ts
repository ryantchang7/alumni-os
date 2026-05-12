import { test, expect } from '@playwright/test'
import { resetAndSeedPennTeam, resetSeedAndAgentDemo } from './utils/store'
import { getProfiles, getRosterEntries } from './utils/api'
import { expectNoFakeAlumniText, expectNoInfiniteLoading } from './utils/assertions'
import { TEAM_SLUG } from './utils/test-data'

test.describe('Agent-first flow', () => {
  test('Test A: agent page loads clean state', async ({ page }) => {
    resetAndSeedPennTeam()

    await page.goto(`/builder/agent?teamSlug=${TEAM_SLUG}`)
    await page.waitForLoadState('networkidle')

    // Header
    await expect(page.locator('h1')).toContainText('AI Builder', { timeout: 10000 })

    // Roster URL input visible and prefilled
    const urlInput = page.locator('[data-testid="agent-roster-url-input"]')
    await expect(urlInput).toBeVisible({ timeout: 10000 })
    const inputValue = await urlInput.inputValue()
    expect(inputValue.length, 'Roster URL input should be prefilled').toBeGreaterThan(0)

    // Run extraction button visible
    await expect(page.locator('[data-testid="agent-run-extraction-button"]')).toBeVisible()

    // Agent timeline visible
    await expect(page.locator('[data-testid="agent-timeline"]')).toBeVisible()
    const timelineText = await page.locator('[data-testid="agent-timeline"]').textContent()
    expect(timelineText).toContain('Team selected')
    expect(timelineText).toContain('Current roster extracted')
    expect(timelineText).toContain('Review roster rows')
    expect(timelineText).toContain('Add people to graph')
    expect(timelineText).toContain('Historical coverage')
    expect(timelineText).toContain('Verified profile details')
    expect(timelineText).toContain('Player-ready graph')

    // Advanced tools section visible
    const bodyText = await page.textContent('body')
    expect(bodyText).toContain('Advanced tools')
    expect(bodyText).toContain('Workspace')
    expect(bodyText).toContain('Historical import')

    await expectNoFakeAlumniText(page)
    await expectNoInfiniteLoading(page)
  })

  test('Test B: agent approval checkpoint and add-to-graph', async ({ page, request }) => {
    resetSeedAndAgentDemo()

    await page.goto(`/builder/agent?teamSlug=${TEAM_SLUG}`)
    await page.waitForLoadState('networkidle')

    // Wait for timeline to load (means agent summary fetched successfully)
    await expect(page.locator('[data-testid="agent-timeline"]')).toBeVisible({ timeout: 10000 })

    // Roster rows should be visible (pending entries from seed)
    const resultsPanel = page.locator('[data-testid="agent-roster-results"]')
    await expect(resultsPanel).toBeVisible({ timeout: 10000 })
    const resultsText = await resultsPanel.textContent()
    expect(resultsText).toContain('Ryan Chang')
    expect(resultsText).toContain('Hayden Adams')

    // Approval copy — rows not people yet
    const bodyText = await page.textContent('body')
    expect(bodyText).toContain('not in the graph yet')

    // Add to graph button
    const addBtn = page.locator('[data-testid="agent-add-to-graph-button"]').first()
    await expect(addBtn).toBeVisible({ timeout: 5000 })
    await expect(addBtn).not.toBeDisabled()
    await addBtn.click()

    // Success state
    await expect(page.locator('text=Added to graph').or(page.locator('text=added to graph'))).toBeVisible({ timeout: 15000 })

    // Verify people were created via API
    const profiles = await getProfiles(request, TEAM_SLUG)
    expect(profiles.profiles.length, 'Expected at least 2 people after promotion').toBeGreaterThanOrEqual(2)
    const names = profiles.profiles.map(p => p.canonicalName)
    expect(names.some(n => n.includes('Ryan Chang'))).toBe(true)
    expect(names.some(n => n.includes('Hayden Adams'))).toBe(true)

    // Next action should point toward historical import or enrichment
    const nextActionText = await page.locator('text=Recommended next step').locator('..').textContent()
    const pointsToNextStep =
      (nextActionText ?? '').includes('historical') ||
      (nextActionText ?? '').includes('verified profile') ||
      (nextActionText ?? '').includes('Import historical') ||
      (nextActionText ?? '').includes('Add verified')
    expect(pointsToNextStep, 'Next action should point toward historical or enrichment').toBe(true)

    await expectNoFakeAlumniText(page)
  })

  test('Test C: bad team slug shows error state', async ({ page }) => {
    await page.goto('/builder/agent?teamSlug=bad-team')
    await page.waitForLoadState('networkidle')

    // The error card should show a friendly message (not a crash)
    const errorCard = page.locator('.border-red-200').first()
    await expect(errorCard).toBeVisible({ timeout: 10000 })
    const errorText = await errorCard.textContent()
    expect(errorText).toContain('not found')

    // Should have a back link or create team link
    const links = await page.locator('a').all()
    const hrefs = await Promise.all(links.map(l => l.getAttribute('href')))
    const hasBack = hrefs.some(h => h === '/builder' || h === '/builder/new')
    expect(hasBack, 'Bad teamSlug page must have a link back to builder or create-team').toBe(true)

    await expectNoFakeAlumniText(page)
  })

  test('Test D: no teamSlug shows missing-team state', async ({ page }) => {
    await page.goto('/builder/agent')
    await page.waitForLoadState('networkidle')

    // The no-team state shows a specific message
    await expect(page.locator('text=No team selected')).toBeVisible({ timeout: 10000 })

    await expectNoFakeAlumniText(page)
  })
})
