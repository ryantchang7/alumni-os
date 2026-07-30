/**
 * Launch Kit content — every piece of copy the launch needs lives
 * here so the public /launch page, the captain /internal/launch-kit,
 * and the teleprompter all read from one source. Edit in one place,
 * everywhere catches up.
 *
 * Tone rules:
 *   - Warm, humble, confident. Ryan's voice, not investor-pitch voice.
 *   - "Penn Golf family", "members", "Ask. Meet. Play. Gather."
 *   - No "users", "CRM", "leads", "pipeline", "automation",
 *     "engagement", "funnel". The PROHIBITED_WORDS array below is
 *     a self-check.
 *   - Light on em dashes.
 */

export const TAGLINE = 'Ask. Meet. Play. Gather.'

export const HERO_TITLE = 'Penn Golf Clubhouse'
export const HERO_SUBTITLE = 'For everyone who carried the Penn Golf bag.'
export const HERO_BODY =
  'A private clubhouse for Penn Golf players, alumni, family, and friends to ask for advice, meet, play rounds, gather, and stay connected to the program.'

export const ACCESS_LINE =
  'Joining is approval-based, not paywalled. Optional membership tiers are there if you want to back the Clubhouse and the program, but connection is the point.'

export const CLOSING_LINE = 'Come into the Clubhouse.'

/* ── Founder note (used on /launch) ──────────────────────────────── */

export const FOUNDER_NOTE = `Hey Penn Men's Golf family. I'm Ryan Chang, a rising junior on the team from Brookline, Massachusetts.

This spring at Ivy Champs at Baltusrol, I felt something I think a lot of you have felt. Patrick Cooper hosted us. Derek Rodgers, Carter Thompson, KJ, and so many other Penn Golf guys were out there. It wasn't a couple alumni showing up. It felt like a real Penn Golf family. Generations standing on the same range, pulling for the same program.

That's the feeling I wanted to bottle.

Golf has given me so much: opportunities, friendships, mentors, doors that opened because someone from this program took a phone call. A lot of that traces back to the people who came before us. But Penn Golf has had different coaches, classes, and generations, and the connection across all of that hasn't always been easy.

So I built Penn Golf Clubhouse.

I compiled our Member Book through online research and Penn historical data — every player and manager I could find from 1930 onward. Then I built a private space for everyone who's carried the Penn Golf bag, designed around what we actually do: ask, meet, play, gather.

For the Penn Golf family. A place to stay close, help the next group, keep playing together, and hopefully help us keep taking down Princeton and Harvard.

— Ryan Chang, Penn Men's Golf '28, Brookline, MA`

/* ── The four-room model ─────────────────────────────────────────── */

export interface RoomCard {
  title: 'Ask' | 'Meet' | 'Play' | 'Gather'
  blurb: string
  examples: string[]
  surfaces: string[]
}

export const ROOM_CARDS: RoomCard[] = [
  {
    title: 'Ask',
    blurb: 'Career advice, mentorship, and warm introductions without the awkward DM.',
    examples: ['"How did you break into private credit after Penn?"', '"Who do you know at Wachtell?"', '"Coffee in NYC if you have 20 min?"'],
    surfaces: ['Guided Ask', 'Career Room'],
  },
  {
    title: 'Meet',
    blurb: 'Coffee, drinks, dinners, and city gatherings with the Penn Golf family.',
    examples: ['Coffee in Boston', 'Penn Golf dinner during the US Open', 'Drinks before the Yale alumni weekend'],
    surfaces: ['19th Hole', 'Open Requests'],
  },
  {
    title: 'Play',
    blurb: 'Host a round at your home course, or find a tee time wherever you are.',
    examples: ['Host at Winged Foot', 'Visiting Charlotte and looking for a round', 'Foursome at Pine Valley next month'],
    surfaces: ['The Course', 'Open Requests'],
  },
  {
    title: 'Gather',
    blurb: 'Events, alumni weekends, team updates, and the next generation of Penn Golf.',
    examples: ['Alumni weekend at the Highlands', 'Team Room news + scores', 'Founders Wall + the current roster'],
    surfaces: ['Team Room', 'Moments', 'Hall of Fame'],
  },
]

/* ── Feature walkthrough (for the public /launch page) ───────────── */

export interface FeatureRow {
  label: string
  href: string
  blurb: string
}

export const FEATURE_WALKTHROUGH: FeatureRow[] = [
  { label: 'Member Book', href: '/member-book', blurb: 'Every Penn Men\'s Golf player from 1930 onward, by name, year, and hometown.' },
  { label: 'Member Map', href: '/member-map', blurb: 'See where the Penn Golf family lives, travels, and gathers.' },
  { label: 'Guided Ask', href: '/ask', blurb: 'A respectful framework for career advice, intros, and coffee chats.' },
  { label: 'The Course', href: '/the-course', blurb: 'Host or join a round at your home course. Open round requests for visiting members.' },
  { label: '19th Hole', href: '/19th-hole', blurb: 'Coffee, drinks, dinner, and signature gatherings in every city.' },
  { label: 'Team Room', href: '/team-room', blurb: 'Stay close to the current team. Schedules, results, news.' },
  { label: 'Moments', href: '/moments', blurb: 'Photos and notes from the Penn Golf road.' },
  { label: 'Support', href: '/support', blurb: 'Optional membership tiers. 70% to the program, 30% to keep the Clubhouse running.' },
]

