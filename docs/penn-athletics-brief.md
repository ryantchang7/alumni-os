# Penn Golf Clubhouse — full brief for outside analysis

**Purpose.** This is a handoff document. It exists so a fresh reader (human or
model) with no prior context can reason rigorously about one decision: *how, and
on what terms, Ryan Chang should approach Penn Athletics about the site he
built.* Everything below is verified against the live production site and the
repository on 2026-08-26 unless explicitly flagged as unverified.

**Reader instruction.** Do not accept the framing in Section 6 uncritically. It
is one reading of the facts in Sections 2-5. Section 10 lists where it is most
likely wrong.

---

## 1. Who and what

Ryan Chang. Penn men's golf team member (current student-athlete). Email
rtchang@upenn.edu. Over roughly the past year he single-handedly designed, built,
and shipped **penngolfclubhouse.com**, a private web application for Penn Men's
Golf alumni and current players.

He is not a professional software engineer. He describes himself as an
intermediate-level student developer. The work was done with heavy AI assistance.
This matters for assessing durability, not for assessing whether the thing works
— it demonstrably works.

**Constraint that sets the clock:** his access and standing as a *current*
student-athlete expires when he graduates. A current player walking into an
Athletics office is a fundamentally different conversation than an alum emailing
in. Verified separately: the launch film references an October Scotland trip,
which dates the film's freshness to roughly October 2026.

---

## 2. What actually exists (verified)

### Scale of the software
| Measure | Value |
|---|---|
| Application pages | 86 |
| API endpoints | 109 |
| React components | 68 |
| Lines of TypeScript/TSX | 65,548 |
| Unit test scripts | 15 |
| End-to-end (Playwright) specs | 12 |

Stack: Next.js 16.2.6, React 19.2.4, TypeScript 5, Tailwind 4, NextAuth v5,
Vercel Blob storage, Stripe, Resend (transactional email). Deployed on Vercel at
penngolfclubhouse.com. This is a real production application, not a prototype.

### What the product does
Grouped by the actual routes that exist:

- **The Member Book** (`/member-book`) — a registry of Penn Men's Golf players
  across generations. Filterable by decade, sortable.
- **Claim flow** (`/alumni/claim`, `/profile/claim`) — an alum finds themselves
  in the roster history and claims their own entry. Claims are reviewed and
  approved by a captain/founder before the person becomes a member.
- **The Course** (`/the-course`) — organized rounds. A host opens a tee time,
  members pencil themselves in, the host arranges them into groups on a tee
  sheet. Google Maps preview, calendar export (Google + .ics).
- **The 19th Hole** (`/19th-hole`) — the same mechanic for non-golf gatherings:
  coffee, drinks, dinner, events.
- **Open Requests** (`/requests/new`) — "I'm in town, anyone want to play."
- **Moments** (`/moments`) — a shared photo/video wall. Multi-media posts,
  reactions, comments, tagging.
- **Locker Room** (`/locker-room`) — players-and-alumni-only tier, excludes
  coaches and family.
- **Career Room** (`/career-room`) — find members by industry; career posts.
- **Ask / outreach** (`/ask`, `/player/outreach/[id]`) — a current player
  requests an introduction to an alum for career advice, mentorship, etc.
- **Team Room / The Season** (`/team-room`, `/internal/season`) — schedule,
  results, and team updates with photo galleries.
- **Chat** (`/chat`) — direct messaging between members.
- **Member Map** (`/member-map`) — where members live now.
- **Hall of Fame, Spotlight, Meet the Team, Team Travel, Team Questions.**
- **Builder / internal tooling** (`/builder/*`, `/internal/*`, ~25 routes) — the
  roster-scraping and data-quality pipeline, claims queue, launch readiness
  dashboard, roles management.

### The film
Public at `https://www.penngolfclubhouse.com/launch`. Verified by probing the
actual served file: **4 minutes 51 seconds, 1920×1080, 53 MB.** A short cut also
exists (64 seconds, rendered in both 1080p and 4K). Ryan wrote, shot, narrated,
and edited it. The films have no music bed — a decision he never finalized.

### The roster archive — the genuinely rare asset
The Member Book holds **340 members spanning 1930 to 2030.** Verified counts per
decade:

