import { execFileSync } from 'child_process'
import path from 'path'

const ROOT = path.resolve(__dirname, '../..')
const TSX = path.join(ROOT, 'node_modules', '.bin', 'tsx')

function run(script: string) {
  execFileSync(TSX, [path.join(ROOT, 'scripts', script)], {
    cwd: ROOT,
    stdio: 'pipe',
    encoding: 'utf-8',
  })
}

export function resetStore() {
  run('reset-local-store.ts')
}

export function seedPennTeam() {
  run('seed-penn-team.ts')
}

export function seedDemoPromotedPeople() {
  run('seed-demo-promoted-people.ts')
}

export function seedAgentDemo() {
  run('seed-agent-demo.ts')
}

export function resetAndSeedPennTeam() {
  resetStore()
  seedPennTeam()
}

export function resetSeedAndPromoteDemoPeople() {
  resetStore()
  seedDemoPromotedPeople()
}

export function resetSeedAndAgentDemo() {
  resetStore()
  run('seed-agent-demo.ts')
}

export function resetSeedAndNetworkDemo() {
  resetStore()
  run('seed-network-demo.ts')
}
