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
    error?: string
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
        params: { scope: "read write offline" },
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
      // Initial sign in
      if (account && profile) {
        return {
          accessToken: account.access_token,
          accessTokenExpires: Date.now() + (account.expires_in as number) * 1000,
          refreshToken: account.refresh_token,
          id: profile.id,
          sub: profile.sub,
        }
      }

      // Return previous token if the access token has not expired yet
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token)
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

      // Pass any error from the token to the client
      if (token.error) {
        session.error = token.error
        return session
      }

      try {
        const client = apollo(token.accessToken).getClient()
        const fetchUserDataRes = await fetchUserData({ client })

        if (fetchUserDataRes instanceof Error) {
          throw fetchUserDataRes
        }

        session.userData = fetchUserDataRes
        session.sub = token.sub
        session.accessToken = token.accessToken
        return session
      } catch (error) {
        console.error("Error fetching user data:", error)
        session.error = "Failed to fetch user data"
        return session
      }
    },
  },
}

// Helper to refresh the access token
async function refreshAccessToken(token: any) {
  try {
    const url = `${env.HYDRA_PUBLIC}/oauth2/token`
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${env.CLIENT_ID}:${env.CLIENT_SECRET}`).toString('base64')}`,
      },
      method: "POST",
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      throw refreshedTokens
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    }
  } catch (error) {
    console.error("Error refreshing access token:", error)
    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
  }
}
