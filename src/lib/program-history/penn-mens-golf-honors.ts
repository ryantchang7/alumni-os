/**
 * Penn Men's Golf, individual honours, season by season.
 *
 * The men's record book carried none of this. The Hall of Fame page said so
 * in a comment — "the underlying list exists ... until it is transcribed
 * season by season there is nothing to put here" — while the women's page
 * showed eight named seasons. The men's list had existed on Penn's own
 * website the whole time, in two PDFs nobody had opened.
 *
 * Sources, both read 2026-11-15:
 *
 *   https://pennathletics.com/documents/2026/4/27/MGOLF_history_-_Ivy_Championship.pdf
 *     All-Ivy by season (1970-2026), individual medalists, the
 *     All-Championship team, and the Championship scoring records.
 *   https://pennathletics.com/documents/2025/7/29/MGOLF_history_-_individual_honors.pdf
 *     Ivy Coach / Player / Rookie of the Year, GCAA All-America, GCAA
 *     All-Region, GCAA All-America Scholar.
 *
 * One honour comes from neither: Hayden Adams' first-team All-Ivy for
 * 2025-26, which Penn announced on 29 April 2026, two days after the
 * Championship PDF was published. The PDF's first-team list stops at 2022.
 *
 * **How All-Ivy was decided changed twice, and the rows say which rule
 * applied.** Through 2009 the top seven Ivy finishers at the Championship
 * were All-Ivy, with no first or second team (and from 1970-74 that meant
 * the Eastern Intercollegiate, which is where the Ivy champion was decided
 * from 1951 to 1974). From 2010 to 2024 the top five finishers were first
 * team and sixth through tenth second team. Since 2025 the coaches vote
 * after the season. A placing is therefore not comparable across those
 * eras, so each row carries its finish where Penn gives one and the
 * seasons note which rule was in force.
 *
 * A season missing from this file had no Penn honouree that Penn records,
 * which for All-Ivy means no Penn player finished in the qualifying places.
 * That is different from the women's file, where seasons are missing
 * because Penn never published them.
 */

import type { ProgramHonorSeason } from './types'

/** One honour: who, what, and the finish behind it where there is one. */
interface HonorRow {
  year: number
  name: string
  honor: string
  detail?: string
}

/**
 * Everything Penn records, flat, newest season first within each block so
 * the transcription can be checked against the PDFs block by block.
 */
