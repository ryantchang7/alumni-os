/**
 * Put the first Alumni Spotlight and the first real gathering into the store.
 *
 * Both surfaces were empty: `/spotlight` had never featured anyone and said
 * "Coming soon", and upcoming gatherings was zero on both programs, which left
 * the 19th Hole and The Course looking dormant. Charlie Carroll's note of
 * 2 November said the board's primary objective is seeing people connect and
 * engage, so those two empty rooms were the ones that mattered most. Ryan
 * approved this exact content on 2 November.
 *
 * Shaped like the other cron-authed seeds for the same reason: production's KV
 * credentials are Sensitive and unreadable, so a narrow route is the only way
 * to make this write from the repo.
 *
 * - It takes no input. Both pieces of content are below, in full.
 * - It resolves people by the store's own `normalizeName`, never by a
 *   hardcoded id, so it cannot attach a spotlight to the wrong person.
 * - It creates the spotlight only when nobody has ever been featured, and the
 *   gathering only when no gathering with that title exists on that team. Run
 *   it twice and the second run writes nothing.
 * - **It does not notify anyone.** The interactive route broadcasts a push to
 *   every approved member; doing that from a script, on Ryan's behalf, the
 *   night before the meeting is not this route's call to make. The content
 *   appears on the pages, and that is all.
 *
 * Auth: Authorization: Bearer <CRON_SECRET>, or a founder session.
 * `?dryRun=1` reports what it would write and writes nothing.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCronAuth } from '@/lib/cron-auth'
import { requireFounder } from '@/lib/auth/guards'
import { FOUNDER_EMAILS } from '@/lib/badges'
import { PROGRAMS } from '@/lib/teams/programs'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Every fact here is on penngolfclubhouse.com/scotland or Carter's Member Book
 * card: the 2018 captaincy, the 2019 class year, four years of letters, three
 * seasons overlapping Amay Poria, and the October 2026 alumni trip. Nothing
 * about his life since Penn is asserted, because nothing about it was sourced.
 */
const SPOTLIGHT = {
  /** Matched on the normalized name, not an id. */
  personName: 'Carter Thompson',
  headline: 'Men’s captain, 2018 · C’19',
  blurb: [
    'Carter captained the men’s team in 2018 and graduated in 2019, lettering all four years. He and Amay Poria overlapped for three seasons.',
    'Three weeks ago the two of them were back on a Penn trip together. Both travelled to St Andrews with the alumni group, played Kingsbarns and Carnoustie alongside the current team, and sat down to the farewell dinner in the Carnoustie clubhouse with players they had walked eighteen holes with that afternoon.',
    'That is the whole idea of this place, inside one week. Different generations, same program, same tee sheet.',
  ].join('\n\n'),
}

const GATHERING = {
  type: 'coffee' as const,
  title: 'Penn Golf Coffee, Midtown',
  description:
    'Standing coffee before work for anyone in the city. No agenda and no speeches. If you are near Grand Central, come for twenty minutes and meet whoever turns up. First one, so if it works we make it monthly.',
  hostName: 'Ryan Chang',
  venue: 'Gregorys Coffee, 41st & Madison',
  city: 'New York',
  state: 'NY',
  dateText: 'Thursday, November 12, 2026',
  dateISO: '2026-11-12',
  timeText: '8:00 AM',
  capacity: 12,
  audience: 'both' as const,
  vibe: 'casual' as const,
  status: 'open' as const,
}

async function runJob(req: NextRequest) {
  if (!checkCronAuth(req)) {
    const gate = await requireFounder()
    if (!gate.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const dryRun = req.nextUrl.searchParams.get('dryRun') === '1'

  const {
    readStore,
    getTeamBySlug,
    normalizeName,
    createSpotlight,
    createClubhouseGathering,
    getSpotlights,
  } = await import('@/lib/store/local-store')

  const team = await getTeamBySlug(PROGRAMS.mens.slug)
  if (!team) {
    return NextResponse.json({ error: 'No men’s team row.' }, { status: 409 })
  }

  const store = await readStore()

  // The spotlight records who featured it. There is no session on a cron
  // call, so use the founder's own account, which is who would have clicked
  // the button. Without one, refuse rather than invent an attribution.
  const founder = store.accounts.find(a =>
    FOUNDER_EMAILS.has((a.email ?? '').toLowerCase().trim()),
  )
  if (!founder) {
    return NextResponse.json(
      { error: 'No founder account in the store to attribute the feature to.' },
      { status: 409 },
    )
  }

  const result: Record<string, unknown> = { dryRun, spotlight: null, gathering: null }

  // ── Spotlight ────────────────────────────────────────────────────────────
  const existing = await getSpotlights()
  if (existing.length > 0) {
    result.spotlight = {
      skipped: 'a spotlight already exists',
      current: existing[0].name,
      featuredAt: existing[0].featuredAt,
    }
  } else {
    const norm = normalizeName(SPOTLIGHT.personName)
    const person = store.people.find(p => p.normalizedName === norm)
    if (!person) {
      result.spotlight = { error: `No person matching ${SPOTLIGHT.personName}.` }
    } else {
      const plan = {
        personId: person.id,
        name: person.canonicalName,
        headline: SPOTLIGHT.headline,
        blurb: SPOTLIGHT.blurb,
        featuredByAccountId: founder.id,
      }
      if (!dryRun) await createSpotlight(plan)
      result.spotlight = {
        created: true,
        name: person.canonicalName,
        personId: person.id,
        headline: plan.headline,
        blurbChars: plan.blurb.length,
      }
    }
  }

  // ── Gathering ────────────────────────────────────────────────────────────
  const dupe = store.clubhouseGatherings.find(
    g => g.teamId === team.id && g.title.trim().toLowerCase() === GATHERING.title.toLowerCase(),
  )
  if (dupe) {
    result.gathering = { skipped: 'already on the board', id: dupe.id, dateText: dupe.dateText }
  } else {
    const host = store.people.find(p => p.normalizedName === normalizeName(GATHERING.hostName))
    const plan = {
      teamId: team.id,
      ...GATHERING,
      hostPersonId: host?.id,
    }
    if (!dryRun) await createClubhouseGathering(plan)
    result.gathering = {
      created: true,
      title: plan.title,
      dateText: plan.dateText,
      venue: plan.venue,
      hostPersonId: plan.hostPersonId ?? '(no person row matched; host name only)',
    }
  }

  return NextResponse.json({ ok: true, ...result })
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