/* ── Access model copy ───────────────────────────────────────────── */

export interface AccessStep {
  step: string
  label: string
  body: string
}

export const ACCESS_STEPS: AccessStep[] = [
  {
    step: '1',
    label: 'Claim your card',
    body: 'Find your name in the Member Book and send a quick claim. Takes 30 seconds.',
  },
  {
    step: '2',
    label: 'Captain approval',
    body: 'A Penn Golf captain checks the claim. Usually same-day.',
  },
  {
    step: '3',
    label: 'You\'re in',
    body: 'Full access to every room. Post, ask, host, meet.',
  },
  {
    step: '4',
    label: 'Optional support',
    body: 'If you want to back the Clubhouse and the program, the support tiers are right there. Never required.',
  },
]

/* ── Launch video scripts (3 lengths) ────────────────────────────── */

export type ScriptLength = '60' | '90' | '120'

export interface ScriptVersion {
  id: ScriptLength
  label: string
  targetSeconds: number
  wordCount: number
  text: string
}

const SCRIPT_60 = `Hey Penn Men's Golf family. I'm Ryan Chang, a rising junior from Brookline, Massachusetts.

This spring at Ivy Champs at Baltusrol, hosted by Patrick Cooper, I saw Derek Rodgers, Carter Thompson, KJ, and so many of you out there. And it hit me. Penn Golf is a real family.

So I built Penn Golf Clubhouse. A private space for everyone who's carried the Penn Golf bag.

Inside: our full Member Book, a map of where we all are, a way to ask for advice without the awkwardness, set up coffee, host or join a round, and stay close to the team.

Ask. Meet. Play. Gather.

Approval-based, not paywalled. Optional support tiers if you want to back the program too.

Come claim your member card at penngolfclubhouse.com.`

const SCRIPT_90 = `Hey Penn Men's Golf family. I'm Ryan Chang, a rising junior on the team from Brookline, Massachusetts.

This spring at Ivy Champs at Baltusrol, I felt something I think a lot of you have felt. Patrick Cooper hosted us. Derek Rodgers, Carter Thompson, KJ, and so many other guys were out there. It wasn't a couple alumni showing up. It felt like a real Penn Golf family.

Golf has given me so much, and a lot of that traces back to the people who came before us. But Penn Golf has had different coaches, classes, and generations, and our family hasn't always been as connected as it could be.

So I built Penn Golf Clubhouse.

I compiled our Member Book through online research and Penn historical data, then built a private space for everyone who's carried the Penn Golf bag.

Inside, you can find members across generations, see where everyone is on the map, ask for career advice without the awkwardness, set up coffee or drinks, host or join a round, follow the current team, post moments, and support the program.

The idea is simple. Ask. Meet. Play. Gather.

Joining is approval-based, not paywalled. The optional membership tiers are there if you want to support the program, but connection is the point.

For the Penn Golf family. A place to stay close, help the next group, keep playing together, and hopefully take down Princeton and Harvard.

Come claim your member card at penngolfclubhouse.com.`

const SCRIPT_120 = `Hey Penn Men's Golf family. I'm Ryan Chang, a rising junior on the team from Brookline, Massachusetts.

This spring at Ivy Champs at Baltusrol, I felt something I think a lot of you have felt. Patrick Cooper hosted us. Derek Rodgers, Carter Thompson, KJ, and so many other Penn Golf guys were out there. It wasn't a couple alumni showing up. It felt like a real Penn Golf family. Generations standing on the same range, pulling for the same program.

That's the feeling I wanted to bottle.

Golf has given me so much: opportunities, friendships, mentors, doors that opened because someone from this program took a phone call or sent a quick note. A lot of that traces back to people who came before us. But Penn Golf has had different coaches, classes, and generations, and the connection across all of that hasn't always been easy.

So I built Penn Golf Clubhouse.

I compiled our Member Book through online research and Penn historical data. Every player and manager I could find from 1948 onward, by name, year, and hometown. Then I built a private space for everyone who's carried the Penn Golf bag.

Inside, you can find members across generations, see where everyone is on the map, ask for career advice without the awkwardness, set up coffee or drinks in any city, host or join a round at your home course, follow the current team, post moments from the road, and support the program if you choose.

The idea is simple. Ask. Meet. Play. Gather.

For current players, it makes it easier to reach out respectfully. For alumni, it makes it easy to help in a curated way and stay close to the team you spent four years building.

Joining is approval-based, not paywalled. The optional membership tiers are there if you want to back the Clubhouse and the program. But connection is the point. Always.

This is for the Penn Golf family. A place to stay close, help the next group, keep playing together, and hopefully help us keep taking down Princeton and Harvard.

Come claim your member card at penngolfclubhouse.com.`

function countWords(s: string): number {
  return s.trim().split(/\s+/).length
}

export const SCRIPTS: ScriptVersion[] = [
  { id: '60', label: '60-second short cut', targetSeconds: 60, text: SCRIPT_60, wordCount: countWords(SCRIPT_60) },
  { id: '90', label: '90-second main launch', targetSeconds: 90, text: SCRIPT_90, wordCount: countWords(SCRIPT_90) },
  { id: '120', label: '2-minute founder walkthrough', targetSeconds: 120, text: SCRIPT_120, wordCount: countWords(SCRIPT_120) },
]

export function getScript(id: ScriptLength): ScriptVersion {
  return SCRIPTS.find(s => s.id === id) ?? SCRIPTS[1]
}

