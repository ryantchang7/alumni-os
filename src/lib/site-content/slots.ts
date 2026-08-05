/**
 * Captain Studio — registry of editable content slots.
 *
 * Each slot has a stable `id` (used as the KV key), a human label for the
 * Studio UI, a `kind` (text or image), and a `default` value used when no
 * captain override is set.
 *
 * To add a new editable region:
 *   1. Add an entry here.
 *   2. In the page that renders it, read the slot value with
 *      `getSiteContentOrDefault(slotId)` and fall back to a static default.
 *   3. Optional: add a `hint` string to explain context to the captain.
 */

export type SlotKind = 'text' | 'longtext' | 'image'

export interface ContentSlot {
  id: string
  label: string
  hint?: string
  kind: SlotKind
  default: string
}

export const CONTENT_SLOTS: ContentSlot[] = [
  // ── Landing splash (`/`) ─────────────────────────────────────────────────
  {
    id: 'landing.cover-image',
    label: 'Landing cover image',
    hint: 'The clubhouse photo on the splash page. Upload or paste a URL.',
    kind: 'image',
    default: '/clubhouse-cover.jpg',
  },
  {
    id: 'landing.headline',
    label: 'Landing headline',
    hint: 'The big text on the splash page.',
    kind: 'text',
    default: 'Penn Men’s Golf',
  },
  {
    id: 'landing.subtitle',
    label: 'Landing subtitle',
    hint: 'One-line tagline under the headline.',
    kind: 'text',
    default: 'The private alumni network for the program.',
  },

  // ── Clubhouse landing (`/player`) ────────────────────────────────────────
  {
    id: 'player.welcome-line',
    label: 'Clubhouse welcome line',
    hint: 'Subtitle below the Clubhouse heading on /player.',
    kind: 'text',
    default: 'Member Book, career connections, and the Penn Golf community in one place.',
  },
  {
    id: 'player.crest-image',
    label: 'Clubhouse crest / badge image',
    hint: 'Badge shown next to the Clubhouse heading on /player. Upload your Penn Golf badge here.',
    kind: 'image',
    default: '',
  },
  {
    id: '19th-hole.crest-image',
    label: '19th Hole crest / badge image',
    hint: 'Badge shown next to the 19th Hole heading. Same size as the Clubhouse crest.',
    kind: 'image',
    default: '',
  },
  {
    id: 'the-course.crest-image',
    label: 'The Course crest / badge image',
    hint: "Badge shown next to 'The Course' heading. Same size as the Clubhouse crest.",
    kind: 'image',
    default: '',
  },
  {
    id: 'member-map.crest-image',
    label: 'Member Map crest / badge image',
    hint: 'Badge shown next to the Member Map heading. Same size as the Clubhouse crest.',
    kind: 'image',
    default: '',
  },
  {
    id: 'member-book.crest-image',
    label: 'Member Book crest / badge image',
    hint: 'Badge shown next to the Member Book heading. Same size as the Clubhouse crest.',
    kind: 'image',
    default: '',
  },
  {
    id: 'career-room.crest-image',
    label: 'Career Room crest / badge image',
    hint: 'Badge shown next to the Career Room heading. Same size as the Clubhouse crest.',
    kind: 'image',
    default: '',
  },
  {
    id: 'moments.crest-image',
    label: 'Moments crest / badge image',
    hint: 'Badge shown next to the Moments heading. Same size as the Clubhouse crest.',
    kind: 'image',
    default: '',
  },
  {
    id: 'team-room.crest-image',
    label: 'Team Room crest / badge image',
    hint: 'Badge shown next to the Team Room heading. Defaults to the Quaker mascot; upload a Team Room badge to replace it.',
    kind: 'image',
    default: '/quaker-golfer.png',
  },
  {
    id: 'locker-room.crest-image',
    label: 'Locker Room crest / badge image',
    hint: 'Badge shown next to the Locker Room heading. Same size as the other crests. Players + alumni only see this surface.',
    kind: 'image',
    default: '/locker-room-crest.png',
  },
  {
    id: 'player.tradition-blurb',
    label: 'Penn Golf Tradition subtitle',
    hint: 'Small caption under the Penn Golf Tradition heading on /player.',
    kind: 'longtext',
    default: '',
  },

  // ── Team Room (`/team-room`) ─────────────────────────────────────────────
  {
    id: 'team-room.captain-note',
    label: "Captain's Note (Team Room)",
    hint: 'Note from the current captain that appears in the Team Room. Leave blank to show the default placeholder.',
    kind: 'longtext',
    default: '',
  },

  // ── The Course (`/the-course`) — the 3-stage hero flow ──────────────────
  {
    id: 'the-course.hero-blurb',
    label: 'The Course, Tee stage blurb',
    hint: 'Paragraph that appears on Stage 1 (the resting state). Default mirrors the stage-tee blurb so you can change one or both.',
    kind: 'longtext',
    default:
      'Tee times, foursomes, and home courses across the Penn Golf network. Every round here is hosted by a member.',
  },
  {
    id: 'the-course.stage-tee-blurb',
    label: 'The Course, Stage 1 (Tee) blurb',
    hint: 'Overrides hero-blurb when present. Leave blank to fall back to the hero blurb.',
    kind: 'longtext',
    default: '',
  },
  {
    id: 'the-course.stage-tee-cta',
    label: 'The Course, Stage 1 primary CTA',
    hint: 'Button label that advances to the tee sheet.',
    kind: 'text',
    default: 'Find a Round',
  },
  {
    id: 'the-course.stage-tee-secondary',
    label: 'The Course, Stage 1 secondary CTA',
    hint: 'Button label that links to /the-course/host.',
    kind: 'text',
    default: 'Host a Round',
  },
  {
    id: 'the-course.stage-sheet-blurb',
    label: 'The Course, Stage 2 (Sheet) blurb',
    hint: 'Shown on the tee sheet when rounds exist.',
    kind: 'longtext',
    default: 'Pick a round on the sheet. We’ll let the host know you’re interested.',
  },
  {
    id: 'the-course.stage-sheet-blurb-empty',
    label: 'The Course, Stage 2 (Sheet) blurb when empty',
    hint: 'Shown on the tee sheet when no rounds are posted yet.',
    kind: 'text',
    default: 'The sheet is open, no rounds posted yet.',
  },
  {
    id: 'the-course.stage-confirmed-prefix',
    label: 'The Course, Stage 3 (Confirmed) prefix',
    hint: "Text before the round title (e.g., 'You're on the sheet for {title}').",
    kind: 'text',
    default: 'You’re on the sheet for',
  },
  {
    id: 'the-course.stage-confirmed-suffix',
    label: 'The Course, Stage 3 (Confirmed) suffix',
    hint: 'Sentence after the round title.',
    kind: 'text',
    default: 'The host will be in touch.',
  },

  // ── Moments (`/moments`) ─────────────────────────────────────────────────
  {
    id: 'moments.subtitle',
    label: 'Moments hero subtitle',
    hint: 'Paragraph under the Moments title.',
    kind: 'longtext',
    default:
      'Rounds, dinners, championship cuttings, first-tee jitters, moments shared by Penn Golf members across generations.',
  },
  {
    id: 'moments.empty-headline',
    label: 'Moments empty-state headline',
    hint: 'Big text shown when the All Moments feed is empty.',
    kind: 'text',
    default: 'No moments yet.',
  },
  {
    id: 'moments.empty-blurb',
    label: 'Moments empty-state blurb',
    hint: 'Body text shown when the All Moments feed is empty.',
    kind: 'longtext',
    default:
      'Post the first one, a photo from a round, a tournament, an alumni dinner. The wall grows one moment at a time.',
  },

  // ── Locker Room (`/locker-room`) ─────────────────────────────────────────
  {
    id: 'locker-room.empty-headline',
    label: 'Locker Room empty-state headline',
    hint: 'Big text shown when the Locker Room feed is empty.',
    kind: 'text',
    default: 'Nothing in the Locker Room yet.',
  },
  {
    id: 'locker-room.empty-blurb',
    label: 'Locker Room empty-state blurb',
    hint: 'Body text shown when the Locker Room feed is empty. Players + alumni only see this surface.',
    kind: 'longtext',
    default:
      'Post the first Locker Room moment, a road trip dinner, a pre-round shot, the Penn-Princeton afterparty. Players and alumni see it. No one else.',
  },

  // ── Support / membership (`/support`) ────────────────────────────────────
  {
    id: 'support.hero-blurb',
    label: 'Support page hero blurb',
    hint: 'Paragraph under the headline on /support.',
    kind: 'longtext',
    default:
      'The Penn Golf Clubhouse is the private network for the program. 70% of every membership and contribution goes directly to Penn Men’s Golf; the remaining 30% maintains the platform. Cancel anytime.',
  },

  // ── Public launch page (`/launch`) — all the marketing copy ─────────────
  {
    id: 'launch.hero-eyebrow',
    label: '/launch, hero eyebrow',
    hint: 'Small ALL CAPS line above the title on /launch.',
    kind: 'text',
    default: "Penn Men's Golf · Clubhouse",
  },
  {
    id: 'launch.hero-subtitle',
    label: '/launch, hero subtitle (italic line)',
    hint: 'The italic line right under the big title.',
    kind: 'longtext',
    default: 'For everyone who carried the Penn Golf bag.',
  },
  {
    id: 'launch.hero-body',
    label: '/launch, hero body paragraph',
    hint: 'The longer description below the italic line.',
    kind: 'longtext',
    default:
      'A private clubhouse for Penn Golf players, alumni, family, and friends to ask for advice, meet, play rounds, gather, and stay connected to the program.',
  },
  {
    id: 'launch.tagline',
    label: '/launch, tagline pill',
    hint: 'Small pill at the bottom of the hero. Also used as a section header below.',
    kind: 'text',
    default: 'Ask. Meet. Play. Gather.',
  },
  {
    id: 'launch.video-url',
    label: '/launch, film URL (mp4)',
    hint: 'Direct mp4 URL for the launch film. Empty hides the video section. When the VO version is ready, upload the new file and paste its URL here (or update this default).',
    kind: 'text',
    default:
      'https://67u0teziiyoxeaeo.public.blob.vercel-storage.com/launch/film-v2-HYgizkqF2YZ2lmatT9arYFGikeHWXz.mp4',
  },
  {
    id: 'launch.video-poster',
    label: '/launch, film poster image URL',
    hint: 'Poster frame shown before the film plays. Usually the clubhouse photo frame.',
    kind: 'text',
    default:
      'https://67u0teziiyoxeaeo.public.blob.vercel-storage.com/launch/poster-v2-21nCY08dz79sV12vG6MNoTPmja7m4i.jpg',
  },
  {
    id: 'launch.founder-note',
    label: '/launch, founder note (long)',
    hint: 'The full personal note from Ryan that lives in the parchment card. Paragraphs separated by a blank line. The line that starts with, is treated as the signature.',
    kind: 'longtext',
    default: `Hey Penn Men's Golf family. I'm Ryan Chang, a rising junior on the team from Brookline, Massachusetts.

This spring at Ivy Champs at Baltusrol, I felt something I think a lot of you have felt. Patrick Cooper hosted us. Derek Rodgers, Carter Thompson, KJ, and so many other Penn Golf guys were out there. It wasn't a couple alumni showing up. It felt like a real Penn Golf family. Generations standing on the same range, pulling for the same program.

That's the feeling I wanted to bottle.

Golf has given me so much: opportunities, friendships, mentors, doors that opened because someone from this program took a phone call. A lot of that traces back to the people who came before us. But Penn Golf has had different coaches, classes, and generations, and the connection across all of that hasn't always been easy.

So I built Penn Golf Clubhouse.

I compiled our Member Book through online research and Penn historical data, every player and manager I could find from 1930 onward. Then I built a private space for everyone who's carried the Penn Golf bag, designed around what we actually do: ask, meet, play, gather.

For the Penn Golf family. A place to stay close, help the next group, keep playing together, and hopefully help us keep taking down Princeton and Harvard.

, Ryan Chang, Penn Men's Golf '28, Brookline, MA`,
  },
  {
    id: 'launch.ask-blurb',
    label: '/launch, Ask card blurb',
    hint: 'One-line description of the Ask room.',
    kind: 'longtext',
    default: 'Career advice, mentorship, and warm introductions without the awkward DM.',
  },
  {
    id: 'launch.meet-blurb',
    label: '/launch, Meet card blurb',
    hint: 'One-line description of the Meet room.',
    kind: 'longtext',
    default: 'Coffee, drinks, dinners, and city gatherings with the Penn Golf family.',
  },
  {
    id: 'launch.play-blurb',
    label: '/launch, Play card blurb',
    hint: 'One-line description of the Play room.',
    kind: 'longtext',
    default: 'Host a round at your home course, or find a tee time wherever you are.',
  },
  {
    id: 'launch.gather-blurb',
    label: '/launch, Gather card blurb',
    hint: 'One-line description of the Gather room.',
    kind: 'longtext',
    default: 'Events, alumni weekends, the season as it happens, and the next generation of Penn Golf.',
  },
  {
    id: 'launch.access-line',
    label: '/launch, access explanation',
    hint: 'The paragraph below "How you get in."',
    kind: 'longtext',
    default:
      'Every claim is reviewed by hand, so the Clubhouse stays the people who actually carried the bag. Find your name, claim your card, and you\'re in.',
  },
  {
    id: 'launch.closing-line',
    label: '/launch, closing line',
    hint: 'The big closing line on the dark closing CTA section.',
    kind: 'text',
    default: 'Come into the Clubhouse.',
  },

  // ── Room heroes (mostly hardcoded today) ────────────────────────────────
  {
    id: '19th-hole.hero-blurb',
    label: '19th Hole, hero blurb',
    hint: 'Paragraph under the 19th Hole title.',
    kind: 'longtext',
    default: 'Coffee, dinners, and signature Penn Golf gatherings, wherever you are.',
  },
  {
    id: 'career-room.hero-blurb',
    label: 'Career Room, hero blurb',
    hint: 'Paragraph under the Career Room title.',
    kind: 'longtext',
    default:
      'Find Penn Golf members by industry, company, and experience. Ask questions, get thoughtful advice, and help the next player when it’s your turn.',
  },
  {
    id: 'member-book.subtitle',
    label: 'Member Book, subtitle',
    hint: 'The line right under "The Member Book" headline.',
    kind: 'longtext',
    default: 'A registry of Penn Men’s Golf members, across generations.',
  },
  {
    id: 'member-book.scope-note',
    label: 'Member Book, scope note (italic)',
    hint: 'Italic line below the subtitle. Use to communicate scope (e.g., women\'s coming).',
    kind: 'text',
    default: "Penn Women's Golf coming as we bring the data in.",
  },

  // ── Login + parent signup ──────────────────────────────────────────────
  {
    id: 'login.body',
    label: 'Login page, body paragraph',
    hint: 'The paragraph under the "Sign in to the Clubhouse" heading.',
    kind: 'longtext',
    default:
      'Sign in with Google to claim your Member Book card and keep your profile up to date.',
  },
  {
    id: 'parent-signup.body',
    label: 'Parent / Family signup, body paragraph',
    hint: 'The opening paragraph on /parent-signup.',
    kind: 'longtext',
    default:
      'Parents, family, and longtime affiliates of Penn Men’s Golf can claim a card and stay close to the program.',
  },

  // ── Landing splash extras ──────────────────────────────────────────────
  {
    id: 'landing.eyebrow',
    label: 'Landing, eyebrow above title',
    hint: 'Small ALL CAPS line above the headline on /. Leave blank to hide.',
    kind: 'text',
    default: 'Welcome to the',
  },
  {
    id: 'landing.primary-cta',
    label: 'Landing, primary button label',
    hint: 'Button that goes to /player.',
    kind: 'text',
    default: 'Enter Clubhouse',
  },
  {
    id: 'landing.secondary-cta',
    label: 'Landing, secondary button label',
    hint: 'Button that goes to the claim flow.',
    kind: 'text',
    default: 'Claim Profile',
  },
  {
    id: 'landing.claim-note',
    label: 'Landing, claim note (under buttons)',
    hint: 'Small line under the buttons clarifying who can claim a profile.',
    kind: 'text',
    default: 'For alumni and current players, find your name and make it yours.',
  },
  {
    id: 'landing.family-cta',
    label: 'Landing, family / affiliate pill',
    hint: 'Pill below the buttons that links to /parent-signup.',
    kind: 'text',
    default: 'Family or affiliate? Join here →',
  },
  {
    id: 'scotland.hero-image',
    label: '/scotland, hero image',
    hint: 'Course photo behind the Scotland Tour hero. Empty = text-led hero.',
    kind: 'image',
    default: '',
  },
]

export function getSlotById(id: string): ContentSlot | undefined {
  return CONTENT_SLOTS.find(s => s.id === id)
}

export function getSlotDefault(id: string): string {
  return getSlotById(id)?.default ?? ''
}
