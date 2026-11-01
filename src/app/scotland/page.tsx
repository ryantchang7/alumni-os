/**
 * /scotland — Penn Golf at the Home of Golf. October 2026.
 *
 * A recap, not a registration page. This used to be the trip's sales page:
 * itinerary cards, three package tiers, a deadline and Charlie's phone
 * number. The trip happened, so all of that is gone and what is left is the
 * week itself, told once, with the photography carrying most of it.
 *
 * Every competitive figure comes from Penn Athletics' own recaps of 13 and
 * 14 October 2026, reproduced in components/scotland/Results.tsx without
 * recomputation. The photographs, and what we are willing to claim about
 * each one, live in lib/scotland/photos.ts. The article is third person;
 * the note near the foot is Ryan's own and is set apart on purpose.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import PhotoViewer, { Plate, Band, ContactSheet } from '@/components/scotland/PhotoViewer'
import { TeamStandings, JubileeTable, OldCourseCard, FullEntryNote } from '@/components/scotland/Results'
import { FounderNote, ClosingInvitation } from '@/components/scotland/Coda'
import { WRAP, MEASURE, Eyebrow } from '@/components/scotland/layout'
import { photo } from '@/lib/scotland/photos'

export const metadata: Metadata = {
  title: 'Penn Golf at the Home of Golf',
  description:
    'Penn Golf at the St Andrews Links Collegiate, October 2026. Two rounds on the Jubilee, medal match play on the Old Course, then Kingsbarns, Carnoustie and the R&A with the Penn Golf family.',
}

/** The spine of the week. Echoed by the section eyebrows further down. */
const COURSES = [
  { n: '01', name: 'Jubilee', date: 'Oct 12–13', note: 'Collegiate stroke play' },
  { n: '02', name: 'Old Course', date: 'Oct 14', note: 'Medal match play' },
  { n: '03', name: 'Kingsbarns', date: 'Oct 15', note: 'Golf with the Penn community' },
  { n: '04', name: 'Carnoustie', date: 'Oct 16', note: 'Final round and farewell' },
]

const STROKE_PLAY_RECAP =
  'https://pennathletics.com/news/2026/10/13/mens-golf-quakers-place-fourth-in-stroke-play-at-st-andrews.aspx'
const TRIP_PREVIEW =
  'https://pennathletics.com/news/2026/10/9/mens-golf-mens-womens-golf-gear-up-for-trip-overseas-to-compete-in-st-andrews-links-collegiate.aspx'
const MATCH_PLAY_RECAP =
  'https://pennathletics.com/news/2026/10/14/mens-golf-penn-finishes-st-andrews-week-with-fourth-place-finish.aspx'

