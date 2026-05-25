# Deployment Guide

## Live URL

https://alumni-os.vercel.app

## How deploys work

Every push to `main` triggers a GitHub Actions workflow (`.github/workflows/deploy.yml`) that runs `vercel --prod`. The Vercel token is stored as a GitHub secret: `VERCEL_TOKEN`.

## Rotating the Vercel token

Tokens expire or should be rotated after exposure. Steps:

1. Go to https://vercel.com/account/tokens
2. Delete the old token named `alumni-os-github-actions` (or whatever it was called)
3. Click **Create Token** — name it `alumni-os-github-actions`, set scope to your account, no expiry (or 1 year)
4. Copy the token value
5. Run:
   ```bash
   gh secret set VERCEL_TOKEN --repo ryantchang7/alumni-os
   ```
   Paste the token when prompted
6. Verify by pushing a commit to `main` and watching the Actions tab

## Environment variables

Set these in the Vercel dashboard under Project → Settings → Environment Variables:

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | No | Override for the app base URL |

No other secrets are needed — the app uses a local JSON store in development and `/tmp` on Vercel.

## Local development

```bash
npm install
npm run dev        # starts on http://localhost:3000
```

## Build verification

```bash
npm run build      # must pass before merging to main
npm run test:all   # runs all unit + integration tests
```
