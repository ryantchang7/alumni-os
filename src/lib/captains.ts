/**
 * Captain identification. Captains can see /internal/claims and approve
 * pending profile-claim requests. For now this is a hard-coded list of
 * email addresses keyed by team slug — future iteration would store
 * captain flags on the Account row.
 */

const CAPTAIN_EMAILS_BY_TEAM: Record<string, string[]> = {
  'penn-mens-golf': [
    'rtchang@sas.upenn.edu',
    'ryan.taylor.chang@gmail.com',
  ],
}

export function isCaptain(email: string | null | undefined, teamSlug: string): boolean {
  if (!email) return false
  const list = CAPTAIN_EMAILS_BY_TEAM[teamSlug] ?? []
  return list.includes(email.toLowerCase().trim())
}

export function getCaptainEmails(teamSlug: string): string[] {
  return CAPTAIN_EMAILS_BY_TEAM[teamSlug] ?? []
}