/* ── Shot-by-shot storyboard (mapped to the 90-second cut) ───────── */

export interface StoryboardBeat {
  timestamp: string
  voiceover: string
  visual: string
  route: string
  notes: string
}

export const STORYBOARD: StoryboardBeat[] = [
  {
    timestamp: '0:00–0:06',
    voiceover: '(silent open)',
    visual: 'Landing hero with the curtain lift animation. Hold on the wordmark.',
    route: '/',
    notes: 'Let the curtain animation breathe. Cut on the first audio beat.',
  },
  {
    timestamp: '0:06–0:16',
    voiceover: 'Hey Penn Men\'s Golf family. I\'m Ryan Chang, a rising junior on the team from Brookline, Massachusetts.',
    visual: 'Ryan piece-to-camera, outdoor or campus background. Friendly, eye-line straight to lens.',
    route: '(talking head)',
    notes: 'iPhone 4K, 24fps. Natural light if possible. Lavalier mic clipped under collar.',
  },
  {
    timestamp: '0:16–0:25',
    voiceover: 'This spring at Ivy Champs at Baltusrol, I felt something I think a lot of you have felt. Patrick Cooper hosted us, and seeing Derek Rodgers, Carter Thompson, KJ, and so many other guys out there — it felt like a real Penn Golf family.',
    visual: 'Cut to /launch hero text, then to /team-room. If you have Baltusrol B-roll, drop it in here.',
    route: '/launch → /team-room',
    notes: 'No real names of alumni shown on screen unless you have permission. Keep it on the Clubhouse surfaces.',
  },
  {
    timestamp: '0:25–0:35',
    voiceover: 'So I built Penn Golf Clubhouse. I compiled our Member Book through online research and Penn historical data.',
    visual: 'Pan the Member Book registry. Hover a single card. Show the "Members / Generations" stats plaque.',
    route: '/member-book',
    notes: 'Linger on the year range plaque. It signals depth without saying anything corny.',
  },
  {
    timestamp: '0:35–0:43',
    voiceover: 'See where the Penn Golf family is on the map.',
    visual: 'Member Map US view. Pan from the Northeast westward. Click a state list.',
    route: '/member-map',
    notes: 'Keep cursor smooth. If the map has motion, let it settle before clicking.',
  },
  {
    timestamp: '0:43–0:53',
    voiceover: 'Ask for career advice without the awkwardness.',
    visual: 'Open the Guided Ask flow. Show the purpose chips, then the templated message preview.',
    route: '/ask',
    notes: 'Don\'t actually send a request. Just walk through one purpose to show the framework.',
  },
  {
    timestamp: '0:53–1:02',
    voiceover: 'Set up coffee, drinks, or host a round.',
    visual: 'Quick sweep: /the-course Open Requests strip → /19th-hole gatherings.',
    route: '/the-course → /19th-hole',
    notes: 'Seed at least one Open Request beforehand so the strip is populated.',
  },
  {
    timestamp: '1:02–1:10',
    voiceover: 'Follow the current team. Post moments.',
    visual: 'Cut /team-room then /moments. Show a real moment photo if posted.',
    route: '/team-room → /moments',
    notes: 'Pre-post 2–3 moments so the wall isn\'t empty.',
  },
  {
    timestamp: '1:10–1:18',
    voiceover: 'Support the program if you want to. The idea is simple. Ask. Meet. Play. Gather.',
    visual: '/support page (briefly), then the Ask. Meet. Play. Gather. card on /launch.',
    route: '/support → /launch',
    notes: 'Hold on the four-word card for 1.5s. Let the phrase land.',
  },
  {
    timestamp: '1:18–1:30',
    voiceover: 'Approval-based, not paywalled. Come claim your member card at penngolfclubhouse.com.',
    visual: 'Return to /launch hero with the "Claim Your Member Card" CTA highlighted.',
    route: '/launch',
    notes: 'End on the hero. Allow 1s of breath. Cut to black.',
  },
]

/* ── Screen recording checklist (in order) ───────────────────────── */

export interface RecordingStep {
  route: string
  pageName: string
  action: string
  why: string
}

export const RECORDING_CHECKLIST: RecordingStep[] = [
  { route: '/', pageName: 'Landing', action: 'Let curtain lift, hold on wordmark for 2s.', why: 'Hero shot. The first frame.' },
  { route: '/launch', pageName: 'Launch page', action: 'Slow scroll: hero → four rooms → access steps.', why: 'Pitches the product in one page.' },
  { route: '/player', pageName: 'Clubhouse home', action: 'Show the dashboard once a signed-in member lands.', why: 'Visual proof there\'s a real "inside".' },
  { route: '/member-book', pageName: 'Member Book', action: 'Scroll the registry. Hover one card. Show the year-range plaque.', why: 'Depth of the archive.' },
  { route: '/member-map', pageName: 'Member Map', action: 'Pan the US map. Click a state, show the alumni list.', why: 'Geography of the family.' },
  { route: '/ask', pageName: 'Guided Ask', action: 'Pick "Career advice", show one templated message preview. Don\'t send.', why: 'The respect framework in action.' },
  { route: '/the-course', pageName: 'The Course', action: 'Show Open Requests strip, then Open to a Round section.', why: 'Round-hosting in action.' },
  { route: '/19th-hole', pageName: '19th Hole', action: 'Show gatherings + Open Requests strip.', why: 'Social side.' },
  { route: '/moments', pageName: 'Moments', action: 'Scroll a few photos.', why: 'The "we\'re alive" wall.' },
  { route: '/team-room', pageName: 'Team Room', action: 'Show team news strip and roster.', why: 'Close to the program.' },
  { route: '/support', pageName: 'Support', action: 'Show the tier cards briefly.', why: 'Optional, not the gate.' },
]

