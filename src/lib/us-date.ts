/**
 * Calendar "today" (yyyy-mm-dd) in US Eastern time.
 *
 * Member-entered dates (trip windows, open-request endDates) are US-local
 * calendar dates. Comparing them to UTC "today" expired things hours early:
 * at 8pm ET on July 2 it is already July 3 UTC, so a request "through
 * July 2" vanished during the exact evening window it was posted for.
 * en-CA locale formats as YYYY-MM-DD, matching the stored ISO date shape.
 */
export function usEasternToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}
