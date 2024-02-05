import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials" // Import CredentialsProvider
import type { Provider } from "next-auth/providers"

import { CallbacksOptions } from "next-auth"

import { env } from "../../../env"

const providers: Provider[] = [
  GoogleProvider({
    clientId: env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
    authorization: {
      params: {
        prompt: "consent",
        access_type: "offline",
        response_type: "code",
      },
    },
  }),
  GitHubProvider({
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  }),
]

if (env.NODE_ENV === "development") {
  providers.push(
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, req) => {
        if (credentials?.username === "admin" && credentials?.password === "admin") {
          return { id: "1", name: "admin", email: "test@galoy.io" }
        }
        return null
      },
    }),
  )
}

const callbacks: Partial<CallbacksOptions> = {
  async signIn({ account, profile, user }) {
    if (account?.provider === "credentials" && env.NODE_ENV === "development") {
      return !!user
    }

    if (!account || !profile) {
      return false
    }

    const email = profile?.email
    if (!email) {
      return false
    }

    if (account.provider === "google") {
      // eslint-disable-next-line no-new-wrappers
      const verified = new Boolean("email_verified" in profile && profile.email_verified)
      return verified && env.AUTHORIZED_EMAILS.includes(email)
    }

    if (account.provider === "github") {
      return env.AUTHORIZED_EMAILS.includes(email)
    }
    return false
  },
}

export const authOptions = {
  providers,
  callbacks,
}
