import { ApolloClient, HttpLink, InMemoryCache, ApolloLink } from "@apollo/client"
import { propagation, context } from "@opentelemetry/api"

import { env } from "../../env"

const headerSettingLink = new ApolloLink((operation, forward) => {
  const request = operation.getContext().request
  operation.setContext({
    headers: {
      "x-real-ip": request?.headers.get("x-real-ip") || "",
      "x-forwarded-for": request?.headers.get("x-forwarded-for") || "",
    },
  })
  return forward(operation)
})

export const graphQlClient = (authToken?: string) => {
  const httpLink = new HttpLink({
    uri: env.GRAPHQL_ENDPOINT,
    fetchOptions: { cache: "no-store" },
    fetch: (uri, options) => {
      const headersWithTrace = options?.headers || {}
      propagation.inject(context.active(), headersWithTrace)
      return fetch(uri, {
        ...options,
        headers: headersWithTrace,
      })
    },
    headers: {
      ...(authToken ? { authorization: `Bearer ${authToken}` } : undefined),
    },
  })

  const link = ApolloLink.from([headerSettingLink, httpLink])
  return new ApolloClient({
    cache: new InMemoryCache(),
    link,
  })
}
