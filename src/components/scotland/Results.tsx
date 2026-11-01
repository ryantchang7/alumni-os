/**
 * The competitive record of the week, as Penn Athletics published it on 13
 * and 14 October 2026. Nothing here is derived, rounded or recomputed.
 *
 * The format: six Penn players, the best five scores counting each round.
 * That is what Penn's own team totals require, and it is checkable from the
 * individual cards below.
 *
 *   Round 1   70 70 71 74 75 76   drop 76  ->  360
 *   Round 2   77 78 83 84 84 84   drop 84  ->  406
 *   Total                                      766
 *
 * Both rounds have exactly one five-score subset that hits the published
 * number, and round one's requires Wesley Hu's 75. Penn's stroke-play recap
 * describes Hu as competing as an individual, which cannot be right: without
 * his card the team's first round is 361, not 360. Penn's own preview page
 * says "5 players per team, low 4 rounds score", which cannot be right
 * either, since four counting scores would total 607 rather than 766. Ryan
 * played in the event and confirms six played. The cards are published, the
 * arithmetic is one line, so the page states the format plainly.
 *
 * Server components. No interactivity, no client bundle.
 */

interface TeamRow {
  pos: number
  team: string
  toPar: string
  total: number
  penn?: boolean
}

const TEAM_STANDINGS: TeamRow[] = [
  { pos: 1, team: 'Texas', toPar: '+23', total: 723 },
  { pos: 2, team: 'St Andrews', toPar: '+42', total: 742 },
  { pos: 3, team: 'Washington', toPar: '+43', total: 743 },
  { pos: 4, team: 'Penn', toPar: '+66', total: 766, penn: true },
]

interface JubileeRow {
  name: string
  finish: string
  rounds: string
  total: number
  toPar: string
}

const JUBILEE: JubileeRow[] = [
  { name: 'Arjun Caprihan', finish: '9th', rounds: '70 · 77', total: 147, toPar: '+7' },
  { name: 'Hayden Adams', finish: 'T-13th', rounds: '74 · 78', total: 152, toPar: '+12' },
  { name: 'Kayden Wang', finish: 'T-18th', rounds: '70 · 84', total: 154, toPar: '+14' },
  { name: 'Oliver Uribe', finish: '21st', rounds: '71 · 84', total: 155, toPar: '+15' },
  { name: 'Ryan Chang', finish: 'T-22nd', rounds: '76 · 83', total: 159, toPar: '+19' },
  { name: 'Wesley Hu', finish: 'T-22nd', rounds: '75 · 84', total: 159, toPar: '+19' },
]

interface OldCourseRow {
  name: string
  /** Washington opponent, named in Penn Athletics' match-play recap. */
  opponent: string
  score: number
  toPar: string
  result: string
  point?: boolean
}

const OLD_COURSE: OldCourseRow[] = [
  { name: 'Kayden Wang', opponent: '', score: 72, toPar: 'E', result: 'Won by 1', point: true },
  { name: 'Ryan Chang', opponent: 'Emil Borrestuen Herstad', score: 73, toPar: '+1', result: 'Lost by 2' },
  { name: 'Wesley Hu', opponent: 'Grady Miller', score: 74, toPar: '+2', result: 'Lost by 6' },
  { name: 'Oliver Uribe', opponent: 'Hamish Farquharson', score: 74, toPar: '+2', result: 'Lost by 5' },
  { name: 'Arjun Caprihan', opponent: 'Brock Maulding', score: 75, toPar: '+3', result: 'Lost by 5' },
  { name: 'Hayden Adams', opponent: 'Finn Koelle', score: 77, toPar: '+5', result: 'Lost by 8' },
]

/* ------------------------------------------------------------------ team */

