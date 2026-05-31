# Launch Runbook — Penn Golf Clubhouse

This is the operational playbook for getting the Clubhouse from
"feature-complete" to "alumni-wide live." Short on purpose. Treat it
like a pre-flight checklist.

> Live tooling: `/internal/launch-readiness` is the dashboard. It runs
> every check below as real code. This doc is for the bits that don't
> fit in a UI.

## A. Before launch

Run `npm run test:launch-smoke` first. Fix any FAIL. Then walk this
list:

### Vercel
- Set env vars in **Vercel → Project → Settings → Environment Variables**
  (Production scope):
  - `AUTH_SECRET` (`openssl rand -base64 32`)
  - `AUTH_URL` = `https://penngolfclubhouse.com`
  - `NEXT_PUBLIC_BASE_URL` = `https://penngolfclubhouse.com`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - `KV_REST_API_URL`, `KV_REST_API_TOKEN` (from Upstash → Vercel KV)
  - `RESEND_API_KEY`, `EMAIL_FROM` (e.g. `Penn Golf Clubhouse <clubhouse@penngolfclubhouse.com>`)
  - `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_FOUNDING_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
  - `BLOB_READ_WRITE_TOKEN`
  - `CRON_SECRET`
- Re-deploy after setting envs. Open `/internal/launch-readiness` and
  confirm every row reads **Ready** or has an intentional **Manual**
  badge.

### Domain
- Domain attached: `penngolfclubhouse.com` → Vercel. SSL provisioned.
- DNS A/CNAME records propagated (give it 1 hour).
- Confirm the URL in the browser bar reads `https://penngolfclubhouse.com`.

### Google OAuth
- Console → APIs & Services → Credentials → OAuth 2.0 Client.
- **Authorized JavaScript origins**: `https://penngolfclubhouse.com`
- **Authorized redirect URIs**: `https://penngolfclubhouse.com/api/auth/callback/google`
- Save. Then sign in once on production to confirm the round-trip.

### Resend
- Add `penngolfclubhouse.com` as a sending domain.
- Add the SPF + DKIM + DMARC DNS records Resend provides. Wait for
  green checkmarks.
- Inside Resend, send yourself a test email from the Penn Golf domain
  to confirm rendering.
- Then in the Clubhouse: `/internal/launch-readiness` → **Send test**.
  Confirm it lands in your inbox, not spam.

### Stripe
- Switch to **Live mode** in Stripe.
- Confirm `STRIPE_SECRET_KEY` is the live key (`sk_live_*`).
- Create the live mode products + prices for Member, Founding Member,
  Family (if shipping). Copy the price IDs into Vercel envs.
- Webhook endpoint: `https://penngolfclubhouse.com/api/billing/webhook`
- Events: `checkout.session.completed`, `customer.subscription.created`,
  `customer.subscription.updated`, `customer.subscription.deleted`.
- Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
- End-to-end: subscribe on `/support`, confirm `Account.subscription.status`
  flips to `active`, cancel, confirm it flips to `canceled`.

### Upstash KV
- `/internal/launch-readiness` → **Run roundtrip**. Latency should be
  under ~80ms from Vercel. Heartbeat reads back the same nonce.

### Vercel Blob
- Upload a 1-2 MB JPEG from `/account/profile`. Confirm the URL points
  at `*.public.blob.vercel-storage.com` and renders in the next
  refresh.

### Claim flow
- Sign in fresh in an incognito Chrome. Pick a card on `/member-book`.
  Submit a claim. Confirm a captain email lands. Approve it from
  `/internal/claims`. Confirm a welcome email lands.

### Open Request flow
- From a different account, post a Round request from `/requests/new`
  for next week, NYC, "Will cover guest fees". Confirm the strip on
  `/the-course` populates. Click **Respond** from another approved
  account, confirm the chat thread opens.

### RSVP flow
- From `/internal/gatherings`, create a Coffee gathering. Confirm it
  shows up on `/19th-hole`. RSVP as another account. Confirm host
  notification email.

### Support checkout
- Subscribe at $10 with a Stripe test card on a non-prod environment
  with the test-mode key BEFORE switching to live.
- Switch to live. Subscribe with a real card. Confirm receipt.

### Weekly digest preview
- Hit `https://penngolfclubhouse.com/api/cron/weekly-digest?preview=1`.
  Confirm the HTML renders and the counts look right.

## B. Soft launch (first 24-48 hours)

Target audience:
- The current team (group text with the 60-second cut)
- 5-10 trusted alumni (1-on-1 SMS or email, hand-picked)
- 1-2 parents/affiliates who have already expressed interest

Feedback to ask for:
- "Did the claim flow make sense?"
- "Anything that looked broken or empty?"
- "What's the first thing you wanted to do that you couldn't find?"
- "Would you have shared this with another Penn Golf alum at this stage?"

Watch:
- Vercel logs for any uncaught error
- `/internal/launch-readiness` numbers (claims, approvals, profile
  completions)
- Resend dashboard for bounces or spam complaints
- Stripe dashboard for any failed subscriptions

If anything is on fire, see "Emergency rollback" at the bottom.

## C. Alumni launch (the broader push)

When the soft launch feedback is clean:
- Send the alumni email (in `/internal/launch-kit` → Copy blocks)
- Post the 90-second launch video to LinkedIn and Instagram
- Push the team group text
- Hand-text 20-30 senior alumni who don't check email

Monitor:
- The approval queue (`/internal/claims`) — be back inside an hour
- Resend dashboard
- Open Requests strip — seed 1-2 if it goes dry

## D. First 7 days

Daily:
- Approve every pending claim within an hour during waking hours
- Post the first Round Open Request yourself if no one else has
- Post the first 19th Hole coffee request yourself if no one else has
- Encourage current players to send their first Ask
- Watch Resend deliverability — investigate any soft bounce
- Watch Stripe — confirm support conversions match what people say
  they did
- Capture any testimonial or screenshot worth keeping

Wins to count:
- Claims received
- Claims approved
- Profile completions (city, photo, openTo flags)
- Open Requests posted + responded to
- Gatherings RSVP'd
- Supporters at each tier
- Family / Affiliate signups
- Weekly active members (Vercel logs by signed-in account id)

## E. Emergency rollback

| Situation | What to do |
|---|---|
| Email is bouncing / spam | Pause weekly digest cron in Vercel. Pull the alumni email until DKIM is resolved. |
| Stripe webhook is failing | Disable Subscribe CTAs from `/internal/studio` (override `support.hero-blurb` to "Support is temporarily offline. Hang tight."). |
| Claim queue is too big | From `/internal/studio`, change `account-setup` empty-state copy to "Claims paused for a day while we catch up." |
| A specific page is broken | Revert the last commit from Vercel's deployments tab. |
| Wrong data is on the home page | `/internal/studio` → edit the slot → save. No deploy needed. |
| KV is down | Don't accept new claims until back up. Vercel logs will show the error pattern. |

## F. Who knows what

- **Founder** (Ryan): everything
- **Captain successors** (set in `/internal/roles`): claim approval,
  gathering management, Studio edits
- **Resend account owner**: domain verification, sending limits
- **Stripe account owner**: payouts, refund decisions
- **Upstash account owner**: KV backups

If Ryan is unavailable for a week, the next captain can keep the
Clubhouse running by approving claims and editing Studio copy. Code
changes wait.
