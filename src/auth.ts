// Auth.js (next-auth v5) configuration for Google sign-in.
//
// Sessions are JWT-encoded cookies (no DB session table needed). We persist
// a tiny per-user record into the team-store on first sign-in via the JWT
// callback so the rest of the app can look up `accountId` + `linkedPersonId`
// from the session object.

import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import {
  getTeamBySlug,
  upsertAccount,
  getAccountByGoogleSub,
} from '@/lib/store/local-store'

const DEFAULT_TEAM_SLUG = 'penn-mens-golf'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
    async jwt({ token, account, profile }) {
      // On initial sign-in, upsert an Account row keyed by googleSub.
      if (account && profile) {
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
            })
            token.accountId = a.id
            token.linkedPersonId = a.linkedPersonId
            token.googleSub = googleSub
          }
        }
      }
      // On subsequent requests, refresh linkedPersonId from the store so
      // a freshly-linked profile shows up without re-login.
      if (!token.linkedPersonId && token.googleSub) {
        const a = await getAccountByGoogleSub(token.googleSub as string)
        if (a) {
          token.accountId = a.id
          token.linkedPersonId = a.linkedPersonId
        }
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