| Decade | Members |
|---|---|
| 2020s | 30 |
| 2010s | 31 |
| 2000s | 29 |
| 1990s | 18 |
| 1980s | 18 |
| 1970s | 43 |
| 1960s | 46 |
| 1950s | 35 |
| 1940s | 43 |
| 1930s | remainder to 340 (~47) |

Source: public roster pages on pennathletics.com, scraped season by season, with
per-record `sourceUrls` and a confidence score retained. Roughly 90 years of Penn
men's golf roster history, reconstructed and structured.

**Assess this carefully.** It is plausible that no structured version of this
archive exists anywhere inside Penn Athletics itself. If true, it is the single
most valuable and least replicable thing Ryan holds. It is also the thing most
likely to raise a data-governance question.

---

## 3. What is *not* true — the traction reality

This is where the story turns. Live production metrics, 2026-08-26:

| Metric | Value |
|---|---|
| Approved member accounts | **3** |
| Pending claims | 1 |
| Approved claims | 2 |
| Declined claims | 3 |
| Moments posted | 2 (both July) |
| Career posts | 0 |
| Open requests | 0 |
| Active supporters (paying) | 0 |
| Donations | $0 |
| Chat conversations | 1 |
| Team memberships in system | 83 |

**The product is finished. The adoption is approximately zero.** Three accounts,
one of which is Ryan.

