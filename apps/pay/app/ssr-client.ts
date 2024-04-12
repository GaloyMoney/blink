import { HttpLink } from "@apollo/client"
import { registerApolloClient } from "@apollo/experimental-nextjs-app-support/rsc"
import { propagation, context } from "@opentelemetry/api"
import {
  NextSSRApolloClient,
  NextSSRInMemoryCache,
} from "@apollo/experimental-nextjs-app-support/ssr"

import { env } from "@/env"

type ClientOptions = {
  token?: string
}

const createApolloClient = (options?: ClientOptions) => {
  return new NextSSRApolloClient({
    cache: new NextSSRInMemoryCache(),
    link: new HttpLink({
      uri: env.CORE_GQL_URL_INTRANET,
      fetchOptions: { cache: "no-store" },
      headers: {
        ...(options?.token ? { ["Oauth2-Token"]: options.token } : {}),
      },
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
}

export const apollo = {
  authenticated: (token: string) =>
    registerApolloClient(() => createApolloClient({ token })),
  unauthenticated: () => registerApolloClient(() => createApolloClient()),
}
