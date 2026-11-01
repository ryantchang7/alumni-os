/**
 * Captain identification. Captains can see /internal/claims and approve
 * pending profile-claim requests. For now this is a hard-coded list of
 * email addresses keyed by team slug — future iteration would store
 * captain flags on the Account row.
 */

// Captain notification recipients. Add a new captain here to grant
// internal access AND start sending them claim/digest emails. Ryan
// prefers Penn email for captain mail — the Gmail address stays in
// FOUNDER_EMAILS (src/lib/badges/index.ts) so it still gets Founder
// badge + Founding Member recognition if it ever signs in.
const CAPTAIN_EMAILS_BY_TEAM: Record<string, string[]> = {
  'penn-mens-golf': [
    'rtchang@sas.upenn.edu',
  ],
  // Penn Women's Golf went live 2026-10-31. Whoever runs the women's side
  // gets added here and immediately has the same powers over their own
  // program that the men's captain has over his: approve claims for
  // penn-womens-golf, and receive those claim and digest emails. Access is
  // per team slug, so a women's captain never sees men's claims.
  //
  // Empty on purpose. Ryan said he would have someone from the women's side
  // run theirs; this is the one line that grants it, and it needs their
  // email address.
  'penn-womens-golf': [],
}

export function isCaptain(email: string | null | undefined, teamSlug: string): boolean {
  if (!email) return false
  const list = CAPTAIN_EMAILS_BY_TEAM[teamSlug] ?? []
  return list.includes(email.toLowerCase().trim())
}

export function getCaptainEmails(teamSlug: string): string[] {
  return CAPTAIN_EMAILS_BY_TEAM[teamSlug] ?? []
}