/* ── Marketing copy blocks ───────────────────────────────────────── */

export interface CopyBlock {
  id: string
  label: string
  surface: string
  body: string
}

export const COPY_BLOCKS: CopyBlock[] = [
  {
    id: 'alumni-email',
    label: 'Alumni email',
    surface: 'Send to the full Member Book once. Personalize the first name.',
    body: `Subject: Penn Golf Clubhouse — a place for everyone who carried the bag.

Hey [first name],

This spring at Ivy Champs at Baltusrol, with Patrick Cooper hosting and so many of you on the property, I felt something Penn Golf has always had but never quite captured in one place. A family.

So I built Penn Golf Clubhouse. A private home for the program.

Inside:
• The Member Book — every player I could find from 1948 onward
• The Member Map — where everyone is now
• The Course — host or join a round wherever you're traveling
• The 19th Hole — coffee, drinks, dinners
• Career Room + Guided Ask — advice and intros without the awkwardness
• Moments + Team Room — stay close to the current team

Joining is approval-based, not paywalled. The optional support tiers are there if you want to back the Clubhouse and the program, but that's never the gate.

Come claim your member card → penngolfclubhouse.com

For the Penn Golf family,
Ryan Chang
Penn Men's Golf '28
Brookline, MA`,
  },
  {
    id: 'team-group-text',
    label: 'Current team group text',
    surface: 'The team chat. Casual. Lowercase.',
    body: `yo penn golf

built something for us 🏌️
penngolfclubhouse.com

it's a private clubhouse for the whole penn golf family. alumni, current team, parents. claim your card, see where everyone is, ask for advice, set up rounds.

approval-based, takes 30s to sign up. let me know what you think and ping me if anything breaks`,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn post',
    surface: 'Posted from Ryan\'s personal profile. Tag Penn Athletics if appropriate.',
    body: `Building Penn Golf Clubhouse.

A private home for Penn Men's Golf alumni, current players, family, and friends of the program.

The idea came at Ivy Champs at Baltusrol this spring, watching generations of Penn Golf on the same course. Different eras, different coaches, but the same family. There just wasn't a way for that family to find and help each other on a normal Tuesday.

So we built one.

Inside: the full Member Book (every player I could find from 1948 onward), a map of where everyone is now, a guided way to ask for career advice without the awkwardness, coffee and rounds in any city, and a place to follow the current team.

Approval-based, not paywalled. The point is connection first.

If you carried the Penn Golf bag, come claim your card → penngolfclubhouse.com

For the Penn Golf family. Thanks to everyone who's already in. This wouldn't exist without you.`,
  },
  {
    id: 'instagram',
    label: 'Instagram caption',
    surface: 'Posted alongside the 90-second main video. Reel format.',
    body: `For everyone who carried the Penn Golf bag.

Penn Golf Clubhouse is live → penngolfclubhouse.com 🏌️

Ask. Meet. Play. Gather.

#PennGolf #IvyGolf`,
  },
  {
    id: 'sms-alumni',
    label: 'Short SMS to recent alumni',
    surface: 'For people in Ryan\'s contacts. Personal, low pressure.',
    body: `Built Penn Golf Clubhouse — a private space for the whole Penn Golf family. Approval based, takes a sec. Come claim your card → penngolfclubhouse.com`,
  },
  {
    id: 'parent-family',
    label: 'Parent / family note',
    surface: 'Sent by Ryan or a player to their own family.',
    body: `Hi [parent first name],

It's Ryan Chang, on the current Penn Men's Golf team. We just launched Penn Golf Clubhouse, a private space for the Penn Golf family that includes parents and longtime friends of the program.

You can claim a Family & Affiliate card at penngolfclubhouse.com. It's free and approval-based. You'll be able to follow the team, see where alumni are around the country, and stay close to everything happening with the program.

It would mean a lot to have [player name]'s family in there.

Thanks for everything you do for Penn Golf,
Ryan`,
  },
]

/* ── AI B-roll prompts (atmosphere only — see warnings) ──────────── */

export const AI_VIDEO_PROMPTS: string[] = [
  'Cinematic private Ivy League golf clubhouse interior, late afternoon light through leaded glass windows, navy and parchment color palette, leather and wood, no people, no text, no logos, premium documentary style, shallow depth of field.',
  'Slow pan across an antique scorecard, leather golf glove, and brass key on a polished oak clubhouse table. Warm afternoon light. Nostalgic, restrained, no text.',
  'Close-up handheld shot of a hand removing a leather golf bag tag with a stitched generic patch. Neutral tones, cinematic, no faces visible, no real logos.',
  'Aerial pull-back over an empty Northeast fairway at golden hour, subtle mist, no carts, no people, private club atmosphere, restrained color grading, no text.',
  'Static wide shot of a worn leather armchair in a clubhouse library, single brass desk lamp, books stacked on the side table, a putter leaning in the corner. Warm dim light, dust motes in the air, no people, no text.',
  'Macro tracking shot of a golf ball settling into rough grass after a chip, dawn light, dew on the blades, no real brand logos visible, cinematic.',
  'Hands writing in a leather-bound notebook beside a coffee cup on a clubhouse table, soft window light, no faces visible, restrained, nostalgic, no text on screen.',
  'Slow tilt up a vintage wooden golf locker, brass nameplate blurred, hanging wool sweater, warm interior light, no real names visible, cinematic.',
]

