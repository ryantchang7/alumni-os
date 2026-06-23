// Defense-in-depth for the two admin surfaces only: /builder/* and
// /internal/*. This is a fail-closed gate that redirects anyone WITHOUT a
// session cookie to /login. It is intentionally NOT the primary authz layer —
// every admin page still does its own server-side auth check (founder-email
// gate). This proxy just stops unauthenticated requests before they ever
// reach those pages.
//
// File convention: Next.js 16 renamed `middleware` → `proxy` (the old
// `middleware.ts` name is deprecated). Same runtime, same matcher semantics;
// the exported function is now `proxy`.
//
// Why a cookie-presence check instead of NextAuth's `auth` middleware:
// `src/auth.ts` runs jwt/session callbacks that touch the team-store
// (src/lib/store/local-store.ts), which imports `fs/promises` + `path`. Those
// Node-only modules are not available in the edge proxy runtime, so importing
// `auth` here would break. A cookie check needs no store access and runs
// safely at the edge. Presence ≠ validity — the page-level checks remain the
// real authorization. (Auth.js v5 names the cookie `authjs.session-token` on
// HTTP and `__Secure-authjs.session-token` on HTTPS; we accept either.)

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE_NAMES = [
  'authjs.session-token',
  '__Secure-authjs.session-token',
]

export function proxy(req: NextRequest) {
  const hasSession = SESSION_COOKIE_NAMES.some(
    (name) => req.cookies.get(name)?.value,
  )

  if (hasSession) return NextResponse.next()

  // No session cookie → bounce to /login, preserving where they were headed.
  const loginUrl = new URL('/login', req.url)
  loginUrl.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search)
  return NextResponse.redirect(loginUrl)
}

// CRITICAL: this matcher must cover ONLY the two admin trees. It deliberately
// does NOT match /api/* (e.g. /api/billing/webhook, /api/cron/*,
// /api/network/profiles, /api/member-map, /api/profile/claim), static assets,
// or any public page. Keep it this narrow.
export const config = {
  matcher: ['/builder/:path*', '/internal/:path*'],
}
