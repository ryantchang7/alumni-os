# Penn Golf Clubhouse — final brief

**Purpose.** A handoff document. It exists so a fresh reader with no prior
context can reason rigorously about one decision: *how Ryan Chang should approach
Penn Athletics about the site he built, and what he should do in the next six
weeks.* Everything is verified against the live production site and repository as
of 2026-08-27 unless flagged otherwise.

**Reader instruction.** Sections 6 and 9 argue a specific position. Section 13
lists where that position is most likely wrong. Push on it rather than inheriting
it.

---

## 1. Who and what

Ryan Chang, current Penn men's golf student-athlete, rtchang@upenn.edu. Over
roughly the past year he single-handedly designed, built, shipped, and filmed
**penngolfclubhouse.com**, a private web application for Penn Men's Golf alumni
and current players.

He is a student developer, not a professional engineer, and built this with heavy
AI assistance. That bears on long-term maintainability, not on whether it works.
It demonstrably works.

**The clock:** his standing as a *current* player is the thing that gets him in a
room. It expires at graduation.

---

## 2. What exists (verified)

| Measure | Value |
|---|---|
| Application pages | 86 |
| API endpoints | 109 |
| React components | 68 |
| Lines of TypeScript/TSX | 65,548 |
| Unit test scripts | 15 |
| End-to-end Playwright specs | 12 |

Next.js 16.2.6, React 19.2.4, TypeScript 5, Tailwind 4, NextAuth v5, Vercel Blob,
Stripe, Resend. Live on Vercel.

**What it does:** a Member Book registry across generations; a claim flow where
alumni claim their own roster entry subject to approval; The Course (organized
rounds with tee sheets and group assignment); The 19th Hole (coffee, drinks,
dinners); Open Requests ("I'm in town"); Moments (photo/video wall); Locker Room
(players-and-alumni-only tier); Career Room (find members by industry); Ask
(a current player requests an intro to an alum); Team Room and The Season
(schedule, results, updates with galleries); direct chat; a member map; Hall of
Fame; and ~25 internal routes for roster scraping, data quality, the claims
queue, and launch readiness.

**The film:** public at `/launch`. Verified by probing the served file — **4:51,
1920×1080, 53 MB.** A 64-second cut also exists in 1080p and 4K. No music bed;
that decision was never finalized.

**The roster archive — the rare asset.** 340 members spanning **1930 to 2030**,
built from public pennathletics.com roster pages season by season, each record
carrying `sourceUrls` and a confidence score.

| Decade | Members | Decade | Members |
|---|---|---|---|
| 2020s | 30 | 1970s | 43 |
| 2010s | 31 | 1960s | 46 |
| 2000s | 29 | 1950s | 35 |
| 1990s | 18 | 1940s | 43 |
| 1980s | 18 | 1930s | ~47 |

Roughly 90 years of Penn men's golf history, structured. It is plausible that no
equivalent structured archive exists inside Penn Athletics. That is unverified
and worth checking.

---

## 3. The traction reality

| Metric | Value |
|---|---|
| Approved member accounts | **3** |
| Pending / approved / declined claims | 1 / 2 / 3 |
| Moments posted | 2 (both July) |
| Career posts, Open Requests | 0, 0 |
| Paying supporters, donations | 0, $0 |
| Chat conversations | 1 |

**The product is finished. Adoption is approximately zero.**

