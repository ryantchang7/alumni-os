/**
 * Penn's own all-time captains lists, transcribed verbatim.
 *
 * Source, both read 2026-11-15:
 *   https://pennathletics.com/documents/2026/4/27/MGOLF_history_-_captains.pdf
 *   https://pennathletics.com/documents/2026/4/27/WGOLF_history_-_captains.pdf
 *
 * These are published Penn Athletics documents, dated 27 April 2026, and
 * they are the record. Nothing here is a recollection, an inference from a
 * letter count, or a guess: a year is in this file because Penn prints it.
 *
 * Two things to know before reading a year off this list.
 *
 * **The years are season-END years**, like the rest of the Member Book: 2005
 * is the 2004-05 season. That is established, not assumed. Melissa Aylor
 * appears in Penn's published roster archive for 2004-05 and no later
 * season, and Penn lists her as captain in both 2004 and 2005; read as fall
 * years those would be 2004-05 and 2005-06, the second of which she had
 * already left. Read as season-end years they are 2003-04 and 2004-05, her
 * junior and senior seasons, and her 2005 All-Ivy is described by Penn as
 * coming "as a senior, and captain". Melissa's own 2026-11-15 email uses the
 * same convention independently.
 *
 * **A listed name is not a card.** `resolveFromPennList` in team-captains.ts
 * matches these names to Member Book entries conservatively and refuses when
 * it is not sure. The names it cannot place are not failures of the matcher;
 * they are mostly men who captained Penn before Penn published the records
 * the book was built from. `unmatchedCaptains()` prints them, and that list
 * is a to-do, not an error.
 *
 * What the lists do NOT contain:
 *
 * - **Men 1913-15, 1917, 1944-46.** No captain printed. 1944-46 is the
 *   wartime gap the Member Book also has.
 * - **Men 1983-91.** Penn's document says, in place of names, "Penn played
 *   as a club program from 1982-91". It is the third source to give a
 *   different club-era span: the book lacks 1982 onward, CLUB_YEARS_FIRST
 *   says 1983, and this says 1982. None of them is overwritten.
 * - **Women 2011, 2021, 2024.** Penn prints "none" for these, which is a
 *   fact about those seasons rather than a hole in the document, so they are
 *   recorded as empty rather than left out.
 * - **Women before 1999.** The list starts at 1999. Penn dates the
 *   programme's first varsity season to 1999-2000, which under the
 *   season-end convention is 2000 — so Penn's own captains list opens one
 *   season before Penn says the programme existed. That is not a
 *   transcription error at either end: asked which team Lindsay Stern
 *   captained, Melissa Maurer answered on 2026-11-15 that she "played and
 *   was captain for only one season which was 1998-1999". The last club
 *   team had a captain, Penn counts her, and the Member Book does too.
 */

import type { ProgramId } from '@/lib/teams/programs'

export interface PennCaptainSeason {
  /** Season-end year, as Penn labels it. */
  year: number
  program: ProgramId
  /** Verbatim, in Penn's order. Empty where Penn prints "none". */
  names: readonly string[]
}

/** Penn's note in place of names for the men's club seasons. */
export const MENS_CLUB_NOTE = 'Penn played as a club program from 1982-91'
export const MENS_CLUB_NOTE_FIRST = 1983
export const MENS_CLUB_NOTE_LAST = 1991

const M = (year: number, ...names: string[]): PennCaptainSeason => ({
  year,
  program: 'mens',
  names,
})
const W = (year: number, ...names: string[]): PennCaptainSeason => ({
  year,
  program: 'womens',
  names,
})

