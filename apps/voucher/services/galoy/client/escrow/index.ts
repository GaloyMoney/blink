import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client"

import { env } from "@/env"

export const escrowApolloClient = () => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      headers: {
        "X-API-KEY": `${env.ESCROW_API_KEY}`,
        "x-requested-with": "XMLHttpRequest",
      },
      uri: env.NEXT_PUBLIC_CORE_URL,
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
}