const ROWS: HonorRow[] = [
  // ── All-Ivy, voted by the coaches (2025- ) ───────────────────────────
  { year: 2026, name: 'Hayden Adams', honor: 'First-Team All-Ivy', detail: 'Voted by the coaches' },
  {
    year: 2026,
    name: 'Hayden Adams',
    honor: 'Ivy All-Championship Team',
    detail: 'Tied for fifth; his 219 is the fifth-best score by a Penn player at the Championship',
  },
  { year: 2025, name: 'Max Fonseca', honor: 'Second-Team All-Ivy', detail: 'Voted by the coaches' },
  {
    year: 2025,
    name: 'Hayden Adams',
    honor: 'Honorable Mention All-Ivy',
    detail: 'The first season Penn had an honourable-mention selection',
  },

  // ── All-Ivy, first and second team by finish (2010-2024) ─────────────
  { year: 2023, name: 'Mark Haghani', honor: 'Second-Team All-Ivy', detail: 'Tied for 10th' },
  { year: 2023, name: 'John Richardson', honor: 'Second-Team All-Ivy', detail: 'Tied for 10th' },
  { year: 2022, name: 'Mark Haghani', honor: 'First-Team All-Ivy', detail: 'Tied for second' },
  { year: 2019, name: 'Mitchell Cornell', honor: 'First-Team All-Ivy', detail: 'Tied for third' },
  { year: 2018, name: 'Mitchell Cornell', honor: 'Second-Team All-Ivy', detail: 'Tied for 10th' },
  { year: 2017, name: 'Zareh Kaloustian', honor: 'Second-Team All-Ivy', detail: 'Tied for eighth' },
  { year: 2017, name: 'Amay Poria', honor: 'Second-Team All-Ivy', detail: 'Tied for 10th' },
  { year: 2015, name: 'Austin Powell', honor: 'First-Team All-Ivy', detail: 'Second' },
  { year: 2015, name: 'Ben Cooley', honor: 'First-Team All-Ivy', detail: 'Fourth' },
  { year: 2014, name: 'Ben Cooley', honor: 'Second-Team All-Ivy', detail: 'Seventh' },
  { year: 2013, name: 'P.J. Fielding', honor: 'First-Team All-Ivy', detail: 'Tied for second' },
  { year: 2013, name: 'Max Marsico', honor: 'First-Team All-Ivy', detail: 'Tied for second' },
  { year: 2012, name: 'P.J. Fielding', honor: 'First-Team All-Ivy', detail: 'Fourth' },
  { year: 2012, name: 'Scotty Williams', honor: 'First-Team All-Ivy', detail: 'Fifth' },
  { year: 2011, name: 'Scotty Williams', honor: 'First-Team All-Ivy', detail: 'Tied for fourth' },
  { year: 2011, name: 'Colin St. Maxens', honor: 'Second-Team All-Ivy', detail: '10th' },
  { year: 2010, name: 'Scotty Williams', honor: 'First-Team All-Ivy', detail: 'Champion' },
  { year: 2010, name: 'Chance Pipitone', honor: 'Second-Team All-Ivy', detail: 'Tied for seventh' },

  // ── All-Ivy, top seven Ivy finishers (1970-2009) ─────────────────────
  { year: 2009, name: 'Brett Rendina', honor: 'All-Ivy', detail: 'Tied for third' },
  { year: 2009, name: 'Scotty Williams', honor: 'All-Ivy', detail: 'Tied for fifth' },
  { year: 2008, name: 'Michael Blodgett', honor: 'All-Ivy', detail: 'Champion' },
  { year: 2007, name: 'Chance Pipitone', honor: 'All-Ivy', detail: 'Tied for second' },
  { year: 2007, name: 'Dean Merrill', honor: 'All-Ivy', detail: 'Tied for seventh' },
  { year: 2006, name: 'Sean Barrett', honor: 'All-Ivy', detail: 'Tied for sixth' },
  { year: 2005, name: 'Sean Barrett', honor: 'All-Ivy', detail: 'Tied for second' },
  { year: 2004, name: 'Larry Nickell', honor: 'All-Ivy', detail: 'Tied for seventh' },
  { year: 2004, name: 'Derek Rogers', honor: 'All-Ivy', detail: 'Tied for seventh' },
  { year: 2003, name: 'Endel Liias', honor: 'All-Ivy', detail: 'Tied for fourth' },
  { year: 2003, name: 'Chad Perman', honor: 'All-Ivy', detail: 'Tied for fourth' },
  { year: 2001, name: 'Chad Perman', honor: 'All-Ivy', detail: 'Fourth' },
  { year: 2001, name: 'Kyle Moran', honor: 'All-Ivy', detail: 'Fifth' },
  { year: 2001, name: 'Endel Liias', honor: 'All-Ivy', detail: 'Seventh' },
  { year: 2000, name: 'Chad Perman', honor: 'All-Ivy', detail: 'Second' },
  { year: 2000, name: 'Kyle Moran', honor: 'All-Ivy', detail: 'Tied for third' },
  { year: 1999, name: 'Rob Goldfaden', honor: 'All-Ivy', detail: 'Tied for second' },
  { year: 1999, name: 'Kyle Moran', honor: 'All-Ivy', detail: 'Tied for second' },
  { year: 1998, name: 'Christoph Kyrle', honor: 'All-Ivy', detail: 'Second' },
  { year: 1998, name: 'Rob Goldfaden', honor: 'All-Ivy', detail: 'Tied for fifth' },
  { year: 1998, name: 'Adam Bradshaw', honor: 'All-Ivy', detail: 'Seventh' },
  { year: 1997, name: 'Brian Owens', honor: 'All-Ivy', detail: 'Tied for fourth' },
  { year: 1997, name: 'Adam Bradshaw', honor: 'All-Ivy', detail: 'Sixth' },
  { year: 1997, name: 'Rob Goldfaden', honor: 'All-Ivy', detail: 'Tied for seventh' },
  { year: 1995, name: 'Adam Bradshaw', honor: 'All-Ivy', detail: 'Tied for seventh' },
  { year: 1992, name: 'Julian Jordan', honor: 'All-Ivy', detail: 'Third' },
  { year: 1986, name: 'Burt McHugh', honor: 'All-Ivy', detail: 'Tied for sixth' },
  { year: 1984, name: 'Burt McHugh', honor: 'All-Ivy', detail: 'Third' },
  { year: 1981, name: 'Scott Benjamin', honor: 'All-Ivy', detail: 'Seventh' },
  { year: 1980, name: 'Steve Sieg', honor: 'All-Ivy', detail: 'Tied for fourth' },
  { year: 1978, name: 'Steve Sieg', honor: 'All-Ivy', detail: 'Third' },
  { year: 1978, name: 'Jerry Jacobs', honor: 'All-Ivy', detail: 'Tied for sixth' },
  { year: 1977, name: 'Jeff Kiley', honor: 'All-Ivy', detail: 'Sixth' },
  { year: 1976, name: 'Tom Wecal', honor: 'All-Ivy', detail: 'Second' },
  { year: 1976, name: 'Jeff Kiley', honor: 'All-Ivy', detail: 'Seventh' },
  { year: 1974, name: 'Vince Scarpetta', honor: 'All-Ivy', detail: 'Tied for first among Ivies' },
  { year: 1974, name: 'Tom Wecal', honor: 'All-Ivy', detail: 'Tied for first' },
  { year: 1974, name: 'Don DeAngelis', honor: 'All-Ivy', detail: 'Tied for fifth' },
  { year: 1973, name: 'Vince Scarpetta', honor: 'All-Ivy', detail: 'First among Ivies' },
  { year: 1973, name: 'Tom Wecal', honor: 'All-Ivy', detail: 'Sixth' },
  { year: 1972, name: 'Keith Griffin', honor: 'All-Ivy', detail: 'Second among Ivies' },
  { year: 1972, name: 'Vince Scarpetta', honor: 'All-Ivy', detail: 'Tied for fifth' },
  { year: 1971, name: 'Lee Burke', honor: 'All-Ivy', detail: 'Tied for fifth among Ivies' },
  { year: 1971, name: 'Don DeAngelis', honor: 'All-Ivy', detail: 'Tied for fifth' },

  // ── Individual medalists ─────────────────────────────────────────────
  //
  // Ivy Championship since 1975; the Eastern Intercollegiate before it.
  {
    year: 2010,
    name: 'Scotty Williams',
    honor: 'Ivy Championship medalist',
    detail: '72-69-73, 214 (+4), after beating Columbia’s Clark Granum on the first playoff hole',
  },
  {
    year: 2008,
    name: 'Mike Blodgett',
    honor: 'Ivy Championship medalist',
    detail: '75-67-76, 218 (+5)',
  },
  { year: 1960, name: 'Don Norbury', honor: 'Eastern Intercollegiate medalist' },
  { year: 1959, name: 'Don Norbury', honor: 'Eastern Intercollegiate medalist' },
  { year: 1954, name: 'Edward Wallace', honor: 'Eastern Intercollegiate medalist' },

  // ── Ivy League awards ────────────────────────────────────────────────
  { year: 2015, name: 'Austin Powell', honor: 'Ivy League Player of the Year' },
  { year: 2015, name: 'Bob Heintz', honor: 'Ivy League Coach of the Year' },
  { year: 2010, name: 'Colin St. Maxens', honor: 'Ivy League Rookie of the Year' },

  // ── GCAA All-America ─────────────────────────────────────────────────
  { year: 1975, name: 'Tom Wecal', honor: 'GCAA All-America, honorable mention' },
  { year: 1974, name: 'Tom Wecal', honor: 'GCAA All-America, honorable mention' },
  { year: 1973, name: 'Tom Wecal', honor: 'GCAA All-America, honorable mention' },
  { year: 1960, name: 'Don Norbury', honor: 'GCAA All-America, first team' },
  { year: 1959, name: 'Don Norbury', honor: 'GCAA All-America, second team' },

  // ── GCAA All-Region (Northeast) ──────────────────────────────────────
  { year: 2020, name: 'Mitchell Cornell', honor: 'GCAA All-Region' },
  { year: 2018, name: 'Josh Goldenberg', honor: 'GCAA All-Region' },
  { year: 2015, name: 'Austin Powell', honor: 'GCAA All-Region' },
  { year: 2013, name: 'Max Marsico', honor: 'GCAA All-Region' },
  { year: 2012, name: 'Max Marsico', honor: 'GCAA All-Region' },
  { year: 2010, name: 'Colin St. Maxens', honor: 'GCAA All-Region' },

  // ── GCAA All-America Scholar ─────────────────────────────────────────
  { year: 2025, name: 'Hayden Adams', honor: 'GCAA All-America Scholar' },
  { year: 2025, name: 'Max Fonseca', honor: 'GCAA All-America Scholar' },
  { year: 2024, name: 'Jimin Jung', honor: 'GCAA All-America Scholar' },
  { year: 2023, name: 'Mark Haghani', honor: 'GCAA All-America Scholar' },
  { year: 2023, name: 'Jimin Jung', honor: 'GCAA All-America Scholar' },
  { year: 2023, name: 'John Richardson', honor: 'GCAA All-America Scholar' },
  { year: 2023, name: 'George Roessler', honor: 'GCAA All-America Scholar' },
  { year: 2020, name: 'Mitchell Cornell', honor: 'GCAA All-America Scholar' },
  { year: 2019, name: 'Josh Goldenberg', honor: 'GCAA All-America Scholar' },
  { year: 2019, name: 'Zareh Kaloustian', honor: 'GCAA All-America Scholar' },
  { year: 2018, name: 'Josh Goldenberg', honor: 'GCAA All-America Scholar' },
  { year: 2018, name: 'Zareh Kaloustian', honor: 'GCAA All-America Scholar' },
  { year: 2018, name: 'Carter Thompson', honor: 'GCAA All-America Scholar' },
  { year: 2017, name: 'Amay Poria', honor: 'GCAA All-America Scholar' },
  { year: 2017, name: 'Carter Thompson', honor: 'GCAA All-America Scholar' },
  { year: 2013, name: 'P.J. Fielding', honor: 'GCAA All-America Scholar' },
  { year: 2012, name: 'P.J. Fielding', honor: 'GCAA All-America Scholar' },
  { year: 2012, name: 'Scotty Williams', honor: 'GCAA All-America Scholar' },
  { year: 2011, name: 'Scotty Williams', honor: 'GCAA All-America Scholar' },
  { year: 2010, name: 'Chance Pipitone', honor: 'GCAA All-America Scholar' },
  { year: 2003, name: 'Endel Liias', honor: 'GCAA All-America Scholar' },
  { year: 2003, name: 'Chad Perman', honor: 'GCAA All-America Scholar' },
  { year: 2003, name: 'Peyton Wallace', honor: 'GCAA All-America Scholar' },
  { year: 2002, name: 'Chad Perman', honor: 'GCAA All-America Scholar' },
  { year: 2002, name: 'Peyton Wallace', honor: 'GCAA All-America Scholar' },
  { year: 2001, name: 'Kyle Moran', honor: 'GCAA All-America Scholar' },
  { year: 2000, name: 'Kyle Moran', honor: 'GCAA All-America Scholar' },
]

