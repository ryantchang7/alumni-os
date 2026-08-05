/**
 * Required + optional fields by member role. Sourced as a single
 * constant so the captain panel at /internal/requirements, future
 * onboarding emails, and any documentation can stay in lockstep.
 *
 * "Required" = what the profile editor's requiredMissing() check blocks
 * a save on. "Optional but visible" = fields that surface on other
 * members' cards when filled in. "Appears on" lists the surfaces where
 * a filled value is publicly visible.
 */

export type RoleKey = 'player' | 'alumni' | 'coach' | 'parent'

export interface RoleSection {
  key: RoleKey
  label: string
  blurb: string
  required: RequirementLine[]
  optional: RequirementLine[]
}

export interface RequirementLine {
  field: string
  /** Plain-English description of what the captain / member should know. */
  note?: string
  /** Surfaces where a filled value is publicly visible. */
  appearsOn?: string[]
}

const COMMON_REQUIRED: RequirementLine[] = [
  {
    field: 'Where you live now (city + state)',
    appearsOn: ['Member Book card', 'Member Map state list', 'Career Room card'],
  },
  {
    field: 'Current role',
    appearsOn: ['Member Book card', 'Career Room card', '/player/alumni/[id] detail'],
  },
  {
    field: 'Company',
    appearsOn: ['Member Book card', 'Career Room card', '/player/alumni/[id] detail'],
  },
  {
    field: 'Industries (at least one)',
    note: 'Used by the Career Room "Explore by Industry" tiles + /member-book?industry= filter.',
    appearsOn: ['Career Room industry filter', 'Member Book industry filter'],
  },
  {
    field: 'A contact method (email, phone, or LinkedIn)',
    note: 'At least one must be set so other members can reach you.',
    appearsOn: ['/player/alumni/[id] detail (visible to signed-in viewers only)'],
  },
]

const PLAYER_ALUMNI_COACH_REQUIRED: RequirementLine[] = [
  {
    field: 'Hometown',
    appearsOn: ['Member Map hometown lens', '/player/alumni/[id] detail'],
  },
  ...COMMON_REQUIRED,
  {
    field: 'Home course, OR, "I\'m not a member at a course"',
    note: 'The opt-out checkbox suppresses the required check for members without a club affiliation.',
    appearsOn: ['/the-course "Where Penn Golf plays" (Course Roll)', '/player/alumni/[id] detail'],
  },
  {
    field: 'Handicap',
    note: 'Free text, numeric ("12.4"), "Scratch", or "Beginner / Learning". Buckets feed the /the-course "Players around your level" section.',
    appearsOn: ['/the-course Open to a Round card', '/19th-hole Open to Coffee card', '/the-course "Players around your level"'],
  },
]

const PLAYER_ALUMNI_COACH_OPTIONAL: RequirementLine[] = [
  {
    field: 'High school, class label, roster years',
    note: 'Read-only from the program record. Edited by the captain in /internal/current-roster.',
    appearsOn: ['Member Book card', '/player/alumni/[id] detail'],
  },
  {
    field: 'Favorite courses',
    appearsOn: ['/the-course Open to a Round card', '/the-course Course Roll'],
  },
  {
    field: 'Favorite Penn Golf memory',
    appearsOn: ['/player/alumni/[id] detail'],
  },
  {
    field: 'On the Loop (city + state + date window)',
    note: 'Passing through somewhere. Auto-hides when the end date passes.',
    appearsOn: ['/player (Clubhouse) On the Loop strip'],
  },
  {
    field: 'Bio, interests, photo',
    appearsOn: ['/player/alumni/[id] detail', 'Member Book card photo'],
  },
  {
    field: 'How I can help (topics) + contact preference',
    appearsOn: ['/player/alumni/[id] detail (alumni only, current players hide this)'],
  },
  {
    field: 'Open-to toggles (round / coffee / mentorship / warm intros)',
    note: 'Boolean opt-ins surfaced on /the-course, /19th-hole, /career-room. Members can also use these toggles to opt out and disappear from the lists.',
    appearsOn: ['/the-course Open to a Round', '/19th-hole Open to Coffee', '/career-room Mentorship / Warm Intros / Coffee'],
  },
  {
    field: 'Visible-to-players toggle',
    note: 'When off, the member is hidden across all the discovery surfaces. They keep their card but disappear from lists.',
  },
]

const PARENT_REQUIRED: RequirementLine[] = [...COMMON_REQUIRED]

const PARENT_OPTIONAL: RequirementLine[] = [
  {
    field: 'Photo',
    appearsOn: ['Member Book Family & Affiliate card'],
  },
  {
    field: 'Bio',
    appearsOn: ['/player/alumni/[id] detail'],
  },
  {
    field: 'Parent relationship line',
    note: 'Filled at /parent-signup ("Parent of John Smith C\'24"). Read-only on the editor; surfaces on every Family card.',
    appearsOn: ['Member Book Family & Affiliate card', '/member-map per-state Family group', '/player/alumni/[id] detail banner'],
  },
  {
    field: 'Contact fields (email, phone, LinkedIn)',
    appearsOn: ['/player/alumni/[id] detail (visible to signed-in viewers only)'],
  },
  {
    field: 'Open-to toggles + On the Loop trip',
    note: 'Parents may opt into coffee or post a trip when visiting. The Open Requests board on /the-course + /19th-hole is also available to them.',
  },
  {
    field: 'Golf section (home course + favorites)',
    note: 'Open to family/affiliates but never required. Favorite Penn Golf memory + Handicap are hidden for parents.',
    appearsOn: ['/the-course Course Roll (when home/favorite courses are set)'],
  },
  {
    field: 'Visible-to-players toggle',
    note: 'Same hide-self effect as for players.',
  },
]

export const ROLE_SECTIONS: RoleSection[] = [
  {
    key: 'player',
    label: 'Current Player',
    blurb:
      'On the active roster. Created by the captain via /internal/add-member or /internal/current-roster; surfaces on /team-room as well as the general member discovery lists.',
    required: PLAYER_ALUMNI_COACH_REQUIRED,
    optional: PLAYER_ALUMNI_COACH_OPTIONAL,
  },
  {
    key: 'alumni',
    label: 'Alumni',
    blurb:
      'Penn Golf graduates with a Member Book card. The largest audience, all alumni-facing surfaces target this role.',
    required: PLAYER_ALUMNI_COACH_REQUIRED,
    optional: PLAYER_ALUMNI_COACH_OPTIONAL,
  },
  {
    key: 'coach',
    label: 'Coach',
    blurb:
      'Treated as alumni-equivalent across the discovery surfaces but called out with a "Coach" pill on the Member Book card and a dedicated "Coaching Staff" block on /team-room.',
    required: PLAYER_ALUMNI_COACH_REQUIRED,
    optional: PLAYER_ALUMNI_COACH_OPTIONAL,
  },
  {
    key: 'parent',
    label: 'Family & Affiliate',
    blurb:
      'Family, parents, and longtime affiliates. Signs up via /parent-signup; captain approves. Hidden from /the-course Open to a Round (rounds default to alumni + players) but visible in the Member Book Family tab, Member Map Family subtab, and the Open Requests board on both /the-course and /19th-hole if they choose to post.',
    required: PARENT_REQUIRED,
    optional: PARENT_OPTIONAL,
  },
]
