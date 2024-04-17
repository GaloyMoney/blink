import { NextAuthOptions } from "next-auth"

import { env } from "@/env"
import { fetchUserData } from "@/services/galoy/query/me"
import { MeQuery } from "@/lib/graphql/generated"
import { apollo } from "@/services/galoy/client"

declare module "next-auth" {
  interface Profile {
    id: string
  }
  interface Session {
    sub: string | null
    accessToken: string
    userData: MeQuery
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
        params: { scope: "read write" },
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

      const client = apollo(token.accessToken).getClient()
      const fetchUserDataRes = await fetchUserData({ client })

      if (fetchUserDataRes instanceof Error) {
        throw fetchUserDataRes
      }

      session.userData = fetchUserDataRes
      session.sub = token.sub
      session.accessToken = token.accessToken
      return session
    },
  },
}