/**
 * Editorial headlines, only where a season is more than a list of names.
 * Every other season gets its honourees' names, which is accurate and says
 * nothing a source does not support.
 */
const SEASON_TITLES: Record<number, string> = {
  2026: 'Hayden Adams, first team and the All-Championship team',
  2015: 'Austin Powell, Player of the Year, and Bob Heintz, Coach of the Year',
  2013: 'P.J. Fielding and Max Marsico tie for second',
  2010: 'Scotty Williams wins it in a playoff',
  2008: 'Mike Blodgett wins the Ivy Championship',
  2001: 'Three All-Ivy in one season',
  1998: 'Three All-Ivy as Penn wins its first Ivy title',
  1997: 'Three All-Ivy',
  1974: 'Penn ties for first and wins the Eastern Intercollegiate',
  1960: 'Don Norbury, All-America first team and medalist',
}

const SEASON_NOTES: Record<number, string> = {
  2026:
    'Adams was low Penn player in three of four spring events. All-Ivy has been voted on by the coaches since 2025; before that it went by finish at the Championship.',
  2025: 'The first season the coaches voted, which is also the first season Penn had an honourable mention.',
  2015: 'Penn won the Ivy League title, and took Player and Coach of the Year in the same season.',
  2010:
    'Williams tied Columbia’s Clark Granum and beat him on the first playoff hole. Colin St. Maxens was Rookie of the Year the same season.',
  2008: 'Blodgett’s 67 in the second round is still among the best rounds any Penn player has shot at the Championship.',
  1998: 'Penn won the Ivy League Championship, the programme’s first.',
  1974:
    'Penn won the Eastern Intercollegiate team title, the one time it did so, in the last era when the Eastern decided the Ivy champion. Scarpetta and Wecal tied for first among Ivy players.',
  1973:
    'Scarpetta was low Ivy player. Wecal was a GCAA All-America honourable mention in this season and the two that followed, the only Penn player to be named three years running.',
  1986:
    'McHugh’s second All-Ivy season falls inside the years Penn’s own captains document describes as club, 1982-91. Both are Penn’s statements and neither is overwritten here: a club team still played the Ivy Championship.',
  1984:
    'Penn’s captains document prints no captain from 1983 to 1991, saying the programme played as a club. It was still finishing third in the Ivy League.',
}