export const AI_VIDEO_WARNINGS: string[] = [
  'Do not generate AI footage of any real Penn alumni, current players, coaches, or staff.',
  'Do not use real names, faces, or likenesses in any AI-generated clip.',
  'Do not show Penn-branded apparel or real logos in AI footage. Generic patches or blurred details only.',
  'AI B-roll is atmosphere. Ryan\'s real piece-to-camera and the real screen recordings should carry the video.',
]

/* ── Recording flow + asset guidance ─────────────────────────────── */

export interface SizeGuide {
  ratio: string
  pixels: string
  where: string
}

export const RECORDING_SIZES: SizeGuide[] = [
  { ratio: '16:9', pixels: '1920 × 1080', where: 'YouTube, website embed, email player.' },
  { ratio: '9:16', pixels: '1080 × 1920', where: 'Instagram Reels, TikTok, Stories. Crop the talking head tight.' },
  { ratio: '1:1', pixels: '1080 × 1080', where: 'LinkedIn feed, Instagram feed carousels.' },
]

export const RECORDING_FLOW: string[] = [
  'Record Ryan\'s piece-to-camera on iPhone in 4K at 24fps. Lavalier mic clipped under the collar.',
  'Record the website on QuickTime (Cmd-Shift-5) or Screen Studio. Chrome at 110% zoom, window mode (not full browser), 1920 × 1080 capture.',
  'Edit in CapCut (free, fast), Final Cut, Descript, or Premiere. Cuts on the beat. Each on-screen scene 4-6 seconds max.',
  'Auto-caption, then proofread. Captions on for silent autoplay.',
  'Music: tasteful instrumental, low in the mix. Try Epidemic Sound\'s "Settle In" or "Field Notes" categories. Avoid TikTok-popular tracks.',
  'Add 1 second of black at the start and 1 second at the end so social platforms don\'t clip the CTA.',
]

export const ASSET_REFS: Array<{ label: string; value: string; note?: string }> = [
  { label: 'Site URL', value: 'penngolfclubhouse.com' },
  { label: 'Brand color (navy)', value: '#0a1628', note: 'Hero backgrounds, deep accents.' },
  { label: 'Brand color (parchment)', value: '#f8f5f0', note: 'Page background, warm fields.' },
  { label: 'Brand color (Penn red)', value: '#990000', note: 'CTAs, links, action.' },
  { label: 'Brand color (course green)', value: '#2d6a4f', note: '"On the Course" accent.' },
  { label: 'Brand color (19th gold)', value: '#b8860b', note: '"19th Hole" accent.' },
  { label: 'Display serif', value: 'Playfair Display', note: 'Headings, hero lines.' },
  { label: 'Wordmark', value: 'PENN GOLF', note: 'Tracked caps, NavBar.' },
  { label: 'Tagline', value: TAGLINE },
  { label: 'Hero crest', value: '/clubhouse-cover.jpg', note: 'Landing background.' },
  { label: 'Favicon', value: '/favicon.ico' },
]

/* ── Prohibited vocabulary (self-check) ──────────────────────────── */

export const PROHIBITED_WORDS = [
  'users',
  'CRM',
  'leads',
  'pipeline',
  'automation',
  'engagement metrics',
  'growth funnel',
  'funnel',
] as const

export interface ProhibitedHit {
  word: string
  where: string
  excerpt: string
}

function scanForProhibited(label: string, text: string): ProhibitedHit[] {
  const hits: ProhibitedHit[] = []
  const lower = text.toLowerCase()
  for (const raw of PROHIBITED_WORDS) {
    const w = raw.toLowerCase()
    const idx = lower.indexOf(w)
    if (idx === -1) continue
    // Word-boundary check (avoid matching "automation" inside "automotive" etc).
    const before = idx === 0 ? ' ' : lower[idx - 1]
    const after = lower[idx + w.length] ?? ' '
    if (/[a-z]/.test(before) || /[a-z]/.test(after)) continue
    const start = Math.max(0, idx - 30)
    const end = Math.min(text.length, idx + w.length + 30)
    hits.push({ word: raw, where: label, excerpt: text.slice(start, end) })
  }
  return hits
}

/**
 * Self-check: scan every script + copy block + hero string for
 * prohibited corporate vocabulary. Returns empty array if clean.
 * Surfaced on the kit page so it's a live signal, not a hidden test.
 */
export function getProhibitedHits(): ProhibitedHit[] {
  const hits: ProhibitedHit[] = []
  hits.push(...scanForProhibited('HERO_BODY', HERO_BODY))
  hits.push(...scanForProhibited('FOUNDER_NOTE', FOUNDER_NOTE))
  hits.push(...scanForProhibited('ACCESS_LINE', ACCESS_LINE))
  for (const s of SCRIPTS) {
    hits.push(...scanForProhibited(`SCRIPT_${s.id}`, s.text))
  }
  for (const c of COPY_BLOCKS) {
    hits.push(...scanForProhibited(c.id, c.body))
  }
  return hits
}

