import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client"
import { propagation, context } from "@opentelemetry/api"
import { env } from "@/env"

export const apolloClient = {
  UnAuthed: () => {
    return new ApolloClient({
      cache: new InMemoryCache(),
      link: new HttpLink({
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
    })
  },
}
