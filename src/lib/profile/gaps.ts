/**
 * What is missing from a member's card, and what each missing piece costs
 * them. One definition so the Sunday digest and the Member Book nudge never
 * drift apart, and so the reason is attached to the field rather than
 * invented at each call site.
 *
 * Measured 2026-11-07: 36 members had claimed a card and 9 had saved a
 * location. The nudge in place at the time said the card was "what another
 * member sees before they decide whether to reach out", which is true and
 * persuaded almost nobody, because it describes a feeling rather than a
 * consequence. These lines name the consequence instead.
 *
 * Note what is deliberately NOT claimed any more: that an empty card means
 * missing out on rounds. Until today the geographic filter meant exactly
 * that, but posts now widen to the whole club while the club is small (see
 * widenReach in @/lib/gatherings/nearby), so everyone hears everything
 * regardless. Saying otherwise would be a threat the product no longer
 * carries out.
 */

export type GapKey = 'role' | 'city' | 'photo' | 'bio'

export interface ProfileGap {
  key: GapKey
  /** Named in a list: "missing a photo, your city and ..." */
  label: string
  /** One clause saying what filling it in actually does. Reads after the
   *  list, as its own sentence, so it starts with a capital. */
  why: string
}

/**
 * Ordered by what it costs to leave blank, most first. The digest and the
 * nudge both lead with the top missing one.
 */
export const PROFILE_GAPS: readonly ProfileGap[] = [
  {
    key: 'role',
    label: 'what you do now',
    why: 'That is how a member looking for an intro in your field finds you.',
  },
  {
    key: 'city',
    label: 'your city',
    why: 'That is how a member passing through your town knows to ask you.',
  },
  {
    key: 'photo',
    label: 'a photo',
    why: 'A card with a face on it is the difference between a name and a person.',
  },
  {
    key: 'bio',
    label: 'a line about yourself',
    why: 'One line gives another member somewhere to start.',
  },
] as const

/** Which gaps are open, in priority order. */
export function openGaps(filled: Partial<Record<GapKey, boolean>>): ProfileGap[] {
  return PROFILE_GAPS.filter(g => !filled[g.key])
}

/** "a photo, your city and a line about yourself" */
export function gapList(gaps: readonly ProfileGap[]): string {
  const labels = gaps.map(g => g.label)
  if (labels.length === 0) return ''
  if (labels.length === 1) return labels[0]
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`
}

/** The reason to care, taken from the most consequential missing piece. */
export function gapReason(gaps: readonly ProfileGap[]): string {
  return gaps.length > 0 ? gaps[0].why : ''
}
