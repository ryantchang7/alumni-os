// Auth.js (next-auth v5) configuration for Google sign-in.
//
// Sessions are JWT-encoded cookies (no DB session table needed). We persist
// a tiny per-user record into the team-store on first sign-in via the JWT
// callback so the rest of the app can look up `accountId` + `linkedPersonId`
// from the session object.

import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import {
  getTeamBySlug,
  upsertAccount,
  upsertAccountByEmail,
  getAccountByGoogleSub,
  getAccountById,
} from '@/lib/store/local-store'
import { consumeEmailLinkToken } from '@/lib/auth/email-link'

const DEFAULT_TEAM_SLUG = 'penn-mens-golf'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // Sign-in by emailed one-time link, for members without a Google account.
    // This is not a password: the only credential is a token we minted and
    // mailed, and redeeming it proves control of that inbox and nothing more.
    Credentials({
      id: 'email-link',
      name: 'Email link',
      credentials: { token: { label: 'Token', type: 'text' } },
      async authorize(credentials) {
        const raw = typeof credentials?.token === 'string' ? credentials.token : ''
        const email = await consumeEmailLinkToken(raw)
        if (!email) return null

        const team = await getTeamBySlug(DEFAULT_TEAM_SLUG)
        if (!team) return null

        const account = await upsertAccountByEmail({ email, teamId: team.id })
        return { id: account.id, email: account.email, name: account.name ?? null }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, account, profile, user }) {
      // On initial sign-in, upsert an Account row keyed by googleSub.
      if (account?.provider === 'google' && profile) {
        const googleSub = profile.sub
        const email = profile.email
        if (googleSub && email) {
          const team = await getTeamBySlug(DEFAULT_TEAM_SLUG)
          if (team) {
            const a = await upsertAccount({
              email,
              googleSub,
              name: profile.name as string | undefined,
              image: profile.picture as string | undefined,
              teamId: team.id,
              emailVerified: profile.email_verified !== false,
            })
            token.accountId = a.id
            token.linkedPersonId = a.linkedPersonId
            token.googleSub = googleSub
          }
        }
      }

      // Email-link sign-in: authorize() already resolved the account, so the
      // only job here is to carry its id. linkedPersonId stays whatever the
      // store says, which for a brand new account is nothing, so they land on
      // the claim flow exactly like a new Google user.
      if (account?.provider === 'email-link' && user?.id) {
        token.accountId = user.id
      }

      // On every subsequent call, refresh linkedPersonId from the store so
      // a freshly-linked profile shows up without re-login. Always-fresh
      // beats stale-cached for our scale (~tens of session reads/min).
      // Keyed on the account id, which never changes; googleSub does, when an
      // email-link account is later adopted by a Google sign-in.
      const known = token.accountId as string | undefined
      const fresh = known
        ? await getAccountById(known)
        : token.googleSub
          ? await getAccountByGoogleSub(token.googleSub as string)
          : undefined
      if (fresh) {
        token.accountId = fresh.id
        token.linkedPersonId = fresh.linkedPersonId
      }
      return token
    },
    async session({ session, token }) {
      session.accountId = token.accountId as string | undefined
      session.linkedPersonId = token.linkedPersonId as string | undefined
      return session
    },
  },
})
