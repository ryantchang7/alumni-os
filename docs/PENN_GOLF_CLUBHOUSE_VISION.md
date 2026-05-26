# Penn Golf Clubhouse — Product Vision

## One-Sentence Positioning

Penn Golf Clubhouse is a private member network for everyone who has worn the Penn Golf bag — where current players ask for advice, alumni stay connected to the program, and the whole community plays, gathers, and stays close across generations.

---

## Emotional Psychology

### Current Players

> "I know Penn Golf alumni are impressive, but I don't know who they are, who's willing to help, how to reach out, or how to not sound annoying."

Pain points:
- Don't know which alumni are willing to engage
- Afraid of reaching out cold and being a burden
- No context about what an alum actually does or cares about
- No social proof that outreach is welcome
- Don't know which alum fits their situation

What they need:
- Trust that the alum is open and willing
- Context to make the message personal and real
- A low-pressure, respected channel
- Golf as a natural shared connection
- Belonging to something that existed before them

### Alumni

> "I love Penn Golf and I'm happy to help, but I don't want random LinkedIn-style noise. Make it easy, curated, respectful, and worth opening."

Pain points:
- Tired of generic cold outreach with no context
- Don't want to be treated as a "connection" or "lead"
- Want to help but on their own terms
- Miss the program and want to stay close, not just be a resource
- No good way to connect with other alumni either

What they need:
- Control over when and how players can reach them
- Requests that are specific, warm, and respectful
- Connection to the current team and program, not just utility
- A place that feels like their clubhouse too
- The golf connection as a genuine bond, not a networking hook

---

## Core Framework

**Ask. Meet. Play. Gather.**

| Room | Purpose |
|------|---------|
| **Ask** | Career advice, mentorship, warm introductions, interview prep, internship guidance |
| **Meet** | Coffee chats, drinks, dinners, informal city visits |
| **Play** | Golf rounds, foursomes, club hosting, travel dates, favorite courses |
| **Gather** | Official events, alumni weekends, team banquets, career nights, reunions |

---

## Room-Based Sitemap

```
/                       Landing — Enter Clubhouse or Alumni Mode
/player                 Clubhouse Home (current player entry)
/player/search          Member Book — browse and filter alumni
/career-room            Career Room — advice, industries, intros
/the-course             The Course — rounds, foursomes, travel, clubs
/19th-hole              19th Hole — coffee, drinks, dinners, city gatherings
/events                 Events — formal alumni gatherings
/member-map             Member Map — where alumni are located
/team-room              Team Room — current roster + alumni support
/alumni                 Alumni Mode entry
/alumni/profile/[id]    Alumni profile management
/alumni/requests        Alumni inbox
/player/alumni/[id]     Public member card (player-facing)
/player/outreach/[id]   Send a Clubhouse Request
/internal               Internal tools (captain only)
/internal/master-list   Master member manager
```

---

## Language Rules

### Use Clubhouse Language

| Instead of... | Say... |
|---|---|
| users | members |
| directory | Member Book |
| connect | Request Introduction |
| online / active | Available to Help |
| verified user | Verified Penn Golf Member |
| create event | Host a Round |
| meetup | Gathering |
| feed post | Clubhouse Note |
| network | Penn Golf Circle |
| connections | Introductions |
| dashboard | — (don't use) |

### Forbidden on Public/Player/Alumni-Facing Pages

These terms must never appear in any player or alumni-facing UI:
- confidence
- extraction / extracted
- promoted / promotion
- source_backed / manually_verified
- scraper / scraping
- pipeline
- graph quality
- CRM / leads
- enrichment (use "profile" instead)
- analytics

Internal-only vocabulary is acceptable under `/internal`.

---

## Design System

**Colors:**
- Navy: `#0a1628` — headers, sidebar, dark UI
- Parchment: `#f8f5f0` — page background
- Penn Red: `#990000` — primary CTAs
- Warm white: `#ffffff` — cards
- Muted tan: `rgba(180,168,150,0.35)` — borders, dividers
- Club green: `#2d6a4f` — golf/verified accents (use sparingly)

**Typography:**
- Headings: Slightly elegant, not flashy — system-ui or Geist
- UI labels: Clean sans-serif
- Numbers/data: Tabular where appropriate

**Cards:**
- Soft shadow: `0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)`
- Border: `1px solid rgba(180,168,150,0.35)`
- Rounded: `rounded-xl` (not childish, not sharp)

**Feel:**
- Augusta-style private member atmosphere
- Warm, polished, credible, not startup-y
- No chart dashboards, no activity feeds, no follower counts
- No fake data, fake events, fake rounds, fake companies

---

## Member Roles

| Role | Who |
|---|---|
| `current_player` | Ryan Chang, Wesley Hu, Kayden Wang, Arjun Caprihan, Henry Chen, Max Fonseca |
| `alumni` | Everyone else — including Hayden Adams and Owen Hayes |

**Visibility rules:**
- Current players appear in Team Room / Current Roster
- Current players do NOT appear in Member Book as alumni
- Alumni appear in Member Book, Career Room, The Course, 19th Hole, Member Map, Events — only if `publishedToNetwork: true` AND `visibleToPlayers !== false`

---

## Near-Term Roadmap

### Now
- Member roles (current_player / alumni)
- Master list import complete
- Member Book filtered (alumni only, published + visible)
- Team Room (current roster + support CTAs)
- Career Room, The Course, 19th Hole MVPs
- Events + Member Map MVPs
- Alumni profile self-service
- Guided request flow
- Internal master member manager

### Next
- Auth (invite-link based, no password required initially)
- Persistent DB (Supabase or PlanetScale)
- Email notifications for requests
- Real request dispatch to alumni
- Alumni claim flow (email verification)
- Event and round objects
- City summer clubhouse logic
- Recommendation engine (match player interests to alumni openness)

### Later
- Multi-team expansion (Penn Women's Golf, other Ivy programs)
- Sellable system for other college golf programs
- Import agent as internal admin tool
- Fully verified member network with credentialing
- Mobile app (React Native)