function buildSeasons(rows: HonorRow[]): ProgramHonorSeason[] {
  const byYear = new Map<number, HonorRow[]>()
  for (const r of rows) {
    const list = byYear.get(r.year) ?? []
    list.push(r)
    byYear.set(r.year, list)
  }
  return [...byYear.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, list]) => {
      const names = [...new Set(list.map(r => r.name))]
      const fallback =
        names.length === 1
          ? names[0]
          : names.length === 2
            ? `${names[0]} and ${names[1]}`
            : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
      return {
        year,
        title: SEASON_TITLES[year] ?? fallback,
        entries: list.map(({ name, honor, detail }) => ({ name, honor, ...(detail ? { detail } : {}) })),
        ...(SEASON_NOTES[year] ? { note: SEASON_NOTES[year] } : {}),
      }
    })
}

export const PENN_GOLF_HONORS: ProgramHonorSeason[] = buildSeasons(ROWS)

/**
 * All-Ivy selections, counted rather than asserted.
 *
 * Penn's list is complete from 1970, the first year All-Ivy was selected,
 * so unlike the women's figure this is a total and not a floor.
 */
export const MENS_ALL_IVY_SELECTIONS = ROWS.filter(r => /All-Ivy/.test(r.honor)).length
export const MENS_ALL_IVY_FIRST_YEAR = 1970

