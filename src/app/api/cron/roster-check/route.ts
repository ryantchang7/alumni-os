/**
 * Yearly roster reconcile (Sept 1). Fetches the official pennathletics
 * roster, diffs it against the store's published current players, and
 * notifies the founder with who joined / left — no auto-mutation, the
 * founder reconciles by hand in /internal/current-roster.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkCronAuth } from '@/lib/cron-auth'
import { readStore, getTeamBySlug } from '@/lib/store/local-store'
import { FOUNDER_EMAILS } from '@/lib/badges'
import { notifyMany } from '@/lib/notifications/notify'
import { alertFounders } from '@/lib/ops/alert'

const ROSTER_URL = 'https://pennathletics.com/sports/mens-golf/roster'

const norm = (s: string) =>
  s.toLowerCase().replace(/['’.]/g, '').replace(/\s+/g, ' ').trim()

export async function GET(request: NextRequest) {
  if (!checkCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let html = ''
  try {
    const res = await fetch(ROSTER_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh)' },
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`roster page ${res.status}`)
    html = await res.text()
  } catch (e) {
    await alertFounders('roster-check', `Could not fetch roster: ${String(e)}`)
    return NextResponse.json(
      { ok: false, error: `Could not fetch roster: ${String(e)}` },
      { status: 502 },
    )
  }

  const officialNames = [
    ...new Set(
      [...html.matchAll(/sidearm-roster-player-name[^>]*>\s*(?:<[^>]+>\s*)*([A-Z][a-zA-Z'’. -]{3,40})/g)]
        .map(m => m[1].trim())
        .filter(n => n.includes(' ')), // full names only (skip split first names)
    ),
  ]
  if (officialNames.length === 0) {
    await alertFounders(
      'roster-check',
      'Roster parse produced zero names, pennathletics markup likely changed.',
    )
    return NextResponse.json(
      { ok: false, error: 'Roster parse produced zero names, page layout may have changed.' },
      { status: 502 },
    )
  }

  const store = await readStore()
  const team = await getTeamBySlug('penn-mens-golf')
  if (!team) return NextResponse.json({ ok: false, error: 'Team not found' }, { status: 500 })

  const storeNames = store.teamMemberships
    .filter(m => m.teamId === team.id && m.memberRole === 'current_player' && m.publishedToNetwork === true)
    .map(m => store.people.find(p => p.id === m.personId)?.canonicalName)
    .filter((n): n is string => !!n)

  const officialSet = new Set(officialNames.map(norm))
  const storeSet = new Set(storeNames.map(norm))
  const joined = officialNames.filter(n => !storeSet.has(norm(n)))
  const left = storeNames.filter(n => !officialSet.has(norm(n)))

  if (joined.length > 0 || left.length > 0) {
    const founderIds = store.accounts
      .filter(a => a.email && FOUNDER_EMAILS.has(a.email.toLowerCase()))
      .map(a => a.id)
    const parts = [
      joined.length ? `New on the official roster: ${joined.join(', ')}` : '',
      left.length ? `No longer listed: ${left.join(', ')}` : '',
    ].filter(Boolean)
    try {
      await notifyMany(founderIds, {
        type: 'team_update',
        title: 'New season, roster check',
        body: parts.join(' · ').slice(0, 240),
        href: '/internal/current-roster',
      })
    } catch (e) {
      console.warn('[roster-check] notify failed:', e)
    }
  }

  return NextResponse.json({ ok: true, official: officialNames.length, joined, left })
}
