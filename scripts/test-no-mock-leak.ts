/**
 * Verifies that serious app routes do not import mock-data or contain
 * known fictional alumni names.
 *
 * Run: npm run test:no-mock-leak
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const ROOT = join(__dirname, '..')

const SCAN_DIRS = [
  'src/app/builder',
  'src/app/player',
  'src/app/teams/penn-mens-golf',
  'src/app/api',
  'src/lib/agent',
]

const MOCK_IMPORT_PATTERNS = [
  /@\/lib\/mock-data/,
  /from ['"]\.\.\/lib\/mock-data['"]/,
  /from ['"]\.\.\/\.\.\/lib\/mock-data['"]/,
  /from ['"]\.+\/lib\/mock-data['"]/,
]

const FICTIONAL_NAMES = [
  'William Hartley',
  'Carter Brennan',
  'James Whitmore',
  'Alex Chen',
  'Derek Sullivan',
  'Ryan Townsend',
  'Thomas Patel',
  'Michael Okafor',
  'Noah Fischer',
  'Brian Larson',
]

function collectFiles(dir: string): string[] {
  const abs = join(ROOT, dir)
  const results: string[] = []
  try {
    for (const entry of readdirSync(abs)) {
      const full = join(abs, entry)
      const stat = statSync(full)
      if (stat.isDirectory()) {
        results.push(...collectFiles(join(dir, entry)))
      } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
        results.push(join(dir, entry))
      }
    }
  } catch {
    // directory does not exist
  }
  return results
}

interface Violation {
  file: string
  line: number
  type: 'mock-import' | 'fictional-name'
  detail: string
}

const violations: Violation[] = []

for (const dir of SCAN_DIRS) {
  for (const relPath of collectFiles(dir)) {
    // Skip demo-isolated files
    if (relPath.includes('/demo/') || relPath.includes('demo-only')) continue

    const absPath = join(ROOT, relPath)
    const content = readFileSync(absPath, 'utf8')
    const lines = content.split('\n')

    lines.forEach((line, idx) => {
      for (const pattern of MOCK_IMPORT_PATTERNS) {
        if (pattern.test(line)) {
          violations.push({
            file: relPath,
            line: idx + 1,
            type: 'mock-import',
            detail: line.trim(),
          })
        }
      }
      for (const name of FICTIONAL_NAMES) {
        if (line.includes(name)) {
          violations.push({
            file: relPath,
            line: idx + 1,
            type: 'fictional-name',
            detail: `"${name}" found: ${line.trim().slice(0, 80)}`,
          })
        }
      }
    })
  }
}

console.log('── Mock Data Leak Test ──\n')
console.log(`Scanned directories: ${SCAN_DIRS.join(', ')}`)
console.log()

if (violations.length === 0) {
  console.log('  ✓  No mock-data imports or fictional alumni names found in serious app routes.')
  console.log()
  console.log('─'.repeat(50))
  console.log('Total: 1 passed, 0 failed')
  console.log('All mock leak tests passed.')
  process.exit(0)
} else {
  console.log(`  ✗  Found ${violations.length} violation(s):\n`)
  for (const v of violations) {
    const typeLabel = v.type === 'mock-import' ? '[MOCK IMPORT]' : '[FICTIONAL NAME]'
    console.log(`  ${typeLabel} ${v.file}:${v.line}`)
    console.log(`     ${v.detail}`)
  }
  console.log()
  console.log('─'.repeat(50))
  console.log(`Total: 0 passed, ${violations.length} failed`)
  process.exit(1)
}