export default function ScotlandPage() {
  const hero = photo('old-course-evening')

  return (
    <PhotoViewer>
      <article className="bg-[#fbf9f6]">
        {/* ------------------------------------------------------ hero --- */}
        <header className="relative flex min-h-[78svh] flex-col justify-end overflow-hidden bg-[#060e1a] sm:min-h-[86svh]">
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            preload
            sizes="100vw"
            placeholder="blur"
            blurDataURL={hero.blurDataURL}
            className="object-cover object-[58%_center] sm:object-center"
          />
          {/* Weighted at the foot so the type reads and the sky stays a sky. */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, #060e1a 0%, rgba(6,14,26,0.93) 20%, rgba(6,14,26,0.68) 40%, rgba(6,14,26,0.22) 66%, rgba(6,14,26,0.04) 100%)',
            }}
          />
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#060e1a]/55 to-transparent"
          />
          <div className={`${WRAP} relative pt-28 pb-12 sm:pb-16`}>
            <p className="eyebrow mb-6 text-[#c8a84b]">
              <span className="block sm:inline">Penn Golf</span>
              <span aria-hidden className="mx-2.5 hidden text-white/35 sm:inline">
                /
              </span>
              <span className="mt-2 block sm:mt-0 sm:inline">
                St Andrews, Scotland
                <span aria-hidden className="mx-2 text-white/35">
                  /
                </span>
                October 2026
              </span>
            </p>
            <h1 className="font-heading max-w-[13ch] text-[2.65rem] leading-[0.98] font-medium tracking-tight text-white sm:max-w-[16ch] sm:text-[4.2rem] lg:text-[5.4rem]">
              Penn Golf at the Home of Golf.
            </h1>
            <p className="mt-7 max-w-[54ch] text-[15.5px] leading-relaxed text-white/80 sm:text-[17px]">
              Three days of collegiate competition. Four Scottish links. And a
              week with the Penn Golf family that will get talked about for a
              long time.
            </p>
          </div>
        </header>

        {/* ------------------------------------------------------ lede --- */}
        <section className={`${WRAP} pt-16 pb-14 sm:pt-24 sm:pb-20`}>
          <div className={MEASURE}>
            <p className="font-heading text-[21px] leading-[1.5] text-[#0a1628] sm:text-[25px]">
              In the second week of October, Penn Men&rsquo;s Golf flew to St
              Andrews to play the St Andrews Links Collegiate against Texas,
              Washington and the host University of St Andrews. Two rounds of
              stroke play on the Jubilee, then medal match play on the Old
              Course, all three rounds televised on the Golf Channel.
            </p>
            <p className="mt-6 text-[15.5px] leading-[1.75] text-[#3d4a5c]">
              That was the tournament. The week kept going. When the scoring
              ended, alumni and families joined the team for rounds at
              Kingsbarns and Carnoustie, a visit to the R&amp;A, and a few days
              in a town where the golf history is the thing you walk past on
              your way to dinner. Two Penn Golf alumni, Carter Thompson and
              Amay Poria, came along for it.
            </p>
          </div>

          {/* The four courses, used here and echoed by the section headers. */}
          <ol className="mt-14 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-[rgba(180,168,150,0.5)] pt-8 lg:grid-cols-4">
            {COURSES.map((c) => (
              <li key={c.n}>
                <p className="font-heading text-[13px] text-[#c8a84b]">{c.n}</p>
                <p className="font-heading mt-1 text-[21px] leading-tight text-[#0a1628] sm:text-[24px]">
                  {c.name}
                </p>
                <p className="mt-2 text-[12px] font-semibold tracking-[0.1em] text-[#990000] uppercase">
                  {c.date}
                </p>
                <p className="mt-1 text-[13px] leading-snug text-ink-muted">{c.note}</p>
              </li>
            ))}
          </ol>
        </section>

        <Band id="four-teams-old-course" aspect="21/9" sizes="100vw" />

        {/* ------------------------------------------------ the collegiate */}
        <section className={`${WRAP} pt-16 pb-16 sm:pt-24 sm:pb-24`}>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-16">
            <div>
              <Eyebrow>The Collegiate · October 12&ndash;14</Eyebrow>
              <h2 className="font-heading max-w-[18ch] text-[2rem] leading-[1.05] font-medium text-[#0a1628] sm:text-[2.9rem]">
                Three days of golf at St Andrews.
              </h2>
              <div className={`${MEASURE} mt-7 space-y-5 text-[15.5px] leading-[1.75] text-[#3d4a5c]`}>
                <p>
                  The format was simple and unusually good. Thirty-six holes of
                  stroke play on the Jubilee to seed the field, then medal match
                  play on the Old Course to settle it. Four schools, two of
                  them from the other side of the Atlantic, one of them the
                  university the town is named for.
                </p>
                <p>
                  Monday gave the field a fair look at the Jubilee. Arjun
                  Caprihan opened in 70, Kayden Wang matched him, and Oliver
                  Uribe was a shot back at 71. Penn posted 360.
                </p>
                <p>
                  Tuesday did not. The wind got up, the rain came with it, and
                  scoring went backwards across the whole field. Penn&rsquo;s
                  second round was 406. This is the part of links golf that
                  does not travel: the course does not change, the weather
                  does, and two rounds on the same eighteen holes can be two
                  completely different golf courses.
                </p>
                <p>
                  Arjun&rsquo;s 70-77 held up for ninth, the best individual
                  finish Penn had all week and the only top ten in the field
                  from the Penn side. Fourth place in stroke play sent the
                  Quakers into the consolation match, which is how six Penn
                  golfers ended up with a tee time on the Old Course with
                  something riding on it.
                </p>
              </div>
            </div>

            <div className="lg:pt-[7.5rem]">
              <div
                className="rounded-2xl border border-[rgba(180,168,150,0.45)] bg-white px-6 py-6 sm:px-7"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 12px 32px rgba(10,22,40,0.05)' }}
              >
                <p className="eyebrow mb-4 text-ink-muted">Team stroke play · 36 holes</p>
                <TeamStandings />
                <p className="mt-4 text-[12.5px] leading-relaxed text-ink-muted">
                  Penn&rsquo;s rounds: 360 and 406.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-14 sm:mt-16">
            <p className="eyebrow mb-5 text-ink-muted">
              Penn on the Jubilee · 36 holes
            </p>
            <JubileeTable />
            <p className="mt-5 max-w-[60ch] text-[12.5px] leading-relaxed text-ink-muted">
              Wesley Hu competed as an individual during the stroke-play
              portion. Scores as published by Penn Athletics.
            </p>
            <a
              href={STROKE_PLAY_RECAP}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#990000] hover:underline"
            >
              Penn Athletics&rsquo; stroke-play recap &#8599;
            </a>
          </div>

          <FullEntryNote previewUrl={TRIP_PREVIEW} />
        </section>

        {/* ------------------------------------------------- the old course */}
        <section className="relative overflow-hidden bg-[#0a1628] py-18 sm:py-28">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 left-[12%] h-[520px] w-[720px] -translate-x-1/2 opacity-70"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(200,168,75,0.10) 0%, rgba(200,168,75,0.03) 42%, transparent 70%)',
            }}
          />
          <div className={`${WRAP} relative`}>
            <Eyebrow tone="gold">Wednesday, October 14</Eyebrow>
            <h2 className="font-heading max-w-[14ch] text-[2.1rem] leading-[1.03] font-medium text-white sm:text-[3.2rem]">
              Then came the Old Course.
            </h2>

            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
              <div>
                <Plate
                  id="team-swilcan-bridge"
                  sizes="(min-width: 1024px) 640px, (min-width: 640px) 90vw, 92vw"
                  rounded={false}
                />
              </div>
              <div className="space-y-5 text-[15.5px] leading-[1.75] text-white/72 lg:pt-2">
                <p>
                  Fourth seed meant Washington in the consolation match, and it
                  meant the match was on the Old Course. Not a bounce game
                  after the tournament. Not a tee time somebody pulled strings
                  for. A college golf match, with a result attached, on the
                  first golf course there was.
                </p>
                <p>
                  Washington won it 5-1, and there is no softening that. What
                  the scoreboard does not carry is the golf. Six Penn cards
                  came in, and every one of them was between even par and five
                  over.
                </p>
                <p>
                  Kayden Wang took Penn&rsquo;s point with an even-par 72, the
                  low Penn round of the day. Texas went on to beat St Andrews
                  4.5 to 1.5 for the title.
                </p>
              </div>
            </div>

            {/* The distinction the old page never made. */}
            <p className="font-heading mt-14 text-[1.55rem] leading-[1.3] text-white sm:mt-16 sm:text-[2.4rem]">
              5-1 on the scoreboard.
              <br />
              <span className="text-[#c8a84b]">72, 73, 74, 74, 75, 77</span>{' '}
              on the scorecards.
            </p>

            <div className="mt-10 max-w-[760px] sm:mt-12">
              <OldCourseCard />
              <p className="mt-5 text-[12.5px] leading-relaxed text-white/45">
                Medal match play: each pairing was decided on 18-hole stroke
                totals rather than holes won.
              </p>
              <a
                href={MATCH_PLAY_RECAP}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#c8a84b] hover:underline"
              >
                Penn Athletics&rsquo; match-play recap &#8599;
              </a>
            </div>

            {/* ------------------------------------------- the eagle --- */}
            <aside className="mt-14 max-w-[620px] border-l-2 border-[#c8a84b] pl-6 sm:mt-16 sm:pl-8">
              <p className="eyebrow mb-3 text-[#c8a84b]">Old Course · No. 3</p>
              <h3 className="font-heading text-[1.5rem] leading-tight font-medium text-white sm:text-[2rem]">
                An eagle at the Home of Golf.
              </h3>
              <p className="mt-3.5 text-[15px] leading-[1.7] text-white/72">
                Ryan Chang holed out for eagle on the third and was four under
                through six. He signed for 73.
              </p>
            </aside>
          </div>
        </section>

        {/* ------------------------------------------------- the transition */}
        <section className={`${WRAP} pt-16 pb-14 sm:pt-24 sm:pb-18`}>
          <Eyebrow>After the scoring</Eyebrow>
          <h2 className="font-heading max-w-[16ch] text-[2rem] leading-[1.05] font-medium text-[#0a1628] sm:text-[2.9rem]">
            The tournament ended. The trip didn&rsquo;t.
          </h2>
          <div className={`${MEASURE} mt-7 space-y-5 text-[15.5px] leading-[1.75] text-[#3d4a5c]`}>
            <p>
              The flights home were not for another three days. What filled
              them was the part of the week nobody keeps score of.
            </p>
            <p>
              The alumni side of the trip was organized through the Penn
              Champions Club, and it put players, alumni, coaches and families
              on the same tee sheet for three straight days. Carter Thompson
              and Amay Poria, both Penn Golf alumni, were in the group.
            </p>
          </div>
        </section>

        <Band id="penn-party-st-andrews" aspect="2/1" sizes="100vw" />

        {/* -------------------------------------------------- kingsbarns --- */}
        <section className={`${WRAP} pt-18 pb-16 sm:pt-26 sm:pb-20`}>
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-16">
            <div className="order-2 space-y-7 lg:order-1">
              <Plate
                id="links-and-the-sea"
                sizes="(min-width: 1024px) 420px, (min-width: 640px) 60vw, 92vw"
                crop="1/1"
                objectPosition="center bottom"
              />
              <Plate
                id="foursome-clubhouse"
                sizes="(min-width: 1024px) 420px, (min-width: 640px) 60vw, 92vw"
              />
            </div>
            <div className="order-1 lg:order-2 lg:pt-4">
              <Eyebrow>Thursday, October 15 · 03</Eyebrow>
              <h2 className="font-heading max-w-[14ch] text-[2rem] leading-[1.05] font-medium text-[#0a1628] sm:text-[2.9rem]">
                A day at Kingsbarns.
              </h2>
              <div className={`${MEASURE} mt-7 space-y-5 text-[15.5px] leading-[1.75] text-[#3d4a5c]`}>
                <p>
                  The morning after a competitive round on the Old Course, the
                  group played Kingsbarns, out along the coast southeast of St
                  Andrews. It was the first full day with everyone in the same
                  groups, team and alumni mixed together, which is a different
                  kind of golf than the two days that came before it. Nobody
                  was counting.
                </p>
                <p>
                  Dinner that night was at the Rusacks, which looks straight
                  down the 18th of the Old Course. So even the table had a view
                  of where Wednesday happened.
                </p>
              </div>
              <div className="mt-9 max-w-[560px]">
                <Plate
                  id="the-group-on-course"
                  sizes="(min-width: 1024px) 560px, (min-width: 640px) 70vw, 92vw"
                />
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- carnoustie --- */}
        <section className={`${WRAP} pb-16 sm:pb-24`}>
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-16">
            <div className="lg:pt-4">
              <Eyebrow>Friday, October 16 · 04</Eyebrow>
              <h2 className="font-heading max-w-[16ch] text-[2rem] leading-[1.05] font-medium text-[#0a1628] sm:text-[2.9rem]">
                One more round at Carnoustie.
              </h2>
              <div className={`${MEASURE} mt-7 space-y-5 text-[15.5px] leading-[1.75] text-[#3d4a5c]`}>
                <p>
                  Jubilee, Old Course, Kingsbarns, Carnoustie. Four courses in
                  five days, and the hardest of them saved for last. There are
                  college seasons that do not put a team in front of one course
                  like that, let alone four.
                </p>
                <p>
                  Friday was the final round of the trip. The week ended with a
                  farewell dinner in the Carnoustie clubhouse, which is about
                  as good a last night as a golf trip gets.
                </p>
              </div>
            </div>
            <Plate
              id="green-and-flag"
              sizes="(min-width: 1024px) 420px, (min-width: 640px) 60vw, 92vw"
              crop="4/3"
              objectPosition="center bottom"
            />
          </div>
        </section>

        {/* -------------------------------------------- the r&a and town --- */}
        <section className="border-t border-[rgba(180,168,150,0.45)] bg-[#f5f1ea]">
          <div className={`${WRAP} py-18 sm:py-26`}>
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:gap-16">
              <div>
                <Eyebrow>St Andrews</Eyebrow>
                <h2 className="font-heading max-w-[15ch] text-[2rem] leading-[1.05] font-medium text-[#0a1628] sm:text-[2.9rem]">
                  A little closer to the history.
                </h2>
                <div className={`${MEASURE} mt-7 space-y-5 text-[15.5px] leading-[1.75] text-[#3d4a5c]`}>
                  <p>
                    In between the golf there was the town. St Andrews is small
                    enough to walk end to end in about twenty minutes, and it
                    carries the entire history of the game without making any
                    fuss about it. The group spent time at the R&amp;A, and
                    spent the rest of the week walking past the places that
                    turn up in every Open highlight reel on the way to get
                    coffee.
                  </p>
                  <p>
                    For a college team, that is the part that never shows up on
                    a scorecard and is most of what they will remember.
                  </p>
                </div>
              </div>
              <Plate
                id="the-randa-library"
                sizes="(min-width: 1024px) 400px, (min-width: 640px) 55vw, 92vw"
              />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ the alumni --- */}
        <section className={`${WRAP} pt-18 pb-16 sm:pt-26 sm:pb-20`}>
          <Eyebrow>Carter Thompson and Amay Poria</Eyebrow>
          <h2 className="font-heading max-w-[17ch] text-[2rem] leading-[1.05] font-medium text-[#0a1628] sm:text-[2.9rem]">
            Different generations. Same Penn Golf.
          </h2>
          <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-5 text-[15.5px] leading-[1.75] text-[#3d4a5c]">
              <p>
                Two Penn Golf alumni travelled with the group: Carter Thompson
                and Amay Poria. They played, they ate dinner with the team, and
                by about the second day the distinction between current player
                and alum had mostly stopped meaning anything.
              </p>
              <p>
                That is harder to arrange than it sounds. Penn Golf alumni
                played under different coaches, in different decades, in
                different versions of the program, and for most of that history
                there was no straightforward way for any of them to find each
                other.
              </p>
            </div>
            <div className="space-y-5 text-[15.5px] leading-[1.75] text-[#3d4a5c] lg:border-l lg:border-[rgba(180,168,150,0.5)] lg:pl-16">
              <p>
                That gap is the reason this Clubhouse exists. Rebuilding the
                rosters took months, and the result is a Member Book that goes
                back to 1930. But a list of names is a list of names.
              </p>
              <p>
                Four days of golf in Scotland with people who wore the same
                thing on their chest thirty years earlier is the thing the list
                is supposed to lead to.
              </p>
              <Link
                href="/member-book"
                className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#0a1628] transition-colors hover:text-[#990000]"
              >
                The Member Book, 1930 to now &rarr;
              </Link>
            </div>
          </div>
        </section>

        <FounderNote />

        {/* -------------------------------------------- contact sheet --- */}
        <section className="border-t border-[rgba(180,168,150,0.45)] bg-[#f5f1ea]">
          <div className={`${WRAP} py-16 sm:py-24`}>
            <Eyebrow>Moments from Scotland</Eyebrow>
            <h2 className="font-heading max-w-[16ch] text-[2rem] leading-[1.05] font-medium text-[#0a1628] sm:text-[2.6rem]">
              The week in nine frames.
            </h2>
            <p className="mt-4 max-w-[52ch] text-[14.5px] leading-relaxed text-ink-muted">
              The Jubilee. The Old Course. Kingsbarns. Carnoustie. And
              everything in between. Tap any of them to open it full size.
            </p>
            <div className="mt-10">
              <ContactSheet />
            </div>
          </div>
        </section>

        <ClosingInvitation />
      </article>
    </PhotoViewer>
  )
}
