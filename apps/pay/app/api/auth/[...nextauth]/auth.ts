import { NextAuthOptions } from "next-auth"

import { env } from "@/env"
import { fetchUserData } from "@/app/graphql/queries/me-query"
import { MeQuery } from "@/lib/graphql/generated"

declare module "next-auth" {
  interface Profile {
    id: string
  }
  interface Session {
    sub: string | null
    accessToken: string
    userData?: MeQuery
  }
}

const type = "oauth" as const
export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "blink",
      clientId: env.CLIENT_ID,
      clientSecret: env.CLIENT_SECRET,
      wellKnown: `${env.HYDRA_PUBLIC}/.well-known/openid-configuration`,
      authorization: {
        params: { scope: "read" },
      },
      idToken: false,
      name: "Blink",
      type,
      profile(profile) {
        return {
          id: profile.sub,
        }
      },
    },
  ],
  debug: process.env.NODE_ENV === "development",
  secret: env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
        token.expiresAt = account.expires_at
        token.refreshToken = account.refresh_token
        token.id = profile?.id
      }
      return token
    },
    async session({ session, token }) {
      if (
        !token.accessToken ||
        !token.sub ||
        typeof token.accessToken !== "string" ||
        typeof token.sub !== "string"
      ) {
        throw new Error("Invalid token")
      }
      const res = await fetchUserData({ token: token.accessToken })

      if (!(res instanceof Error)) {
        session.userData = res.data
      }
      session.sub = token.sub
      session.accessToken = token.accessToken
      return session
    },
    async signIn({ account }) {
      if (!account?.access_token) {
        return false
      }
      const res = await fetchUserData({ token: account.access_token })
      if (res instanceof Error || !res.data.me?.username) {
        return "/error?errorMessage=This account does not have a username. Please update your profile from the mobile app and update your username"
      }
      return true
    },
  },
}
