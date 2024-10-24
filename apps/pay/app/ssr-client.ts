import { HttpLink } from "@apollo/client"
import {
  ApolloClient,
  InMemoryCache,
  registerApolloClient,
} from "@apollo/experimental-nextjs-app-support"
import { propagation, context } from "@opentelemetry/api"

import { env } from "@/env"

type ClientOptions = {
  token?: string
}

const createApolloClient = (options?: ClientOptions) => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: env.CORE_GQL_URL_INTRANET,
      fetchOptions: { cache: "no-store" },
      headers: {
        ...(options?.token ? { ["Oauth2-Token"]: options.token } : {}),
      },
      fetch: (uri, options) => {
        const headersWithTrace = options?.headers || {}
        propagation.inject(context.active(), headersWithTrace)
        return fetch(uri.toString(), {
          ...options,
          headers: headersWithTrace,
        })
      },
    }),
  })
}

export const apollo = {
  authenticated: (token: string) =>
    registerApolloClient(() => createApolloClient({ token })),
  unauthenticated: () => registerApolloClient(() => createApolloClient()),
}
