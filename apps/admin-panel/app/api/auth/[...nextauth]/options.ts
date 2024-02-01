import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
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

const callbacks: Partial<CallbacksOptions> = {
  async signIn({ account, profile }) {
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
