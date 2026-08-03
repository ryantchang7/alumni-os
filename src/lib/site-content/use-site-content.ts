'use client'

import { useEffect, useState } from 'react'
import { getSlotDefault } from './slots'

let cache: Record<string, string> | null = null
let inflight: Promise<Record<string, string>> | null = null

async function fetchAll(): Promise<Record<string, string>> {
  if (cache) return cache
  if (inflight) return inflight
  inflight = fetch('/api/site-content')
    .then(r => (r.ok ? r.json() : { values: {} }))
    .then(d => {
      cache = (d.values ?? {}) as Record<string, string>
      return cache
    })
    .catch(() => {
      cache = {}
      return cache
    })
  return inflight
}

/**
 * Read a captain-edited content slot from the client. Returns `fallback`
 * while the values are loading and as a default when the slot has no
 * override AND no registered default (shouldn't happen, but safe). The
 * fetch is memoized so multiple components on the same page share a
 * single network round-trip.
 */
export function useSiteContent(slotId: string, fallback: string): string {
  const [value, setValue] = useState<string>(() => cache?.[slotId] ?? fallback)
  useEffect(() => {
    let alive = true
    void fetchAll().then(values => {
      if (alive && values[slotId] !== undefined) setValue(values[slotId])
    })
    return () => {
      alive = false
    }
  }, [slotId])
  return value
}

/**
 * Same as useSiteContent, but the fallback IS the registry default — so the
 * server-rendered text and the post-fetch text always agree. Page-local
 * fallback literals had drifted from slots.ts, which made copy visibly
 * change after hydration (the landing headline was the worst offender).
 */
export function useSlot(slotId: string): string {
  return useSiteContent(slotId, getSlotDefault(slotId))
}
