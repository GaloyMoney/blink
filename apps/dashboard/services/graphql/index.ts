import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client"
import { registerApolloClient } from "@apollo/experimental-nextjs-app-support/rsc"
import { propagation, context } from "@opentelemetry/api"

import { getServerSession } from "next-auth"

import { redirect } from "next/navigation"

import { env } from "@/env"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export const apollo = (token: string) => {
  return registerApolloClient(
    () =>
      new ApolloClient({
        cache: new InMemoryCache(),
        link: new HttpLink({
          headers: {
            ["Oauth2-Token"]: token,
          },
          uri: env.CORE_URL,
          fetchOptions: { cache: "no-store" },
          fetch: (uri, options) => {
            const headersWithTrace = options?.headers || {}
            propagation.inject(context.active(), headersWithTrace)
            return fetch(uri, {
              ...options,
              headers: headersWithTrace,
            })
          },
        }),
      }),
  ).getClient()
}

export const apolloClient = {
  authenticated: async (): Promise<ApolloClient<unknown>> => {
    const session = await getServerSession(authOptions)
    if (!session || !session?.accessToken) {
      return redirect("/api/auth/signin")
    }
    return apollo(session.accessToken)
  },
}
