# Auth Setup — Google Sign-In via Auth.js (next-auth v5)

The Clubhouse uses Google Sign-In. This is the one piece of setup that requires
your hands — creating the OAuth client + adding env vars to Vercel.

## 1. Create the Google OAuth client

1. Open the **Google Cloud Console** → https://console.cloud.google.com/
2. Create a new project (or reuse one). Project name: `Penn Golf Clubhouse`.
3. In the left sidebar: **APIs & Services** → **OAuth consent screen**.
   - User type: **External**
   - App name: `Penn Golf Clubhouse`
   - User support email: your email
   - App logo / homepage / privacy / terms: optional, can fill later
   - Scopes: leave defaults (`email`, `profile`, `openid`)
   - Test users: add your own Penn email so you can sign in while the app is in "Testing" mode
   - **Save and Continue** through each step
4. Back in the sidebar: **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth Client ID**.
   - Application type: **Web application**
   - Name: `Penn Golf Clubhouse — Web`
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `https://alumni-os.vercel.app`
     - Add any custom domains you add later
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://alumni-os.vercel.app/api/auth/callback/google`
     - Add the equivalent path on any custom domain
   - **Create**. Google shows you the **Client ID** and **Client Secret** — copy both.

## 2. Add env vars to Vercel

In the Vercel dashboard → **alumni-os project** → **Settings → Environment Variables**:

| Variable | Value | Environments |
|---|---|---|
| `GOOGLE_CLIENT_ID` | from step 1 | Production, Preview, Development |
| `GOOGLE_CLIENT_SECRET` | from step 1 | Production, Preview, Development |
| `AUTH_SECRET` | generate via `openssl rand -base64 32` or https://generate-secret.vercel.app/32 | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://alumni-os.vercel.app` | Production only |

Click **Save**. Then **Redeploy** the latest production deploy so the new env vars
take effect.

## 3. Run locally (optional)

Create `.env.local` in the project root with the same four variables:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
AUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

Then `npm run dev` and visit `http://localhost:3000/login`.

## 4. Publish the OAuth consent screen (when ready)

While the consent screen is in "Testing" mode, only the test users you added in
step 1 can sign in. When you're ready to open it to all Penn Golf alumni:

- **OAuth consent screen** → **Publish App** → confirm.
- Google may require domain verification for production (only if you ask for
  sensitive scopes; the defaults here don't trigger that).

## Notes / limits

- This setup uses **JWT sessions** (no DB session table). Sessions are signed
  cookies stored in the browser, valid 30 days. No `next-auth` adapter is wired.
- A small `accounts` array in `data/alumni-os.json` tracks who has signed in
  and which Member Book person they've claimed.
- Writes to `data/alumni-os.json` on Vercel land in `/tmp` and are not durable
  across deployments. This is the existing limitation of the local-store
  architecture; auth doesn't change it. Migrating to a real DB is a future
  Phase 3 conversation.
- One account = one Member Book person. If a user claims the wrong card,
  an admin can edit `data/alumni-os.json` and clear the `linkedPersonId` on
  their account record.
