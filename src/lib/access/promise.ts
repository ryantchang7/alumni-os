/**
 * One source of truth for the promises we make about joining.
 *
 * These strings appeared in four contradictory versions across the site
 * ("same-day" on /launch, "within a day or two" in three other places,
 * nothing at all in the email and on /login and /account/setup). A skeptical
 * alum reads several of these surfaces in one sitting, so they have to agree.
 *
 * The approver phrasing is deliberately person-neutral: the product used to
 * say "the captain" while the launch email said "I approve every member
 * myself". Ryan reviews the claims and isn't the captain, so neither was
 * right everywhere.
 */

/** What happens after you claim, in one sentence fragment. */
export const APPROVAL_PROMISE = 'Reviewed by hand, usually within a day.'

/** Sentence-fragment form for inline use ("...approved by hand, usually within a day"). */
export const APPROVER_PHRASE = 'Every claim is reviewed by hand'

/** The address on product surfaces. Matches the inbox that receives claim mail. */
export const SUPPORT_EMAIL = 'rtchang@sas.upenn.edu'