Two real events have ever existed on the site: the Aug 22-23 2026 preseason trip
(Belmont Country Club, then The International's Pines Course), which the team
genuinely used — 15 players across 4 groups at Belmont, 12 at The International.
Both are now in the past. As of today the upcoming board contains **one** card
and it is a seeded EXAMPLE (a placeholder "Merion Alumni Round").

No photos from the preseason trip were ever posted. Ryan has two team photos from
it; they have never made it onto the site.

---

## 4. The central asymmetry — read this twice

Contact-data coverage across the 83 alumni profiles in the system:

| Field | Count |
|---|---|
| Email address | **3** |
| Phone number | **0** |
| LinkedIn URL | **1** |
| City | 3 |
| Employer | 0 |

**Ryan has 340 names and 3 ways to contact anyone.**

He knows *who* every Penn golfer since 1930 is. He has almost no ability to reach
a single one of them. The roster archive was built from public pages that list
names and years; public pages do not list email addresses.

This single fact restructures the entire strategic question:

- The launch runbook in the repo assumes a "send the alumni email" step to
  roughly 340 people. **There is no list behind that step.** It cannot happen as
  written.
- A small soft launch *is* still possible, entirely through Ryan's personal
  relationships: the current team via group text, plus a handful of recent alumni
  he knows personally. That path needs nothing from Penn.
- Everything beyond that — the other ~330 people, the ones who make a *network*
  rather than a group chat — is unreachable without an institutional channel.

Penn Athletics is not a growth accelerant here. **It is the only door.**

---

## 5. What Penn Athletics has and appears to want

Reported by Ryan, not independently verified: Penn Athletics is currently trying
to connect athletics alumni "on LinkedIn and stuff" — i.e. manually, without a
purpose-built tool and apparently without a vendor.

If accurate, that implies:
- An acknowledged problem they are actively spending effort on.
- No incumbent contract to displace (much easier than a replacement sale).
- Their asset is exactly Ryan's gap: **contactable alumni and the institutional
  right to contact them.**
- Their scope is ~33 varsity programs; golf is one.

**Flag for the analyst:** verify whether Penn already uses an alumni-engagement
platform (Graduway, Almabase, PeopleGrove, Hivebrite are the common ones in this
category) either at the Athletics level or university-wide via Penn Alumni
Relations. If such a contract exists, the entire approach changes from "fill a
gap" to "integrate with or displace an incumbent," which is a far harder sale for
an undergraduate.

---

## 6. First-principles reading of the deal

Strip away the framing of a student asking for a favor and look at what each side
holds.

**Ryan holds:**
1. A working, deployed, non-trivial application specific to this exact problem.
2. A ~90-year structured roster archive Penn may not itself possess.
3. A 4:51 film that makes the case emotionally.
4. Insider credibility — he is a rostered athlete, not a vendor.
5. Proof, small but real, that the software works under live conditions (a
   15-person tee sheet actually run on it).

**Penn Athletics holds:**
1. Contactable alumni, with consent and legitimacy.
2. The authority to endorse something to alumni without it reading as spam.
3. Distribution across ~33 programs.
4. Continuity that outlasts any one student's graduation.

**Neither side's asset produces value alone.** Ryan's software with no alumni is
a demo. Penn's alumni list with no product is a spreadsheet and a LinkedIn
search. That is genuine complementarity, and complementarity — not enthusiasm —
is what makes a partnership rational for both parties.

### The counterintuitive move on the data problem
The instinct is to hide the weakness: don't mention that you hold 340 people's
names with no relationship to them. That instinct is wrong, for three reasons.

1. They will work it out. The first competent question is "where did this data
   come from," and a hesitant answer is fatal.
2. Volunteering it converts the liability into the *reason for the meeting*: "I
   built the archive from public pages. I deliberately have no contact
   information for these people, and I'm not going to go around Penn to get it.
   That's exactly why I'm sitting here."
3. It signals judgment. An undergraduate who proactively raises the governance
   question before being asked reads as someone safe to work with — which is the
   real thing being evaluated in that room.

### On sequencing
The earlier working assumption was "get traction first, pitch second," on the
logic that 40 users beats 3. Section 4 substantially weakens that: Ryan cannot
manufacture meaningful traction without the channel he'd be asking for. The
realistic ceiling on a purely personal-network launch is the current roster plus
a handful of recent alumni — perhaps 20-40 people, heavily skewed to the 2020s.

That is still worth doing before the meeting, but reframe *why*: not to prove
scale, but to ensure that when someone from Athletics clicks the link, the site
shows real people and real upcoming events rather than one seeded placeholder.
The bar is "this is alive," not "this has traction."

**Concretely, before any meeting:** post the trip photos, post 2-3 real upcoming
events, get the current roster onto the site. That is days of work, not months,
and requires nothing from anyone else.

---

## 7. Risks, stated honestly

1. **Monetization conflict — likely the most underrated risk.** The codebase
   contains live Stripe subscription tiers: **$10/month (Member) and $20/month
   (Founding Member)**, plus a parent tier and a donations path. Currently zero
   subscribers and zero revenue. But a student proposing to charge Penn alumni a
   monthly fee, on a member list derived from Penn roster data, under an
   Athletics partnership, is a complication that Athletics *will* notice.
   Ryan needs a settled position before the meeting. Plausible options: turn
   billing off entirely for any Penn-partnered deployment; keep it purely
   donation-based; or disclose it upfront and let Penn set the terms. Walking in
   without having decided is the bad outcome.

2. **Data governance.** 340 real people, publicly sourced, no consent obtained,
   held by a private individual. Ryan must be able to state precisely: what is
   stored, where it came from, who can see it, how removal works, and that
   nothing is sold or shared. If any of that is not currently true in the
   product, it should be made true before the meeting rather than described
   aspirationally.

3. **Ownership ambiguity.** He built it alone and owns it. "Partnership" can mean
   anything from a pilot licence to Penn assuming control. He should decide his
   floor beforehand. Negotiating live, as an undergraduate flattered to be in the
   room, is how people give things away.

4. **Single-person continuity.** One student, graduating. 65,548 lines with no
   second maintainer. Any institution will ask what happens after. He needs an
   answer even if it's "I intend to keep running it, and here's what handover
   would look like."

5. **Institutional pace.** Athletics departments move in months. This must not
   block the small launch, which needs nothing from them.

6. **Unproven demand.** The honest position: nobody yet knows whether Penn golf
   alumni want this. Three accounts is not evidence either way. Claiming
   product-market fit would be false and easily punctured.

---

## 8. The outreach, as currently drafted

Full drafts live in `docs/penn-athletics-outreach.md` in the repository. Summary
of the approach:

**Sequence: coach first.** A cold email from a student-athlete to an Associate AD
is weak. The same message forwarded by his coach gets read. The coach note is
short, states what was built, cites the trip as proof it was used, and asks for
one specific thing: an introduction to whoever owns alumni engagement.

**The Athletics email** leads with identity (current player, coach's referral),
describes the site in plain language, cites the Boston trip as the single
proof-of-use, names the gap it fills, and makes a deliberately small ask: twenty
minutes, plus the question of whether there's a legitimate way to reach Penn golf
alumni. It closes with one line about applicability to other teams — enough to
plant the idea, not enough to oversell.

Deliberate choices in the copy: no "platform," no "engagement," no
"network effects." Athletics staff hear vendor language constantly, and Ryan's
entire advantage is that he is not a vendor.

**Links to include:**
- Film: https://www.penngolfclubhouse.com/launch
- Site: https://www.penngolfclubhouse.com

---

## 9. Open questions only Ryan can answer

1. **What is the actual ask?** Three materially different options: (a) permission
   and a channel to reach Penn golf alumni, nothing more; (b) a formal pilot for
   golf with Athletics promotion; (c) a multi-team deployment. These have very
   different odds and timelines. (a) is nearly free for Penn to grant; (c) is a
   procurement conversation measured in quarters.
2. **Is the October Scotland trip open to alumni or team-only?** It is named in
   the film. If alumni can attend it is the strongest possible launch hook and it
   is time-boxed.
3. **What is on his Desktop at `Belmont CC Networking List.xlsx` (dated
   2026-08-14)?** If it contains alumni contact information, Section 4's
   conclusion weakens considerably. It has deliberately not been opened.
4. **What is his position on charging money?** See Risk 1.
5. **What is his ownership floor?** See Risk 3.
6. **Which specific person at Penn Athletics?** Development / Advancement /
   Alumni Relations are the likely functions. The name should come from his coach
   or the pennathletics.com staff directory, not a guess.

---

## 10. Where this analysis is most likely wrong

An outside reader should stress-test these specifically:

- **The "only door" claim (Section 4)** may be too strong. Alternative channels
  exist: Penn's general alumni directory (QuakerNet), class notes, LinkedIn
  outreach one at a time, the golf team's own alumni gatherings, word of mouth
  through the current roster's parents. None scale well, but "only" may be
  overstated.
- **The complementarity framing (Section 6)** assumes Penn Athletics perceives a
  problem worth solving. They may consider LinkedIn adequate, or view alumni
  contact as belonging to central Alumni Relations rather than Athletics, in
  which case Ryan is pitching the wrong department entirely.
- **The archive's rarity** is asserted, not verified. Penn may hold complete
  structured roster history already.
- **"Coach first" is asserted as obviously correct.** It costs time and gives the
  coach a veto. A direct approach might be faster if the right name is known.
- **The recommendation to launch small before pitching** could be wrong if speed
  matters more than polish — the graduation clock is real, and a meeting in
  September with a thin site may beat a meeting in November with a fuller one.
- **Zero traction may simply be disqualifying** regardless of framing, and the
  correct move might be to spend a semester getting to 50 real alumni users by
  any means available before approaching anyone institutional.

---

## Appendix: engineering work completed 2026-08-26

Two substantive changes shipped and verified on production this session.

**1. Past rounds become records.** Gatherings had no past-date logic at all: four
days after the preseason trip, both rounds still displayed as "Open," were
counted in the board's open tally, still offered calendar links, and still
exposed live group-editing controls. Root cause was that gatherings stored only a
host-typed free-text date. Two parser traps were found and fixed:

- `Date.parse("Saturday, June 14")` → **2001-06-14**. This was the host form's
  own placeholder text, so following the form's example produced a date 25 years
  in the past, which would sort a new round to the top of the board and then
  immediately bury it as already played.
- `Date.parse("Alumni Weekend, 2026")` → **2026-01-01**. The parser extracts a
  year and ignores everything else, inventing a January date for any label that
  merely contains a year.

A dedicated date module now requires text to actually name a month or numeric
date, reads a yearless date as the *next* such day, and treats anything it cannot
date as never-past (the safe direction is always to leave a gathering visible).
Both host forms now capture a real ISO date. Past rounds move to a "Recently
Played" section, read-only, showing who played. 24 unit tests cover it. Verified
live: the board went from "3 OPEN" to "1 OPEN" plus "2 PLAYED."

**2. Faster team updates.** Posting a team update (e.g. a gear haul) required
typing a date by hand and permitted one image, which was actually the link-
preview override. Now: a date picker pre-set to today with Today / Yesterday /
Last Sat shortcuts, a one-tap escape to free-text for labels like "Championship
Weekend," up to 12 photos or videos with drag-to-reorder, and a gallery that
renders in The Season. The link-preview upload is hidden until a link is present.
Verified live.