export function TeamStandings() {
  return (
    <table className="w-full border-collapse text-[14px]">
      <caption className="sr-only">
        St Andrews Links Collegiate, 36-hole team stroke play on the Jubilee Course
      </caption>
      <thead>
        <tr className="border-b border-[rgba(180,168,150,0.5)]">
          <th scope="col" className="eyebrow py-2 pr-3 text-left text-ink-muted">
            Team
          </th>
          <th scope="col" className="eyebrow py-2 px-3 text-right text-ink-muted">
            To par
          </th>
          <th scope="col" className="eyebrow py-2 pl-3 text-right text-ink-muted">
            Total
          </th>
        </tr>
      </thead>
      <tbody>
        {TEAM_STANDINGS.map((r) => (
          <tr
            key={r.team}
            className={`border-b border-[rgba(180,168,150,0.28)] last:border-0 ${
              r.penn ? 'bg-[#0a1628]/[0.035]' : ''
            }`}
          >
            <th
              scope="row"
              className={`py-3 pr-3 text-left font-medium ${
                r.penn ? 'text-[#0a1628]' : 'text-[#3d4a5c]'
              }`}
            >
              <span className="mr-2.5 tabular-nums text-ink-muted">{r.pos}</span>
              {r.team}
              {r.penn && (
                <span className="ml-2 align-middle text-[9.5px] font-semibold tracking-[0.18em] text-[#990000] uppercase">
                  Penn
                </span>
              )}
            </th>
            <td className="py-3 px-3 text-right tabular-nums text-[#3d4a5c]">{r.toPar}</td>
            <td
              className={`py-3 pl-3 text-right font-heading text-[19px] tabular-nums ${
                r.penn ? 'text-[#0a1628]' : 'text-[#3d4a5c]'
              }`}
            >
              {r.total}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* --------------------------------------------------------------- jubilee */

export function JubileeTable() {
  return (
    <table className="w-full border-collapse text-[14px]">
      <caption className="sr-only">
        Penn individual results, 36 holes of stroke play on the Jubilee Course
      </caption>
      <thead>
        <tr className="border-b border-[rgba(180,168,150,0.5)]">
          <th scope="col" className="eyebrow py-2 pr-3 text-left text-ink-muted">
            Player
          </th>
          <th scope="col" className="eyebrow hidden py-2 px-3 text-left text-ink-muted sm:table-cell">
            Finish
          </th>
          <th scope="col" className="eyebrow py-2 px-3 text-right text-ink-muted">
            Rounds
          </th>
          <th scope="col" className="eyebrow py-2 pl-3 text-right text-ink-muted">
            Total
          </th>
        </tr>
      </thead>
      <tbody>
        {JUBILEE.map((r) => (
          <tr key={r.name} className="border-b border-[rgba(180,168,150,0.28)] last:border-0">
            <th scope="row" className="py-3 pr-3 text-left font-medium text-[#0a1628]">
              {r.name}
              <span className="block text-[11.5px] font-normal text-ink-muted sm:hidden">
                {r.finish}
              </span>
            </th>
            <td className="hidden py-3 px-3 tabular-nums text-[#3d4a5c] sm:table-cell">
              {r.finish}
            </td>
            <td className="py-3 px-3 text-right tabular-nums whitespace-nowrap text-[#3d4a5c]">
              {r.rounds}
            </td>
            <td className="py-3 pl-3 text-right whitespace-nowrap text-[#0a1628]">
              <span className="font-heading text-[19px] tabular-nums">{r.total}</span>
              <span className="ml-1.5 text-[12px] tabular-nums text-ink-muted">{r.toPar}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ------------------------------------------------------------ old course */

export function OldCourseCard() {
  return (
    <table className="w-full border-collapse text-[14px]">
      <caption className="sr-only">
        Penn scores in medal match play against Washington on the Old Course
      </caption>
      <thead>
        <tr className="border-b border-white/15">
          <th scope="col" className="eyebrow py-2 pr-3 text-left text-white/45">
            Player
          </th>
          <th scope="col" className="eyebrow py-2 px-3 text-right text-white/45">
            Card
          </th>
          <th scope="col" className="eyebrow py-2 pl-3 text-right text-white/45">
            Match
          </th>
        </tr>
      </thead>
      <tbody>
        {OLD_COURSE.map((r) => (
          <tr key={r.name} className="border-b border-white/10 last:border-0">
            <th scope="row" className="py-4 pr-3 text-left font-medium text-white">
              <span
                aria-hidden
                className={`mr-3 inline-block h-[7px] w-[7px] rounded-full align-middle ${
                  r.point ? 'bg-[#c8a84b]' : 'bg-white/15'
                }`}
              />
              {r.name}
              {r.opponent && (
                <span className="mt-0.5 block pl-[19px] text-[11.5px] font-normal text-white/40">
                  v. {r.opponent}
                </span>
              )}
            </th>
            <td className="py-4 px-3 text-right whitespace-nowrap">
              <span
                className={`font-heading text-[26px] tabular-nums sm:text-[30px] ${
                  r.point ? 'text-[#c8a84b]' : 'text-white'
                }`}
              >
                {r.score}
              </span>
              <span className="ml-2 text-[12px] tabular-nums text-white/45">{r.toPar}</span>
            </td>
            <td
              className={`py-4 pl-3 text-right text-[13px] whitespace-nowrap ${
                r.point ? 'font-semibold text-[#c8a84b]' : 'text-white/60'
              }`}
            >
              {r.result}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ------------------------------------------------------- the full entry */

/**
 * Who else Penn entered. The six cards above are the six Penn Athletics
 * reported, but the 9 October preview lists nine men and seven women, and
 * leaving the other ten off a page titled "Penn Golf at the Home of Golf"
 * would be a quieter kind of wrong than getting a score mistyped.
 *
 * Names only. No results are published for any of them, so none are given.
 */
export function FullEntryNote({
  previewUrl,
  womensRecapUrl,
}: {
  previewUrl: string
  womensRecapUrl: string
}) {
  return (
    <aside className="mt-14 max-w-[820px] border-t border-[rgba(180,168,150,0.5)] pt-8 sm:mt-16">
      <p className="eyebrow mb-4 text-ink-muted">The rest of the Penn entry</p>
      <div className="space-y-4 text-[14.5px] leading-[1.75] text-[#3d4a5c]">
        <p>
          The six cards above are the six Penn Athletics reported. Penn also
          entered Max Fonseca, Sean Curran and Henry Chen as individuals in the
          men&rsquo;s lineup.
        </p>
        <p>
          The Collegiate ran a women&rsquo;s championship alongside the
          men&rsquo;s, the same week and the same courses. Penn&rsquo;s six were
          Juliet Oh, Maggie Ni, Adrienne Ahn-Upton, Madeleine Zang, Claire Lu
          and Sophia Lu, with Chelsea Nguyen entered as an individual.
        </p>
        <p>
          They were fourth after two rounds on the Jubilee at 52 over, with
          Sophia Lu Penn&rsquo;s low scorer at eight over and Juliet Oh opening
          with a 70. Then they played Washington in match play on the Old
          Course, the same Wednesday the men did.
        </p>
        <p className="text-[#0a1628]">
          <strong className="font-semibold">
            Penn&rsquo;s women finished third. The men finished fourth.
          </strong>{' '}
          Texas won both championships.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#990000] hover:underline"
        >
          Both Penn lineups, as published &#8599;
        </a>
        <a
          href={womensRecapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#990000] hover:underline"
        >
          The women&rsquo;s stroke play rounds &#8599;
        </a>
      </div>
    </aside>
  )
}
