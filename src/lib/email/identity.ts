/**
 * Who Clubhouse email comes from, and where a reply goes.
 *
 * One source of truth, deliberately in code rather than in an environment
 * variable. The sender used to come from EMAIL_FROM, which meant the
 * address people saw was set in a dashboard nobody opens: it read
 * "Ryan Chang <ryanchang@penngolfclubhouse.com>", an address that accepts
 * no inbound mail, so alumni who simply pressed Reply had their messages
 * bounce. Nothing in the repo said so, and nothing could.
 *
 * Both values below are now the only place this is decided. EMAIL_FROM is
 * no longer read.
 */

/**
 * The visible sender. A no-reply address is honest about what it is, and
 * the display name is the Clubhouse rather than a person, because these
 * are automated messages and signing them with a name invites a reply to
 * a mailbox that cannot answer.
 */
export const CLUBHOUSE_FROM = 'Penn Golf Clubhouse <noreply@penngolfclubhouse.com>'

/**
 * Where Reply actually lands. The point of the pair: the From address is
 * unmonitored and says so, while pressing Reply reaches a real person
 * without the sender having to read the footer first.
 */
export const CLUBHOUSE_REPLY_TO = 'Ryan Chang <rtchang@upenn.edu>'

/** Plain address, for footer copy and mailto links. */
export const CLUBHOUSE_REPLY_ADDRESS = 'rtchang@upenn.edu'
