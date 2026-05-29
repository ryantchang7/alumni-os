/**
 * Viewer-prioritized list helpers.
 *
 * As Penn Golf grows past ~50 active members, "Open to Coffee" /
 * "Open to a Round" lists need a smarter sort than "most recently
 * saved." Members in the viewer's own city are the most useful surface
 * (that's who you can actually grab coffee with), then same-state,
 * then everyone else by recency. The viewer is also filtered out of
 * their own list — they don't need to see themselves there.
 *
 * Usage from a server page:
 *
 *   const viewer = await resolveViewerLocation(session, store, team.id)
 *   const list = prioritizeForViewer(candidates, viewer).slice(0, 12)
 */

import type { Session } from 'next-auth'
import type { Store } from '@/lib/store/types'

export interface ViewerContext {
  /** linkedPersonId — used to filter the viewer out of their own list.
   *  Undefined for non-approved viewers. */
  personId?: string
  /** Current city, raw string from the enrichment record (or hometown
   *  fallback). The helper handles normalization. */
  city?: string
  /** Two-letter state code or full state name; the helper compares
   *  case-insensitively. */
  state?: string
}

export interface Prioritizable {
  personId: string
  city?: string
  state?: string
  /** ISO timestamp of last profile update; recency tiebreaker. */
  updatedAt?: string
}

function norm(s: string | undefined): string {
  return s?.trim().toLowerCase() ?? ''
}

/**
 * Sort by same-city → same-state → recently-active, and strip the
 * viewer themselves out so they don't see their own card in their own
 * "open to X" lists. Stable on ties (preserves input order).
 */
export function prioritizeForViewer<T extends Prioritizable>(
  rows: T[],
  viewer: ViewerContext,
): T[] {
  const myCity = norm(viewer.city)
  const myState = norm(viewer.state)

  const filtered = viewer.personId
    ? rows.filter(r => r.personId !== viewer.personId)
    : rows

  // Decorate each row with the comparison keys, sort, undecorate. Faster
  // than recomputing inside the comparator on every comparison and
  // gives us a stable sort for free (index tiebreaker).
  return filtered
    .map((row, index) => {
      const rowCity = norm(row.city)
      const rowState = norm(row.state)
      return {
        row,
        index,
        sameCity: myCity !== '' && rowCity === myCity ? 1 : 0,
        sameState: myState !== '' && rowState === myState ? 1 : 0,
        updatedAt: row.updatedAt ?? '',
      }
    })
    .sort((a, b) => {
      if (a.sameCity !== b.sameCity) return b.sameCity - a.sameCity
      if (a.sameState !== b.sameState) return b.sameState - a.sameState
      const ts = b.updatedAt.localeCompare(a.updatedAt)
      if (ts !== 0) return ts
      return a.index - b.index
    })
    .map(d => d.row)
}

/**
 * Pull the viewer's location from the store for a given session. Reads:
 *   1. Account linked via session.accountId
 *   2. The matching PersonEnrichment for current city/state
 *   3. Falls back to TeamMembership.hometown if no enrichment city
 *
 * Returns { personId, city, state } — fields are undefined when the
 * viewer isn't signed in / hasn't claimed a card / hasn't set a
 * location. The helper functions tolerate undefined fields.
 */
export function resolveViewerLocation(
  session: Session | null,
  store: Pick<Store, 'accounts' | 'personEnrichments' | 'teamMemberships'>,
  teamId: string,
): ViewerContext {
  const accountId = session?.accountId
  if (!accountId) return {}
  const account = store.accounts.find(a => a.id === accountId)
  const personId = account?.linkedPersonId
  if (!personId) return {}

  const enrichment = store.personEnrichments.find(
    e => e.teamId === teamId && e.personId === personId,
  )
  const membership = store.teamMemberships.find(
    m => m.teamId === teamId && m.personId === personId,
  )

  return {
    personId,
    city: enrichment?.city ?? membership?.hometown,
    state: enrichment?.state,
  }
}
