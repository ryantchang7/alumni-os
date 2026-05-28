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
    label: 'The Course — Tee stage blurb',
    hint: 'Paragraph that appears on Stage 1 (the resting state). Default mirrors the stage-tee blurb so you can change one or both.',
    kind: 'longtext',
    default:
      'Tee times, foursomes, and home courses across the Penn Golf network. Every round here is hosted by a member.',
  },
  {
    id: 'the-course.stage-tee-blurb',
    label: 'The Course — Stage 1 (Tee) blurb',
    hint: 'Overrides hero-blurb when present. Leave blank to fall back to the hero blurb.',
    kind: 'longtext',
    default: '',
  },
  {
    id: 'the-course.stage-tee-cta',
    label: 'The Course — Stage 1 primary CTA',
    hint: 'Button label that advances to the tee sheet.',
    kind: 'text',
    default: 'Find a Round',
  },
  {
    id: 'the-course.stage-tee-secondary',
    label: 'The Course — Stage 1 secondary CTA',
    hint: 'Button label that links to /the-course/host.',
    kind: 'text',
    default: 'Host a Round',
  },
  {
    id: 'the-course.stage-sheet-blurb',
    label: 'The Course — Stage 2 (Sheet) blurb',
    hint: 'Shown on the tee sheet when rounds exist.',
    kind: 'longtext',
    default: 'Pick a round on the sheet. We’ll let the host know you’re interested.',
  },
  {
    id: 'the-course.stage-sheet-blurb-empty',
    label: 'The Course — Stage 2 (Sheet) blurb when empty',
    hint: 'Shown on the tee sheet when no rounds are posted yet.',
    kind: 'text',
    default: 'The sheet is open — no rounds posted yet.',
  },
  {
    id: 'the-course.stage-confirmed-prefix',
    label: 'The Course — Stage 3 (Confirmed) prefix',
    hint: "Text before the round title (e.g., 'You're on the sheet for {title}').",
    kind: 'text',
    default: 'You’re on the sheet for',
  },
  {
    id: 'the-course.stage-confirmed-suffix',
    label: 'The Course — Stage 3 (Confirmed) suffix',
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
      'Rounds, dinners, championship cuttings, first-tee jitters — moments shared by Penn Golf members across generations.',
  },
  {
    id: 'moments.empty-headline',
    label: 'Moments empty-state headline',
    hint: 'Big text shown when the All Moments feed is empty.',
    kind: 'text',
    default: 'Bag’s empty.',
  },
  {
    id: 'moments.empty-blurb',
    label: 'Moments empty-state blurb',
    hint: 'Body text shown when the All Moments feed is empty.',
    kind: 'longtext',
    default:
      'Drop the first one. A photo from a round, a tournament, an alumni dinner. The wall grows one moment at a time.',
  },

  // ── Locker Room (`/locker-room`) ─────────────────────────────────────────
  {
    id: 'locker-room.empty-headline',
    label: 'Locker Room empty-state headline',
    hint: 'Big text shown when the Locker Room feed is empty.',
    kind: 'text',
    default: 'Locker’s empty.',
  },
  {
    id: 'locker-room.empty-blurb',
    label: 'Locker Room empty-state blurb',
    hint: 'Body text shown when the Locker Room feed is empty. Players + alumni only see this surface.',
    kind: 'longtext',
    default:
      'Drop the first Locker Room post — a road trip dinner, a pre-round shot, the Penn-Princeton afterparty. Players + alumni see it. No one else.',
  },

  // ── Support / membership (`/support`) ────────────────────────────────────
  {
    id: 'support.hero-blurb',
    label: 'Support page hero blurb',
    hint: 'Paragraph under the headline on /support.',
    kind: 'longtext',
    default:
      'The Penn Golf Clubhouse is the private alumni network for the program. 70% of every membership and contribution goes directly to Penn Men’s Golf; the remaining 30% maintains the platform. Cancel anytime.',
  },
]

export function getSlotById(id: string): ContentSlot | undefined {
  return CONTENT_SLOTS.find(s => s.id === id)
}

export function getSlotDefault(id: string): string {
  return getSlotById(id)?.default ?? ''
}
