import { HttpLink } from "@apollo/client"
import { registerApolloClient } from "@apollo/experimental-nextjs-app-support/rsc"
import {
  NextSSRApolloClient,
  NextSSRInMemoryCache,
} from "@apollo/experimental-nextjs-app-support/ssr"

import { getClientSideGqlConfig } from "@/config/config"

export const { getClient } = registerApolloClient(() => {
  return new NextSSRApolloClient({
    cache: new NextSSRInMemoryCache(),
    link: new HttpLink({
      uri: getClientSideGqlConfig().coreGqlUrl,
      fetchOptions: { cache: "no-store" },

      // TODO uncomment this we start using otel
      //   fetch: (uri, options) => {
      //     const headersWithTrace = options?.headers || {}
      //     propagation.inject(context.active(), headersWithTrace)
      //     return fetch(String(uri), {
      //       ...options,
      //       headers: headersWithTrace,
      //     })
      //   },
    }),
  })
})