export const ACCESS_AFFIRMATION = {
  positive: 'approval-based, not paywalled',
  appears: ACCESS_LINE.toLowerCase().includes('approval-based, not paywalled'),
}

/* ── Shoot Day playbook ──────────────────────────────────────────── */

export interface ChecklistItem {
  label: string
  detail: string
}

export const DAY_BEFORE_CHECKLIST: ChecklistItem[] = [
  {
    label: 'Seed Open Requests so the strips are populated',
    detail: 'Post one Round request and one Coffee request from a second test account (or your personal email). Empty strips look unfinished on camera.',
  },
  {
    label: 'Seed Moments + Career Posts',
    detail: 'Post 2-3 real photos to Moments and 2-3 Career posts. The walls should look alive, not freshly deployed.',
  },
  {
    label: 'Sign in as yourself in a fresh Chrome profile',
    detail: 'New profile, no extensions, no other tabs, no bookmarks bar. Stays clean across every take and never accidentally shows your inbox.',
  },
  {
    label: 'Verify the deploy reads production',
    detail: 'URL bar shows penngolfclubhouse.com. No localhost in the title bar. Sign-in works end to end. Open Requests strip shows your seeded entries.',
  },
  {
    label: 'Charge devices to 100%',
    detail: 'iPhone (talking head), Mac (screen capture), lavalier transmitter, ring light if you have one.',
  },
  {
    label: 'Set Do Not Disturb on everything',
    detail: 'Mac: Focus mode on. Phone: airplane mode for filming, off briefly to confirm posts went through. Notifications during a take kill the take.',
  },
  {
    label: 'Pick wardrobe and lay it out',
    detail: 'A Penn Golf polo or quarter-zip is on-brand. Avoid pure white (blows out) and busy patterns (moire on camera). Solid navy or cream reads best.',
  },
  {
    label: 'Scout the talking-head location',
    detail: 'Find one outdoor spot for golden hour and one indoor backup. Stand in both, take a test photo, check audio for traffic / HVAC.',
  },
  {
    label: 'Test the full audio chain once',
    detail: 'Clip the lavalier, record 30 seconds of voice on iPhone, listen back with headphones. If you hear crackle or rumble, fix it before the morning.',
  },
  {
    label: 'Re-read the 90-second script out loud twice',
    detail: 'Time yourself. If you land at 85-95 seconds, you\'re calibrated. If you\'re running long, mark the lines you can drop.',
  },
]

export interface ShootPhase {
  number: number
  label: string
  duration: string
  goal: string
  steps: string[]
}

export const SHOOT_DAY_PHASES: ShootPhase[] = [
  {
    number: 1,
    label: 'Talking head, outdoors',
    duration: '~30 min, golden hour',
    goal: 'Capture the camera-facing piece while energy and light are at peak.',
    steps: [
      'Set up: tripod or stable surface, iPhone in 4K 24fps landscape, lavalier clipped, eye-line sticker beside the lens.',
      'Sun behind camera, not behind subject. Even soft shade beats harsh direct sun.',
      'Roll one continuous take of the full 90-second script as a baseline. Don\'t cut.',
      'Then re-shoot in 4 chunks: opener, Baltusrol story, what\'s inside, closing CTA. Six takes per chunk, keep the best two of each.',
      'Don\'t re-watch between takes. Watching kills momentum. Trust that one of the six will work.',
    ],
  },
  {
    number: 2,
    label: 'Screen captures, indoors',
    duration: '~45-60 min, midday',
    goal: 'Clip every route the storyboard calls for in the cleanest pass possible.',
    steps: [
      'Quiet room. Mac plugged in. Screen recording app open and tested with a 5-second throwaway clip.',
      'Go in storyboard order, not feature order. Each clip is its own take — don\'t try to chain routes in one continuous capture.',
      'When you misclick or fumble, scrub back and re-roll. Cheap.',
      'Capture B-roll pans: Member Book scroll, Member Map zoom, Open Requests strip, four-room cards on /launch. Each 8-12 seconds.',
      'After every 4-5 takes, push to AirDrop or iCloud Drive so files exist in two places.',
    ],
  },
  {
    number: 3,
    label: 'Rough cut + gap re-shoots',
    duration: '~30-45 min, afternoon',
    goal: 'Assemble enough of a cut to know what you still need.',
    steps: [
      'Drop the best baseline talking-head take into CapCut on the audio track.',
      'Drop screen captures roughly to the storyboard timestamps. Don\'t obsess over frame-perfect — just see if the pacing works.',
      'Note any moments where the screen capture doesn\'t exist or doesn\'t cut clean. Those are re-shoot candidates.',
      'Re-shoot anything missing while light and energy still hold. Don\'t leave it for tomorrow.',
      'Save the project. Do not finish the edit today. Sleep on it, finish tomorrow with fresh eyes.',
    ],
  },
]

export interface CapturePlay {
  route: string
  pageName: string
  preState: string
  move: string
  dwellSeconds: string
  hide: string
  cursorHighlight: string
}