export const PENN_CAPTAINS: readonly PennCaptainSeason[] = [
  // ── Men, 1912-2026 ───────────────────────────────────────────────────
  M(1912, 'Howard C. McCall'),
  M(1916, 'Tristram C. Colket, II'),
  M(1918, 'Meredith J. Mack'),
  M(1919, 'Daniel Rhoads'),
  M(1920, 'Robert Rownd'),
  M(1921, 'J.C. Davis'),
  M(1922, 'Jack M. Falk'),
  M(1923, 'Thomas Conte'),
  M(1924, 'George Stevens'),
  M(1925, 'Sydney K. Allman'),
  M(1926, 'Daniel Merritt'),
  M(1927, 'George T. Morrow'),
  M(1928, 'Rodney Coltart'),
  M(1929, 'Richard L. Hansen'),
  M(1930, 'Albert Brodbeck'),
  M(1931, 'Abro Robinson'),
  M(1932, 'Arthur Byxbee'),
  M(1933, 'John W. Owens'),
  M(1934, 'Walter Cross'),
  M(1935, 'Ed Weihenmayer'),
  M(1936, 'Nelson C. Schotter'),
  M(1937, 'James R. Peelor'),
  M(1938, 'William Morpeth'),
  M(1939, 'J. Knox Moore'),
  M(1940, 'J. Knox Moore'),
  M(1941, 'George D. Buhnell'),
  M(1942, 'William Crosson, Jr.'),
  M(1943, 'Robert Hays'),
  M(1947, 'Edward “Bud” Long', 'Jim West'),
  M(1948, 'Charles Kittle'),
  M(1949, 'Clayton Boardman'),
  M(1950, 'Ray McCabe'),
  M(1951, 'Richard Lipsey'),
  M(1952, 'Thomas Lebo'),
  M(1953, 'William K. Gay'),
  M(1954, 'Edward Wallace'),
  M(1955, 'Charlton Yarnall'),
  M(1956, 'Albert McQuiston'),
  M(1957, 'Francis Poore'),
  M(1958, 'J. Ralph Bennett'),
  M(1959, 'Donald Norbury', 'Robert Roy'),
  M(1960, 'Joseph L. Calihan', 'Donald Norbury'),
  M(1961, 'James B. Graybill', 'Murray Kleimon'),
  M(1962, 'Vincent Coviello'),
  M(1963, 'Alan Frank'),
  M(1964, 'James Crummett', 'Harlowe Prindle'),
  M(1965, 'Robert Dembner', 'James Robbins'),
  M(1966, 'Peter Humphrey', 'Arthur Kern'),
  M(1967, 'Arthur Kern', 'Ted Lingenheld'),
  M(1968, 'David E. London'),
  M(1969, 'Timothy Sheldon'),
  M(1970, 'Gary Yohe'),
  M(1971, 'Ed L. Burke', 'John O’Shaughnessy'),
  M(1972, 'Charles Morgan', 'John Perry'),
  M(1973, 'Tom Welsh'),
  M(1974, 'Keith Griffin', 'Vince Scarpetta'),
  M(1975, 'Walt Enick'),
  M(1976, 'Rich Steingraber', 'Tom Wecal'),
  M(1977, 'Jeff Kiley', 'Jim O’Leary'),
  M(1978, 'Scott Christie'),
  M(1979, 'Ted Michaels', 'Steve Sieg'),
  M(1980, 'Bill Neusidl', 'Steve Sieg'),
  M(1981, 'Steve Corradi', 'Rich Grabow'),
  M(1982, 'Scott Benjamin', 'John Kathman'),
  // 1983-91: the club era. Penn prints MENS_CLUB_NOTE instead of names.
  M(1992, 'Gerard Rosato', 'Julian Jordan'),
  M(1993, 'Greg Fatzinger', 'Julian Jordan'),
  M(1994, 'Joe Cesarz', 'Brent Marinan'),
  M(1995, 'Adam Cohen'),
  M(1996, 'Brett McHugh'),
  M(1997, 'Justin Cotler'),
  M(1998, 'Adam Bradshaw'),
  M(1999, 'Brian Owens'),
  M(2000, 'Robert G. Goldfaden'),
  M(2001, 'Kyle Moran'),
  M(2002, 'Mike Russell'),
  M(2003, 'Chad Perman', 'Peyton Wallace'),
  M(2004, 'Larry Nickell'),
  M(2005, 'Derek Rogers'),
  M(2006, 'Sean Barrett', 'Derek Rogers'),
  M(2007, 'Sean Barrett'),
  M(2008, 'Dean Merrill'),
  M(2009, 'Mike Blodgett'),
  M(2010, 'Bryant Williams'),
  M(2011, 'Kevin Huntington'),
  M(2012, 'Scotty Williams'),
  M(2013, 'P.J. Fielding'),
  M(2014, 'Max Marsico'),
  M(2015, 'Austin Powell'),
  M(2016, 'Patrick O’Leary'),
  M(2017, 'Matt Kern', 'Dane Walton'),
  M(2018, 'Amay Poria', 'Carter Thompson'),
  M(2019, 'Josh Goldenberg', 'Zareh Kaloustian', 'Carter Thompson'),
  M(2020, 'Mitchell Cornell', 'Eric Ganshaw', 'Brandon Wang'),
  M(2021, 'Mitchell Cornell', 'Eric Ganshaw', 'Mark Haghani'),
  M(2022, 'Mark Haghani', 'Jason Langer', 'Carter Prince'),
  M(2023, 'Anthony Basilio', 'Mark Haghani', 'Simon Markowitz', 'Harrison Ornstein'),
  M(2024, 'Jimin Jung', 'Ben Scott'),
  M(2025, 'George Roessler'),
  M(2026, 'Hayden Adams', 'Owen Hayes'),

  // ── Women, 1999-2026 ─────────────────────────────────────────────────
  //
  // Printed with maiden names. Six of the first seven entries are women
  // who married and whose cards carry both names; the aliases in
  // candidates.ts are what lets this list reach them.
  W(1999, 'Lindsay Stern'),
  W(2000, 'Natasha Miller'),
  W(2001, 'Jennifer Schraut'),
  W(2002, 'Stacy Kress'),
  W(2003, 'Stacy Kress'),
  W(2004, 'Melissa Aylor'),
  W(2005, 'Melissa Aylor'),
  W(2006, 'Kim Thompson'),
  W(2007, 'Stephanie Stamas'),
  W(2008, 'Meg Bender'),
  W(2009, 'Lisette Vitter'),
  W(2010, 'Lisette Vitter'),
  W(2011), // Penn prints "none"
  W(2012, 'Tiffany Cheung'),
  W(2013, 'Isabel Han', 'Elizabeth Kresock'),
  W(2014, 'Amanda Chin'),
  W(2015, 'Amanda Chin'),
  W(2016, 'Erin Lo', 'Isabella Rahm'),
  W(2017, 'Erin Lo', 'Isabella Rahm'),
  W(2018, 'Tiffany Yau', 'Michelle Yom'),
  W(2019, 'Christina Park'),
  W(2020, 'Christina Park'),
  W(2021), // Penn prints "none"
  W(2022, 'Leila Dizon', 'Mary Shin', 'Olivia Traynor'),
  W(2023, 'Selina Li', 'Susan Xiao'),
  W(2024), // Penn prints "none"
  W(2025, 'Natalie Cao', 'Debby Chang'),
  W(2026, 'Bridget O’Keefe', 'Julie Shin'),
]

