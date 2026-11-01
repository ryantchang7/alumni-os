/**
 * Create the store's team row for any live program that does not have one.
 *
 * This exists because production's KV credentials are marked Sensitive in
 * Vercel and cannot be read back, so there is no way to run the store
 * helpers against production from the repo. The sanctioned way to make a
 * production write from here is a cron-authed route with one narrow,
 * explicitly-targeted capability, which is what this is.
 *
 * It is deliberately boring:
 *
 * - It takes no input. Every value comes from the program registry, so a
 *   caller cannot name a team, a slug or a URL.
 * - It only ever creates. `createTeam` returns the existing row when the
 *   slug already exists, so running this twice is the same as running it
 *   once, and it can never rename or overwrite a row.
 * - It only touches programs marked `live` in the registry.
 *
 * Auth: Authorization: Bearer <CRON_SECRET>, or a founder session.
 * `?dryRun=1` reports what is missing and writes nothing.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCronAuth } from '@/lib/cron-auth'
import { requireFounder } from '@/lib/auth/guards'
import { livePrograms } from '@/lib/teams/programs'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const SCHOOL_NAME = 'University of Pennsylvania'
const SPORT = 'Golf'

async function runJob(req: NextRequest) {
  if (!checkCronAuth(req)) {
    const gate = await requireFounder()
    if (!gate.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const dryRun = req.nextUrl.searchParams.get('dryRun') === '1'

  const { getTeamBySlug, createTeam } = await import('@/lib/store/local-store')

  const present: string[] = []
  const created: string[] = []
  const wouldCreate: string[] = []

  for (const program of livePrograms()) {
    const existing = await getTeamBySlug(program.slug)
    if (existing) {
      present.push(program.slug)
      continue
    }
    if (dryRun) {
      wouldCreate.push(program.slug)
      continue
    }
    await createTeam({
      schoolName: SCHOOL_NAME,
      teamName: program.teamName,
      sport: SPORT,
      gender: program.gender,
      websiteUrl: program.websiteUrl,
      slug: program.slug,
    })
    created.push(program.slug)
  }

  return NextResponse.json({ ok: true, dryRun, present, created, wouldCreate })
}

export async function GET(req: NextRequest) {
  try {
    return await runJob(req)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  return GET(req)
}