/** Individual Ivy or Eastern Intercollegiate medalists. */
export const MENS_MEDALIST_YEARS = [...new Set(
  ROWS.filter(r => /medalist/.test(r.honor)).map(r => r.year),
)].sort((a, b) => a - b)

/**
 * Best individual totals at the Championship, from the same Penn document.
 * Kept apart from the honour seasons: a score is a record, not a selection.
 */
export const MENS_CHAMPIONSHIP_BEST_SCORES = [
  { score: 213, toPar: '-3', name: 'Austin Powell', year: 2015 },
  { score: 212, toPar: 'E', name: 'Brett Rendina', year: 2009 },
  { score: 216, toPar: 'E', name: 'Sean Barrett', year: 2005 },
  { score: 213, toPar: '+1', name: 'Scotty Williams', year: 2009 },
  { score: 219, toPar: '+3', name: 'Hayden Adams', year: 2026 },
] as const

export const MENS_CHAMPIONSHIP_BEST_ROUNDS = [
  { score: 66, toPar: '-5', name: 'Max Fonseca', year: 2024, round: 'first' },
  { score: 67, toPar: '-4', name: 'Michael Blodgett', year: 2008, round: 'second' },
  { score: 67, toPar: '-3', name: 'Brett Rendina', year: 2009, round: 'third' },
  { score: 68, toPar: '-2', name: 'Max Marsico', year: 2013, round: 'first' },
  { score: 69, toPar: '-2', name: 'Ben Scott', year: 2024, round: 'third' },
] as const