export const SCREEN_CAPTURE_PLAYBOOK: CapturePlay[] = [
  {
    route: '/',
    pageName: 'Landing',
    preState: 'Fresh page load. Curtain animation hasn\'t played yet. Cursor parked at top-left corner of the frame.',
    move: 'Press record. Wait 1s. Let the curtain lift. Hold on the wordmark for 2s. Slow scroll halfway down the hero. Stop.',
    dwellSeconds: '~6 seconds total',
    hide: 'NavBar dropdown (you\'re signed in as founder, so the dropdown reveals admin links if hovered).',
    cursorHighlight: 'no',
  },
  {
    route: '/launch',
    pageName: 'Launch page',
    preState: 'Page loaded, scrolled to top. Cursor parked outside the hero.',
    move: 'Slow scroll from hero through the founder note. Pause 1s on the four-room cards. Keep scrolling to the access steps. Stop.',
    dwellSeconds: '~10 seconds total',
    hide: 'Your own face avatar in NavBar (sign out first or use the second Chrome profile).',
    cursorHighlight: 'yes (use it to draw the eye to "Ask. Meet. Play. Gather.")',
  },
  {
    route: '/player',
    pageName: 'Clubhouse home',
    preState: 'Signed in as a regular member. Page fully loaded. No notification toasts on screen.',
    move: 'Slow vertical pan from top to about 60% of the page. Don\'t scroll all the way down — you want the feeling of "more under the surface".',
    dwellSeconds: '~5 seconds',
    hide: 'Any captain-only admin chips, your own profile photo if you don\'t want it identifiable.',
    cursorHighlight: 'no',
  },
  {
    route: '/member-book',
    pageName: 'Member Book',
    preState: 'Page loaded with the hero in view. Stats plaque visible.',
    move: 'Slow scroll down through the year-range plaque, then through 2 rows of member cards. Hover on YOUR OWN card for 1.5s.',
    dwellSeconds: '~8 seconds',
    hide: 'Real alumni names you haven\'t cleared. Don\'t linger on any single non-yours card.',
    cursorHighlight: 'yes (highlight the year-range plaque)',
  },
  {
    route: '/member-map',
    pageName: 'Member Map',
    preState: 'US map loaded. No state list expanded. Cursor parked outside the map.',
    move: 'Pan slowly from Northeast westward across the map. Click on Pennsylvania (your home state). Let the state list open.',
    dwellSeconds: '~7 seconds',
    hide: 'Same — names in the state list that aren\'t pre-cleared. Scroll past, don\'t pause.',
    cursorHighlight: 'yes',
  },
  {
    route: '/ask',
    pageName: 'Guided Ask',
    preState: 'Ask flow open. Step 1 (purpose chips) showing.',
    move: 'Click "Career advice". Wait for step 2 to render. Show the templated message preview. Do NOT click send.',
    dwellSeconds: '~6 seconds',
    hide: 'The actual recipient if you\'re pretending to send to someone real. Stop short of the recipient picker if needed.',
    cursorHighlight: 'yes (point at "Career advice" before clicking)',
  },
  {
    route: '/the-course',
    pageName: 'The Course',
    preState: 'Page loaded. Open Requests strip showing your seeded round request. Open to a Round section visible below.',
    move: 'Slow scroll past the strip, dwell 1.5s on your seeded card, continue down to the Open to a Round grid.',
    dwellSeconds: '~6 seconds',
    hide: 'Other members\' real names — dwell on your own seeded card, not someone else\'s.',
    cursorHighlight: 'yes',
  },
  {
    route: '/19th-hole',
    pageName: '19th Hole',
    preState: 'Open Requests strip visible. Gatherings list below.',
    move: 'Scroll through the strip, dwell 1.5s on the seeded coffee request, continue to Open to Coffee.',
    dwellSeconds: '~5 seconds',
    hide: 'Same — your seeded entries only.',
    cursorHighlight: 'yes',
  },
  {
    route: '/moments',
    pageName: 'Moments',
    preState: 'Photo wall loaded with your seeded posts visible.',
    move: 'Scroll 2-3 cards at a measured pace. Hover on one photo for 1s.',
    dwellSeconds: '~5 seconds',
    hide: 'Photos of other people if not cleared. Use only your own seeded ones for safety.',
    cursorHighlight: 'no',
  },
  {
    route: '/team-room',
    pageName: 'Team Room',
    preState: 'Page loaded. Penn Athletics news strip and roster visible.',
    move: 'Slow scroll past the news strip, pause 1s on the roster card.',
    dwellSeconds: '~5 seconds',
    hide: 'Nothing in particular — this page is safe.',
    cursorHighlight: 'no',
  },
  {
    route: '/support',
    pageName: 'Support',
    preState: 'Page loaded. Tier cards visible.',
    move: 'Slow pan across the tier cards. Do not scroll into the donation form.',
    dwellSeconds: '~4 seconds',
    hide: 'Your own real billing status if it shows.',
    cursorHighlight: 'no',
  },
]

export interface TalkingHeadRule {
  label: string
  body: string
}

