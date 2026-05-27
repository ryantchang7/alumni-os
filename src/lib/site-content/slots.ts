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
