/**
 * RETIRED 2026-10-18, kept as a record of why.
 *
 * This fired a full season sync after a Team Room render whenever the news
 * looked stale: fetch the RSS, read the store, write the store. It was added
 * as insurance because nobody could prove the hourly cron was running.
 *
 * The cron is running. It proved itself by failing loudly every hour on the
 * hour when the database was suspended, which is the evidence that was
 * missing all along.
 *
 * Meanwhile this was doing real damage. The store lives under one Redis key,
 * so each pass downloaded and rewrote the whole blob, on page views, with
 * compare-and-swap retries on top. That is bandwidth spent to duplicate work
 * the cron already does, and the free tier's 10 GB ran out mid-week with
 * alumni arriving.
 *
 * If a manual catch-up is ever wanted again, hit /api/cron/season-sync while
 * signed in as founder. Do not reattach work to page renders.
 */

export {}
