/**
 * One source of truth for the promises we make about joining.
 *
 * These strings appeared in four contradictory versions across the site
 * ("same-day" on /launch, "within a day or two" in three other places,
 * nothing at all in the email and on /login and /account/setup). A skeptical
 * alum reads several of these surfaces in one sitting, so they have to agree.
 *
 * It used to say "the captain", which was wrong, and then "by hand", which
 * was true but anonymous. It names Ryan now, at his request: a stranger
 * deciding whether to hand over their name trusts a person more than a
 * process, and he is in fact the person doing it.
 */

/** What happens after you claim, in one sentence fragment. */
export const APPROVAL_PROMISE = 'Reviewed by Ryan Chang, usually within a day.'

/** Sentence-fragment form for inline use ("...reviewed by Ryan Chang"). */
export const APPROVER_PHRASE = 'Every claim is reviewed by Ryan Chang'

/** The address on product surfaces. Matches the inbox that receives claim mail. */
export const SUPPORT_EMAIL = 'rtchang@sas.upenn.edu'