Two real events have ever existed: the Aug 22-23 2026 preseason trip (Belmont
Country Club, then The International's Pines Course), which the team genuinely
used — 15 players in 4 groups at Belmont, 12 at The International. Both are now
past. The upcoming board currently holds **one** card and it is a seeded
placeholder. No photos from the trip were ever posted.

---

## 4. The central asymmetry

Contact coverage across the 83 alumni profiles in the system:

| Field | Count |
|---|---|
| Email address | **3** |
| Phone number | **0** |
| LinkedIn URL | **1** |

**340 names. 3 ways to contact anyone.** The archive came from public pages;
public pages don't list emails.

Consequences:
- The launch runbook's "send the alumni email to ~340 people" step **has no list
  behind it.** It cannot happen as written.
- A small launch through personal relationships is still possible — the current
  team by group text, plus a handful of recent alumni he knows. Realistic ceiling
  perhaps 20-40 people, almost all 2020s.
- Everything beyond that requires an institutional channel.

*(A previously flagged spreadsheet, `Belmont CC Networking List.xlsx`, has been
ruled out by Ryan as a contact source. This conclusion stands unqualified.)*

---

## 5. Scotland — the opening

This reframes everything, and it was sitting on Ryan's own site the whole time.

**Penn Golf is going to Scotland, October 12–17 2026. Today is August 27 — 46
days out.**

- **Oct 12–14:** the St Andrews Links Collegiate. Penn, Texas, Washington, and
  St Andrews. Both Penn's men's and women's teams. Two rounds stroke play on the
  Jubilee, final day match play **on the Old Course**. All three days **televised
  on Golf Channel.**
- **Oct 14–17:** the alumni tour. "The Penn Golf family joins them across the
  pond." Three nights at the Old Course Hotel. Castle Course (alumni only),
  Kingsbarns, Carnoustie. Dinner at Rusacks overlooking the Old Course, farewell
  dinner at the Carnoustie clubhouse. Daily ballot for the Old Course.
- **Oct 15 at Kingsbarns: "Penn coaches and student-athletes join the group."**

Registration ran through **June 30, 2026** at three levels: **Bronze $5,000,
Silver $7,500, Gold $10,000**, the upper tiers folding in a tax-deductible gift
to the Penn Golf annual fund that sponsors student-athletes on the trip.

Read what that means:

1. **A list of the most engaged Penn Golf alumni alive already exists.** People
   who paid five to ten thousand dollars to fly to Scotland with the team are, by
   revealed preference, the most committed alumni in the entire population. Ryan
   has no way to reach 337 people — but *someone* has the contact details for
   this specific, pre-qualified group.
2. **Ryan will physically be with them.** He is on the team. The team competes
   Oct 12–14, and student-athletes join the alumni group at Kingsbarns on Oct 15.
   He will spend days alongside exactly the people he needs.
3. **October is peak attention on Penn Golf.** Three days on Golf Channel.
4. **Registration closing is not a loss.** It was never a signup hook. It is
   better than that: a defined, funded, committed group with a date.

---

## 6. Who to actually contact — already answered

The "which person at Penn Athletics" question is solved, and Ryan answered it
himself months ago. His own Scotland page says:

> The trip is organized with the **Penn Champions Club**. For anything about the
> Scotland Tour, confirmations, logistics, or details, reach **Charlie Carroll**
> at the Penn Champions Club.
> **ccarrol2@upenn.edu · (215) 898-8899**

The Penn Champions Club is Penn Athletics' donor and alumni-engagement arm.
Charlie Carroll runs the alumni side of the Scotland tour.

This matters enormously:
- **Not a cold staff-directory guess.** A named person running the exact program
  Ryan's product serves.
- **Warm-ish already.** Ryan built and published a page promoting their trip and
  directing people to Charlie.
- **Their model is his model.** The Champions Club converts alumni engagement
  into giving — the Scotland packages literally bundle annual-fund gifts. A tool
  that deepens alumni connection is not a side project to them; it is their
  function.

**Correction to earlier advice:** the previous recommendation was "coach first,
then Athletics." With a named contact who owns the relevant program, coach-first
is now optional rather than necessary. A mention from his coach still helps, but
it is no longer the gate.

---

## 7. First-principles reading of the deal

**Ryan holds:** a working deployed application specific to this problem; a
~90-year structured roster archive; a 4:51 film; insider credibility as a
rostered athlete; and small but real proof it works under live conditions (a
15-person tee sheet actually run on it).

**The Champions Club holds:** contactable alumni with consent and legitimacy;
the authority to endorse something so it doesn't read as spam; a funded alumni
program already in motion; and continuity beyond any one student.

**Neither asset produces value alone.** Software with no alumni is a demo. An
alumni list with no product is a spreadsheet and a LinkedIn search. That is
genuine complementarity, which is what makes a partnership rational rather than
charitable.

### The counterintuitive move on the data question
Do not hide that he holds 340 names with no relationship to those people. Lead
with it:

> I built the archive from public roster pages. I deliberately have no contact
> information for these people, and I'm not going to go around Penn to get it.
> That's exactly why I'm here.

Three reasons: they will work it out anyway and a hesitant answer is fatal; it
converts the liability into the reason for the meeting; and it signals judgment,
which is the actual thing being assessed when an undergraduate is in that room.

### On sequencing
The earlier logic — "build traction first, pitch second" — is substantially
weakened by Section 4. Ryan *cannot* manufacture meaningful traction without the
channel he'd be asking for. The bar before a meeting is therefore not "this has
traction" but **"this is alive"**: real people, real upcoming events, no
placeholder cards.

---

## 8. How to move forward

A concrete six-week sequence, built around the only hard deadline that exists.

### This week (Aug 27 – Sep 2) — make the site alive
Nothing here needs anyone else's permission.
1. **Post the preseason trip photos.** Two team photos exist and have never been
   uploaded. `/moments/new`, multi-upload, 30 seconds.
2. **Post 2–3 real upcoming events.** Right now the only upcoming card is a
   placeholder. A fall round, a Philadelphia coffee, anything real.
3. **Get the current roster on.** Group text, the 64-second cut, a direct link.
   This is the one population he can reach unilaterally, and they are the people
   who will be in Scotland with him.
4. **Post the gear haul** using the new team-update flow.

Target by Sep 2: no placeholder cards, ≥15 real accounts, ≥6 photos.

### Week of Sep 1 — email Charlie Carroll
Not a partnership pitch. A specific, time-boxed, zero-cost offer:

> Give the Scotland group a place to organize the trip and keep it afterwards.

The ask is small enough to say yes to in one reply: twenty minutes, and a
forward of one email to the registered travellers. What Ryan offers in return is
concrete — tee sheets for the Castle Course, Kingsbarns and Carnoustie; a place
to post photos each evening; and, the part that actually matters to the Champions
Club, **a relationship that persists after everyone flies home.** A one-week trip
becomes an ongoing connection, which is precisely what drives repeat giving.

Why this beats a generic partnership pitch: it has a deadline, a pre-qualified
user group, an obvious success metric, no cost to Penn, and it solves a problem
Charlie already has.

### September — onboard the Scotland group
If Charlie forwards it, every registered traveller who claims a profile is worth
more than fifty cold signups. These are $5,000–$10,000 alumni. Have the site
genuinely ready: their names in the Member Book, the Scotland rounds already on
the board as real gatherings.

### Oct 12–17 — the trip is the launch
Not a metaphor. Ryan is on site with the most engaged alumni in the population
during the highest-visibility week Penn Golf will have all year. Run the tee
sheets live. Post photos daily. Let people see it working while standing in it.
Golf Channel is covering the first three days.

### Late October — go back with their own numbers
Return to the Champions Club with results from *their* event: how many
travellers joined, what they posted, what happened after. That is when the
broader conversation — other teams, an ongoing arrangement — becomes a real
discussion rather than a speculative one.

---

## 9. Risks

1. **Monetization conflict — the most underrated.** The codebase has live Stripe
   tiers: **$10/month (Member), $20/month (Founding)**, plus a parent tier and
   donations. Zero subscribers today. But a student proposing to charge Penn
   alumni monthly, on a list derived from Penn roster data, under a Champions
   Club partnership — while the Champions Club is itself soliciting gifts from
   the same people — is a real conflict. **Decide the position before the
   meeting.** Cleanest option: billing off entirely for anything Penn-partnered.
   A competing ask on the same alumni is the fastest way to lose this.
2. **Data governance.** 340 real people, publicly sourced, no consent obtained,
   held privately. He must be able to state exactly what is stored, where it came
   from, who sees it, and how removal works — and it must already be true in the
   product, not aspirational.
3. **Ownership ambiguity.** He built it alone and owns it. Decide the floor
   beforehand: he owns the platform, Penn gets a pilot licence. Do not negotiate
   live while flattered to be in the room.
4. **Single-person continuity.** 65,548 lines, one graduating student, no second
   maintainer. Have an answer.
5. **Timing risk.** 46 days is enough, but only if the Charlie email goes out in
   early September. Sent in October it is worthless — everyone will be in
   Scotland or recovering from it.
6. **Unproven demand.** Nobody yet knows whether alumni want this. Three accounts
   is not evidence either way. Claiming product-market fit would be false and
   trivially punctured.

---

## 10. The outreach drafts

Full text in `docs/penn-athletics-outreach.md`. **Note: those drafts predate the
Scotland finding and are now partly superseded.** They assume a cold approach via
coach to an unnamed Associate AD. The correct version is warmer, names Charlie
Carroll, and leads with the Scotland offer rather than a general partnership ask.
The governance and ownership answers in Section 3 of that document remain
correct and should be carried forward verbatim.

Links to include:
- Film: https://www.penngolfclubhouse.com/launch
- Site: https://www.penngolfclubhouse.com
- Scotland page he already built: https://www.penngolfclubhouse.com/scotland

Copy principles that still hold: no "platform," no "engagement," no "network
effects." Champions Club staff hear vendor language constantly, and Ryan's entire
advantage is that he is not a vendor.

---

## 11. Open questions only Ryan can answer

1. **Is he definitely going to Scotland?** Section 8 assumes yes. If not, the
   entire plan needs rebuilding around a different anchor.
2. **Does he already know Charlie Carroll personally?** He built a page promoting
   Charlie's trip. If they've corresponded, the email is a follow-up rather than
   an introduction.
3. **What is the actual ask?** (a) permission and a channel; (b) a Scotland
   pilot; (c) multi-team deployment. Section 8 recommends (b) as the entry point
   because it is nearly free for Penn to grant. (c) is a procurement conversation
   measured in quarters.
4. **Position on charging money?** See Risk 1.
5. **Ownership floor?** See Risk 3.
6. **Roughly how many alumni registered for Scotland?** Determines whether this
   is a 10-person or 40-person pilot. Charlie knows; Ryan may not.

---

## 12. Where this analysis is most likely wrong

- **The Scotland pilot may be too small to matter.** If only 8 alumni registered,
  a successful pilot proves very little and burns the one warm contact.
- **Charlie Carroll may be the wrong function.** Champions Club is
  fundraising-led. Alumni *engagement* may sit with central Penn Alumni Relations,
  and a development officer may see this as a distraction from soliciting gifts.
- **The timing may be actively bad.** Six weeks before a major trip is when an
  organizer is most overloaded. The same email in November might get more
  attention, at the cost of missing the event.
- **Introducing an unofficial tool to paying travellers carries institutional
  risk** that Penn may simply decline — an unvetted student-run site touching
  $10,000 donors is a plausible no regardless of merit.
- **"340 names, 3 emails" may overstate the barrier.** QuakerNet, class notes,
  the current roster's parents, and one-at-a-time LinkedIn outreach all exist.
  None scale, but "only door" is probably too strong.
- **Zero traction may simply be disqualifying,** and the right move might be a
  semester of getting to 50 real users by any means before approaching anyone
  institutional.
- **The archive's rarity is asserted, not verified.** Penn may already hold
  complete structured roster history.

---

## Appendix: engineering completed 2026-08-26

**Past rounds become records.** Gatherings had no past-date logic at all: four
days after the preseason trip, both rounds still showed as "Open," counted in the
open tally, offered calendar links, and exposed live group-editing controls. Root
cause: gatherings stored only a host-typed free-text date. Two parser traps found
and fixed:

- `Date.parse("Saturday, June 14")` → **2001-06-14**. This was the host form's
  own placeholder, so following the form's example produced a date 25 years past,
  sorting a new round to the top of the board and then burying it as played.
- `Date.parse("Alumni Weekend, 2026")` → **2026-01-01**. The parser grabs a year
  and ignores the rest, inventing a January date for any label containing a year.

A dedicated date module now requires text to name a month or numeric date, reads
a yearless date as the *next* such day, and treats undatable text as never-past
(the safe direction is to leave a gathering visible). Both host forms capture a
real ISO date. Past rounds move to a read-only "Recently Played" section. 24 unit
tests. Verified live: the board went from "3 OPEN" to "1 OPEN" and "2 PLAYED."

**Faster team updates.** Posting an update required typing a date by hand and
allowed one image, which was really the link-preview override. Now: a date picker
pre-set to today with Today / Yesterday / Last Sat shortcuts, a one-tap escape to
free text for labels like "Championship Weekend," up to 12 photos or videos with
drag-to-reorder, and a gallery rendering in The Season. The link-preview upload
is hidden until a link exists. Verified live.
