import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client"

import { registerApolloClient } from "@apollo/experimental-nextjs-app-support/rsc"

import { env } from "@/env"

export const apollo = (token: string) =>
  registerApolloClient(() => {
    return new ApolloClient({
      cache: new InMemoryCache(),
      link: new HttpLink({
        headers: {
          ["Oauth2-Token"]: token,
        },
        uri: env.NEXT_PUBLIC_GALOY_URL,
        fetchOptions: { cache: "no-store" },
        fetch: (uri, options) => {
          const headersWithTrace = options?.headers || {}
          return fetch(uri, {
            ...options,
            headers: headersWithTrace,
          })
        },
      }),
    })
  })
