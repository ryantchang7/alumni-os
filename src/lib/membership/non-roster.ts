/**
 * The Clubhouse has two kinds of member: people who appear on a Penn
 * roster, and everyone else.
 *
 * "Everyone else" was built for parents, so every label said "Family &
 * Affiliate" and the signup form required a "relationship to the
 * program" — which quietly told the largest group of all, Penn people
 * who play golf but never played for Penn, that the door was not theirs.
 * The plumbing already welcomed them: they can post, show on the Member
 * Map, and opt into Open to a Round. Only the words turned them away.
 *
 * Storage still writes memberRole: 'parent' for all of them. The role is
 * the bucket, not the description; the free-text line on each card does
 * the describing. Splitting the enum would mean touching every branch
 * that filters on 'parent' across the map, the course, the book, Ask,
 * career posts and the internal panels, and anyone missed would silently
 * vanish from a tab or a count.
 *
 * One label, one blurb, one path, defined here so a rename is one edit.
 */

export const NON_ROSTER_LABEL = 'Golfers & Family'

/** One line describing who belongs in the bucket. */
export const NON_ROSTER_BLURB =
  'Penn alumni and students who play golf, plus the families and friends of the program.'

/** The shareable door. /parent-signup still renders the same form so the
 *  links already sent out keep working. */
export const JOIN_PATH = '/join'

export type JoinKind = 'golfer' | 'family' | 'friend'

export interface JoinDoor {
  kind: JoinKind
  /** Said in the first person, because the member is picking themselves. */
  label: string
  hint: string
  fieldLabel: string
  fieldHint: string
  placeholder: string
}

export const JOIN_DOORS: readonly JoinDoor[] = [
  {
    kind: 'golfer',
    label: 'I went to Penn and I play golf',
    hint: 'You were not on the team. Penn and golf are still both yours.',
    fieldLabel: 'Your class year and where you play',
    fieldHint: 'Shown on your card so members know who you are.',
    placeholder: "C'04, plays out of Merion",
  },
  {
    kind: 'family',
    label: 'I am family',
    hint: 'A parent, a spouse, a sibling of someone who played.',
    fieldLabel: 'Who you are family to',
    fieldHint: 'Shown on your card so members know who you are.',
    placeholder: "Parent of John Smith C'24",
  },
  {
    kind: 'friend',
    label: 'I am a friend of the program',
    hint: 'A supporter, a coach from elsewhere, a longtime follower.',
    fieldLabel: 'How you know Penn Golf',
    fieldHint: 'Shown on your card so members know who you are.',
    placeholder: 'Supporter since 2010',
  },
] as const

export function isJoinKind(v: unknown): v is JoinKind {
  return v === 'golfer' || v === 'family' || v === 'friend'
}

export function doorFor(kind: JoinKind): JoinDoor {
  return JOIN_DOORS.find(d => d.kind === kind) ?? JOIN_DOORS[0]
}

/** What the captain's approval email calls this signup. */
export function joinKindLabel(kind: JoinKind): string {
  switch (kind) {
    case 'golfer':
      return 'Penn Golfer'
    case 'family':
      return 'Family'
    case 'friend':
      return 'Friend of the Program'
  }
}

/** The short pill printed next to a non-roster member's name. Rows created
 *  before the door was split carry no kind, and all of those were family or
 *  affiliates, so an absent kind reads as Family. */
export function nonRosterPill(kind?: string | null): string {
  switch (kind) {
    case 'golfer':
      return 'Penn Golfer'
    case 'friend':
      return 'Friend'
    default:
      return 'Family'
  }
}