/**
 * Printed name -> Member Book card, for the names the matcher cannot reach.
 *
 * Penn's captains list prints how a player was called; the Member Book came
 * from an all-time letter-winner PDF that prints how he enrolled. "Rich
 * Steingraber" captained the 1976 team and his card says "Richard G.
 * Steingraber", and letters-only matching will never join those two. Nor
 * "Tom Wecal" to "Thomas E. Wecal", "Jim O'Leary" to "James M. O'Leary", or
 * "Bill Neusidl" to "William B. Neusidl".
 *
 * Every row here was established the same way and each one is checkable:
 * exactly one public card in the same program shares the surname, and the
 * captain year falls inside that card's career span. Where a surname had
 * two cards in the era the pair is NOT here (Harry and William Crosson both
 * exist; only William's span contains 1942). Nothing fuzzy ships: there is
 * no nickname expansion at runtime, only this list, because applying
 * Rich/Richard/Dick in general would merge strangers.
 *
 * Keyed by `program:printed name`. A player captaining two seasons appears
 * once, since Penn prints him identically both times.
 */
export const CAPTAIN_NAME_TO_CARD: Record<string, string> = {
  'mens:Ed Weihenmayer': 'edwin-weihenmayer',
  'mens:William Crosson, Jr.': 'william-crosson',
  'mens:Edward “Bud” Long': 'edward-long',
  'mens:Jim West': 'james-west',
  'mens:Ray McCabe': 'raymond-mccabe',
  'mens:J. Ralph Bennett': 'james-ralph-bennett',
  // Ted for Edward. One Lingenheld, and 1967 is his last season.
  'mens:Ted Lingenheld': 'edward-c-lingenheld',
  'mens:Ed L. Burke': 'edward-l-burke',
  'mens:Walt Enick': 'walter-d-enick',
  'mens:Rich Steingraber': 'richard-g-steingraber',
  'mens:Tom Wecal': 'thomas-e-wecal',
  'mens:Jeff Kiley': 'jeffrey-t-kiley',
  // The 1977 captain. Patrick O'Leary captained in 2016, thirty-nine
  // seasons later, and matches on his own name without help.
  'mens:Jim O’Leary': 'james-m-o-leary',
  'mens:Ted Michaels': 'theodore-p-michaels',
  'mens:Steve Sieg': 'steven-r-sieg',
  // Bill for William. One Neusidl.
  'mens:Bill Neusidl': 'william-b-neusidl',
  'mens:Steve Corradi': 'stephen-j-corradi',
  'mens:Rich Grabow': 'richard-b-grabow',
  'mens:Joe Cesarz': 'joseph-m-cesarz',
  'mens:Mike Russell': 'michael-j-russell',
  'mens:Mike Blodgett': 'michael-blodgett',
  /**
   * The one case where Penn's two documents disagree with each other.
   *
   * The captains list makes Tom Welsh the 1973 captain, so he played the
   * 1972-73 season. The letter-winner PDF the Member Book was built from
   * gives him 1970-1972 and stops. Captaining a season he is not recorded
   * as playing is not possible, so one of the two Penn documents is short,
   * and it is almost certainly the letter record: that is exactly the error
   * Peyton Wallace had to email in about his own four seasons.
   *
   * The captaincy is recorded because Penn prints it. His card's span is
   * NOT quietly extended to fit, because that would be this file inventing
   * a season. It wants a roster correction, which is a decision for a human
   * with the record in front of them. The other Welsh, Stanley, played
   * 1942-43 and is not a candidate.
   */
  'mens:Tom Welsh': 'thomas-mca-welsh',
}

/** Every (name, year) pair Penn prints, flattened, for matching. */
export interface PennCaptainName {
  name: string
  year: number
  program: ProgramId
  /** True when Penn names more than one captain for the season. */
  shared: boolean
}

export const PENN_CAPTAIN_NAMES: readonly PennCaptainName[] = PENN_CAPTAINS.flatMap(s =>
  s.names.map(name => ({
    name,
    year: s.year,
    program: s.program,
    shared: s.names.length > 1,
  })),
)

/** Seasons Penn records with no captain at all. */
export const SEASONS_WITH_NO_CAPTAIN: readonly PennCaptainSeason[] =
  PENN_CAPTAINS.filter(s => s.names.length === 0)
