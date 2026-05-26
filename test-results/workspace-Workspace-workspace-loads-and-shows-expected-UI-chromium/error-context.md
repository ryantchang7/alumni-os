# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workspace.spec.ts >> Workspace >> workspace loads and shows expected UI
- Location: e2e/workspace.spec.ts:11:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="workspace-ready"]')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('[data-testid="workspace-ready"]')

```

```yaml
- navigation:
  - button "previous" [disabled]:
    - img "previous"
  - text: 1/1
  - button "next" [disabled]:
    - img "next"
- img
- img
- text: Next.js 16.2.6 Turbopack
- img
- dialog "Build Error":
  - text: Build Error
  - button "Copy Error Info":
    - img
  - button "No related documentation found" [disabled]:
    - img
  - button "Attach Node.js inspector":
    - img
  - text: Error parsing package.json file
  - img
  - text: ./node_modules/next/package.json (1:1)
  - button "Open in editor":
    - img
  - text: "Error parsing package.json file package.json is not parseable: invalid JSON: EOF while parsing a value at line 1 column 0"
- button "Open Next.js Dev Tools":
  - img
- button "Open issues overlay": 1 Issue
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | import { resetAndSeedPennTeam } from './utils/store'
  3  | import { expectNoFakeAlumniText, expectNoInfiniteLoading } from './utils/assertions'
  4  | import { TEAM_SLUG } from './utils/test-data'
  5  | 
  6  | test.describe('Workspace', () => {
  7  |   test.beforeAll(() => {
  8  |     resetAndSeedPennTeam()
  9  |   })
  10 | 
  11 |   test('workspace loads and shows expected UI', async ({ page }) => {
  12 |     await page.goto(`/builder/workspace?teamSlug=${TEAM_SLUG}`)
  13 |     await page.waitForLoadState('networkidle')
  14 | 
> 15 |     await expect(page.locator('[data-testid="workspace-ready"]')).toBeVisible({ timeout: 15000 })
     |                                                                   ^ Error: expect(locator).toBeVisible() failed
  16 | 
  17 |     const header = await page.textContent('h1')
  18 |     expect(header).toContain("Men's Golf")
  19 | 
  20 |     const bodyText = await page.textContent('body')
  21 |     expect(bodyText).toMatch(/University of Pennsylvania/i)
  22 | 
  23 |     await expect(page.locator('[data-testid="recommended-action"]')).toBeVisible()
  24 |     const actionText = await page.locator('[data-testid="recommended-action"]').textContent()
  25 |     expect(actionText).toContain('Extract current roster')
  26 | 
  27 |     const checklist = page.locator('[data-testid="readiness-checklist"]')
  28 |     await expect(checklist).toBeVisible()
  29 |     const checklistText = await checklist.textContent()
  30 |     expect(checklistText).toContain('Team created')
  31 |     expect(checklistText).toContain('Current roster extracted')
  32 |     expect(checklistText).toContain('Entries promoted')
  33 |     expect(checklistText).toContain('Historical seasons imported')
  34 |     expect(checklistText).toContain('Graph quality reviewed')
  35 |     expect(checklistText).toContain('Profiles enriched')
  36 | 
  37 |     const workflowSteps = page.locator('[data-testid="workflow-steps"]')
  38 |     await expect(workflowSteps).toBeVisible()
  39 |     const stepsText = await workflowSteps.textContent()
  40 |     expect(stepsText).toContain('Verified profile details')
  41 | 
  42 |     const links = await page.locator('a').all()
  43 |     const hrefs = await Promise.all(links.map(l => l.getAttribute('href')))
  44 |     const hrefSet = hrefs.filter(Boolean) as string[]
  45 | 
  46 |     expect(hrefSet.some(h => h.includes('/builder/debug-roster'))).toBe(true)
  47 |     expect(hrefSet.some(h => h.includes('/builder/history'))).toBe(true)
  48 |     expect(hrefSet.some(h => h.includes('/builder/promote'))).toBe(true)
  49 |     expect(hrefSet.some(h => h.includes('/builder/people'))).toBe(true)
  50 |     expect(hrefSet.some(h => h.includes('/builder/quality'))).toBe(true)
  51 |     expect(hrefSet.some(h => h.includes('/builder/graph'))).toBe(true)
  52 |     expect(hrefSet.some(h => h.includes('/builder/enrich'))).toBe(true)
  53 | 
  54 |     await expectNoFakeAlumniText(page)
  55 |     await expectNoInfiniteLoading(page)
  56 |   })
  57 | })
  58 | 
```