export const TALKING_HEAD_PLAYBOOK: TalkingHeadRule[] = [
  {
    label: 'Framing',
    body: 'Rule of thirds: your eyes on the upper third of frame, small headroom above. Shoulders in frame, mid-chest crop. Landscape orientation, never vertical for the main cut.',
  },
  {
    label: 'Eye line',
    body: 'Look directly into the lens, not at your phone\'s preview screen. Stick a small piece of tape right next to the lens as your eye-line target. Looking at your own face on screen reads as distracted.',
  },
  {
    label: 'Audio',
    body: 'Lavalier mic clipped under your shirt collar, cable run inside the shirt down to the transmitter in your back pocket. iPhone built-in mic as backup. Record audio on both devices, sync in post.',
  },
  {
    label: 'Lighting',
    body: 'Large soft light source 45° off to camera-left, neutral wall behind. If outdoors at golden hour: sun behind the camera, not behind you. Backlight makes your face a silhouette.',
  },
  {
    label: 'Takes',
    body: 'Six takes per chunk. Don\'t watch between takes — that\'s a momentum killer. Just keep rolling. The keeper is usually take 3-5, after you\'ve loosened up and before you\'re tired of the line.',
  },
  {
    label: 'Cutaways to plan for',
    body: 'B-roll you can drop in to cover edits: hands resting on a golf club, a leather bag tag, the Penn campus, a chalkboard, a scorecard on a clubhouse table. These let you trim filler words invisibly.',
  },
  {
    label: 'Energy',
    body: 'Smile before you start each take. Talk a touch louder and slower than feels natural. The camera flattens energy — what feels like 80% in person reads as 60% on camera.',
  },
]

export interface ToolCompare {
  tool: string
  cost: string
  bestFor: string
  watchOut: string
  pickIf: string
}

export const TOOL_COMPARISON: ToolCompare[] = [
  {
    tool: 'Screen Studio',
    cost: '$30 one-time (Mac)',
    bestFor: 'Polished launch videos. Automatic cursor zoom and smoothing make every clip look professional out of the box.',
    watchOut: 'Mac only. Worth the $30 if this is the main launch asset.',
    pickIf: 'You want the cleanest output with the least edit work. Recommended first pick.',
  },
  {
    tool: 'QuickTime',
    cost: 'Free (Mac built-in)',
    bestFor: 'Raw clean captures. Cmd-Shift-5 then "Record selected portion" gives you a precise window.',
    watchOut: 'No cursor highlight or smoothing. You add cursor zoom in CapCut afterwards if you want polish.',
    pickIf: 'Skipping the $30. The whole flow still works, just adds 20 min of CapCut work per clip.',
  },
  {
    tool: 'Loom',
    cost: 'Free tier',
    bestFor: 'Quick narrated walkthroughs where you talk over your screen live.',
    watchOut: 'Compression. Not ideal source footage for a cut you\'re going to edit into a polished video.',
    pickIf: 'You want a "raw director\'s walkthrough" version as a separate asset. Not for the main launch.',
  },
  {
    tool: 'OBS',
    cost: 'Free',
    bestFor: 'Multi-source production with scenes, transitions, live overlays.',
    watchOut: 'Setup tax is real. You\'ll spend an hour configuring scenes before you record anything.',
    pickIf: 'You\'ve used it before. Otherwise skip — it\'s overkill for v1.',
  },
]

export interface PostProductionStep {
  label: string
  body: string
}

export const POST_PRODUCTION_LAYOUT: PostProductionStep[] = [
  {
    label: 'Project settings',
    body: '1920×1080, 30 fps, target 90 seconds. Render preset H.264 / AAC. Square crop (1080×1080) and vertical (1080×1920) get rendered as separate exports after the master is locked.',
  },
  {
    label: 'Track 1 — Voice (master)',
    body: 'The best talking-head take, top to bottom. This is the spine of the cut. Trim breaths and filler words ("um", "like", long pauses) using the razor tool.',
  },
  {
    label: 'Track 2 — Screen captures',
    body: 'Clips placed to the storyboard timestamps. Use J-cuts: the screen cap arrives ~10 frames before the voice line that introduces it.',
  },
  {
    label: 'Track 3 — B-roll cutaways',
    body: 'Hand-on-club, bag tag, campus shots. Use these to cover edits in the talking head so the cut is invisible. 1-2 second clips.',
  },
  {
    label: 'Track 4 — Music',
    body: 'Tasteful instrumental at -20 dB. Duck to -28 dB whenever voice is present (CapCut\'s "Auto Volume" handles this if turned on). Music starts on the title card and runs through the end.',
  },
  {
    label: 'Track 5 — Captions',
    body: 'Penn navy text (#0a1628) on parchment background (#f8f5f0), bottom third of frame, 2 lines max. Auto-caption then proofread every word. The captions are what people read on muted autoplay.',
  },
]

export const POST_PRODUCTION_REVIEW_PASSES: string[] = [
  'Pass 1 — Pacing only. Mute the audio entirely. Watch the cut. Anything that lingers too long or jumps too fast jumps out without dialogue to distract.',
  'Pass 2 — Audio only. Close your eyes. Listen end to end. Trim every breath, every "um", every soft pause. Voice should sound conversational, not edited.',
  'Pass 3 — Captions + final color. Match exposure across talking-head and screen captures (screen captures usually need a slight desaturation). Proofread every caption frame.',
]

export const COMMON_MISTAKES: string[] = [
  'Don\'t show real alumni names on screen without explicit permission. Linger on your own Member Book card, not someone else\'s.',
  'Don\'t show captain or founder admin surfaces. /internal/*, /internal/launch-kit, /internal/claims must never appear in the cut.',
  'Don\'t film vertically by accident. Lock the iPhone in landscape orientation. Vertical 9:16 is a separate render, not the source.',
  'Don\'t move the cursor on every word. Cursor motion is punctuation, not a constant. Move it to draw the eye to one thing per scene, then park it.',
  'Don\'t auto-caption and skip proofreading. Auto-captions get names and Penn-specific terms wrong. Read every line before exporting.',
  'Don\'t forget 1 second of black at the start and end. Instagram and TikTok clip the first and last beats — give the CTA room to breathe.',
]

