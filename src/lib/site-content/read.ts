/**
 * Server-side reader for site content slots. Falls back to the slot's
 * registered default when no captain override is set. Use this from server
 * components and route handlers.
 */

import { getSiteContent, getAllSiteContent } from '@/lib/store/local-store'
import { CONTENT_SLOTS, getSlotDefault } from './slots'

export async function getSiteContentOrDefault(slotId: string): Promise<string> {
  const override = await getSiteContent(slotId)
  return override ?? getSlotDefault(slotId)
}

/** Prefetch every registered slot in a single store read. Useful at the top
 * of a page that renders multiple slots so we don't fan out store reads. */
export async function getAllSlotValues(): Promise<Record<string, string>> {
  const overrides = await getAllSiteContent()
  const out: Record<string, string> = {}
  for (const slot of CONTENT_SLOTS) {
    out[slot.id] = overrides[slot.id] ?? slot.default
  }
  return out
}
