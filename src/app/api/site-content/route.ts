/**
 * Public GET — returns the resolved value (override or default) for every
 * registered content slot. No auth: this is all marketing copy + images
 * that anyone visiting the site is going to see anyway.
 */

import { NextResponse } from 'next/server'
import { getAllSlotValues } from '@/lib/site-content/read'

export async function GET() {
  const values = await getAllSlotValues()
  return NextResponse.json({ values })
}
