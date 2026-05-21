# Storage Setup — Make Profile Edits Stick

Until you do this, every profile edit on the live site **disappears on the
next deployment.** This is the single most important infra step for the
Clubhouse to feel like a real product.

## Why

`data/alumni-os.json` is bundled with the deployment and the Vercel
filesystem is read-only. The current fallback writes to `/tmp`, which
Vercel wipes on every deploy and roughly every hour of idle. That's why
your "I work at Goldman" edit didn't stick.

Connecting **Vercel KV** (Upstash Redis) gives the app a real persistent
store. ~3 minutes of setup.

## 1. Connect Vercel KV (Upstash) to the project

1. Open https://vercel.com/dashboard → click into your `alumni-os` project.
2. **Storage** tab (in the project's top nav).
3. Click **Create Database** → pick **KV (powered by Upstash)** → **Continue**.
4. Region: pick one near your users (e.g. `iad1` Washington DC for east coast).
5. Database name: `alumni-os-kv` (anything works).
6. Click **Create**.
7. On the connect screen, leave the env-var prefix as default (`KV_`) and
   make sure **Production, Preview, and Development** are checked.
8. Click **Connect**.

That step automatically adds these env vars to your project:

| Variable | Purpose |
|---|---|
| `KV_REST_API_URL` | Upstash REST endpoint for our DB |
| `KV_REST_API_TOKEN` | Read/write token |
| `KV_REST_API_READ_ONLY_TOKEN` | (unused by us) |
| `KV_URL` | (unused by us) |

## 2. Redeploy

In the project's **Deployments** tab, click the three-dot menu on the
latest production deployment → **Redeploy**. The new deployment will pick
up the env vars and start using Redis on first request.

On that first request, the bundled `data/alumni-os.json` gets seeded into
the Redis key `alumni-os:store:v1`. Every subsequent edit reads and writes
to Redis instead of `/tmp`. Edits now persist across deploys, cold starts,
and time.

## 3. Verify

1. Sign in via Google (you'll need `AUTH_SETUP.md` done first).
2. Edit your profile (`/alumni/profile/[id]`) — set role to "Founding Partner",
   change the city, save.
3. Hard-refresh. The values stay.
4. Click "Redeploy" on the latest deploy. The values still stay.

## Running locally

For local dev, the app falls back to writing `data/alumni-os.json` directly
(same as before). No setup needed for `npm run dev`.

If you want to test the Redis path locally:

```bash
# Pull the Vercel env vars into .env.local
npx vercel env pull .env.local

# Restart dev
npm run dev
```

## Free-tier limits

Vercel KV's Hobby tier covers:
- 30K commands/day (we use ~2-3 commands per request — plenty)
- 256 MB storage (we use < 1 MB)
- 256 KB max single value (the entire JSON store is ~150 KB right now —
  we're within budget for at least 10x growth)

The free tier is enough for the foreseeable future. If you ever blow
through 30K daily commands, that's when this product has succeeded
spectacularly.

## When Redis isn't enough

We currently store the entire JSON blob under one key and read/write it as
a unit. Two consequences:

1. **Last-write-wins** on concurrent writes. With tens of users editing
   their own profiles, collisions are rare and the loss is small (one
   user's last field). Not catastrophic.
2. **All-or-nothing read on every request.** 150 KB JSON per request is
   fine; if the store grows past ~1 MB consider a real Postgres migration
   so we can query per record.

Both are deferred Phase 4 concerns, not blockers.
