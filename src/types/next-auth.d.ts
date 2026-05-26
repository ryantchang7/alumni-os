// Extend the next-auth Session + JWT shapes with our custom claims.
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    accountId?: string
    linkedPersonId?: string
    user: DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accountId?: string
    linkedPersonId?: string
    googleSub?: string
  }
}

export {}
