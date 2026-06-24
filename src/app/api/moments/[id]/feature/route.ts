/**
 * POST /api/moments/[id]/feature
 *
 * Captain's Pick — toggles the featured flag on a Moment. Captains +
 * Founder only (requireCaptain). Reversible: call again to unfeature.
 *
 * This is the ONLY new capability captains gain beyond recognition.
 * It is member-facing (the ribbon shows on /moments), soft (reversible),
 * and does NOT touch /internal, /builder, roles, roster, or claims.
 */

import { NextResponse } from 'next/server'
import { requireCaptain } from '@/lib/auth/guards'
import { toggleMomentFeatured } from '@/lib/store/local-store'

interface Ctx {
  params: Promise<{ id: string }>
}

export async function POST(_req: Request, ctx: Ctx) {
  const gate = await requireCaptain()
  if (!gate.ok) return gate.response

  const { id } = await ctx.params
  const byName = gate.session.user?.name ?? 'Captain'

  const moment = await toggleMomentFeatured(id, byName)
  if (!moment) {
    return NextResponse.json({ error: 'Moment not found' }, { status: 404 })
  }

  return NextResponse.json({
    featured: !!moment.featuredAt,
    featuredAt: moment.featuredAt ?? null,
    featuredByName: moment.featuredByName ?? null,
  })
}
