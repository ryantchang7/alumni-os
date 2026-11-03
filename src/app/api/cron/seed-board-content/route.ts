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
 *   gathering only when no gathering with that title exists. Run it twice and
 *   the second run writes nothing.
 * - **Both go in under one `mutateStore`.** The first version called
 *   `createSpotlight` then `createClubhouseGathering`, which is two writes in
 *   one request through two different helpers. `readStore` is memoised per
 *   request, so the second helper read a snapshot taken before the first had
 *   written, and one of the two changes was lost: the spotlight landed and the
 *   gathering did not. One compare-and-swap over both lists cannot do that.
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
import type { AlumniSpotlight, ClubhouseGathering } from '@/lib/store/types'

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

  const { readStore, getTeamBySlug, normalizeName, mutateStore } = await import(
    '@/lib/store/local-store',
  )

  const team = await getTeamBySlug(PROGRAMS.mens.slug)
  if (!team) {
    return NextResponse.json({ error: 'No men\u2019s team row.' }, { status: 409 })
  }

  const snapshot = await readStore()

  // The spotlight records who featured it. There is no session on a cron
  // call, so use the founder's own account, which is who would have clicked
  // the button. Without one, refuse rather than invent an attribution.
  const founder = snapshot.accounts.find(a =>
    FOUNDER_EMAILS.has((a.email ?? '').toLowerCase().trim()),
  )
  if (!founder) {
    return NextResponse.json(
      { error: 'No founder account in the store to attribute the feature to.' },
      { status: 409 },
    )
  }

  const person = snapshot.people.find(
    p => p.normalizedName === normalizeName(SPOTLIGHT.personName),
  )
  if (!person) {
    return NextResponse.json(
      { error: `No person matching ${SPOTLIGHT.personName}.` },
      { status: 409 },
    )
  }
  const host = snapshot.people.find(
    p => p.normalizedName === normalizeName(GATHERING.hostName),
  )

  /**
   * Applied to whichever store copy the compare-and-swap hands us, and safe to
   * run again on a retry because both halves check before they write. The
   * gathering is matched on title alone, not title plus team, so a row that
   * ended up under the wrong team cannot cause a duplicate.
   */
  const apply = (store: {
    alumniSpotlights: AlumniSpotlight[]
    clubhouseGatherings: ClubhouseGathering[]
  }) => {
    const out: Record<string, unknown> = {}
    const now = new Date().toISOString()

    const already = store.alumniSpotlights[0]
    if (already) {
      out.spotlight = { skipped: 'a spotlight already exists', current: already.name }
    } else {
      store.alumniSpotlights.unshift({
        id: `spot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        personId: person.id,
        name: person.canonicalName,
        headline: SPOTLIGHT.headline,
        blurb: SPOTLIGHT.blurb,
        featuredByAccountId: founder.id,
        featuredAt: now,
      })
      out.spotlight = { created: true, name: person.canonicalName }
    }

    const dupe = store.clubhouseGatherings.find(
      g => g.title.trim().toLowerCase() === GATHERING.title.toLowerCase(),
    )
    if (dupe) {
      out.gathering = {
        skipped: 'already in the store',
        id: dupe.id,
        teamId: dupe.teamId,
        matchesMensTeam: dupe.teamId === team.id,
        status: dupe.status,
      }
    } else {
      const g: ClubhouseGathering = {
        id: crypto.randomUUID(),
        teamId: team.id,
        ...GATHERING,
        hostPersonId: host?.id,
        createdAt: now,
        updatedAt: now,
      }
      store.clubhouseGatherings.push(g)
      out.gathering = { created: true, id: g.id, teamId: g.teamId, title: g.title }
    }
    return out
  }

  // A dry run reports against a throwaway copy of the two lists, so nothing
  // it touches can reach the store.
  const result = dryRun
    ? apply({
        alumniSpotlights: [...snapshot.alumniSpotlights],
        clubhouseGatherings: [...snapshot.clubhouseGatherings],
      })
    : await mutateStore(apply)

  return NextResponse.json({
    ok: true,
    dryRun,
    gatheringsInStore: snapshot.clubhouseGatherings.length,
    mensTeamId: team.id,
    ...result,
  })

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
